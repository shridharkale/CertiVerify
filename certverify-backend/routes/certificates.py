"""
routes/certificates.py
"""

from flask import send_file, Blueprint, request, jsonify
import io
import os
import re
import secrets
from datetime import datetime
from google.cloud.firestore_v1.base_query import FieldFilter

import pandas as pd

from utils.qr_generator import generate_qr
from utils.cert_generator import generate_certificate
from firebase_config import db, auth
from extensions import limiter


# Removed LLM duplicate checker imports as per instructions


temp_participants = {}

certificates_bp = Blueprint("certificates", __name__, url_prefix="/api/certificates")


def get_verified_email(req):
    token = req.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        decoded = auth.verify_id_token(token)
        return decoded.get("email", "").strip().lower()
    except Exception:
        return None


def generate_cert_id(event_name=""):
    slug = re.sub(r"[^A-Za-z0-9]", "", event_name or "")[:8].upper() or "EVENT"
    return f"CERT-{slug}-{secrets.token_hex(3).upper()}"


def smart_duplicate_check(participants, event_name, db):
    """
    Two-level duplicate detection:
    1. Within current batch: same email = duplicate
    2. Against Firestore: same email + same event = already certified
    Returns: clean_list, duplicates_list, already_certified_list
    """
    # Level 1: within batch
    seen = {}
    batch_clean = []
    batch_dups = []
    for p in participants:
        email = p.get("email", "").strip().lower()
        if email in seen:
            batch_dups.append({**p, "reason": "Duplicate in CSV"})
        else:
            seen[email] = True
            batch_clean.append(p)
    
    # Level 2: against Firestore
    clean = []
    already_certified = []
    for p in batch_clean:
        email = p.get("email", "").strip().lower()
        existing = db.collection("certificates")\
            .where(filter=FieldFilter("email", "==", email))\
            .where(filter=FieldFilter("event_name", "==", event_name))\
            .limit(1)\
            .stream()
        if any(True for _ in existing):
            already_certified.append({
                **p, 
                "reason": f"Already has certificate for {event_name}"
            })
        else:
            clean.append(p)
    
    return clean, batch_dups + already_certified


def _parse_participants_csv(file):
    file.stream.seek(0)
    df = pd.read_csv(io.BytesIO(file.read()))
    df.columns = df.columns.str.strip().str.lower()
    required_columns = {"name", "email"}
    if not required_columns.issubset(set(df.columns)):
        missing = required_columns - set(df.columns)
        raise ValueError(f"Missing columns: {', '.join(sorted(missing))}")

    df["name"] = df["name"].astype(str).str.strip()
    df["email"] = df["email"].astype(str).str.strip().str.lower()
    if "role" in df.columns:
        df["role"] = df["role"].astype(str).str.strip()
    else:
        df["role"] = "Participant"

    is_duplicate = df.duplicated(subset=["name", "email"], keep="first")
    participants = df[~is_duplicate].to_dict(orient="records")
    duplicates = df[is_duplicate].to_dict(orient="records")
    return participants, duplicates


def _issue_certificates(issuer, event_name, event_date, organisation, participants, expiry_date=None):
    clean_participants, duplicates = smart_duplicate_check(
        participants, event_name, db
    )

    expiry_timestamp = None
    if expiry_date:
        try:
            if isinstance(expiry_date, (int, float)):
                expiry_timestamp = int(expiry_date)
            else:
                dt = datetime.strptime(str(expiry_date).split("T")[0], "%Y-%m-%d")
                expiry_timestamp = int(dt.timestamp())
        except Exception:
            expiry_timestamp = None

    generated_count = 0
    errors = []

    for index, person in enumerate(clean_participants):
        try:
            name = str(person.get("name", "")).strip()
            email = str(person.get("email", "")).strip().lower()
            role = str(person.get("role", "Participant")).strip() or "Participant"

            if not name or not email:
                errors.append({"index": index, "reason": "Missing name or email", "data": person})
                continue

            cert_id = generate_cert_id(event_name)
            qr_path = generate_qr(cert_id=cert_id)

            generate_certificate(
                name=name.title(),
                event=event_name,
                date=event_date,
                cert_id=cert_id,
                logo_path="assets/logo.png",
                qr_path=qr_path,
                role=role,
                organisation=organisation,
            )

            cert_data = {
                "cert_id": cert_id,
                "name": name.title(),
                "email": email,
                "role": role,
                "event_name": event_name,
                "event_date": event_date,
                "organisation": organisation,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "verified": False,
                "issued_by": issuer,
            }
            if expiry_timestamp is not None:
                cert_data["expiry_date"] = expiry_timestamp

            db.collection("certificates").document(cert_id).set(cert_data)
            generated_count += 1
        except Exception as e:
            print(f"[GENERATE ERROR index={index}] {type(e).__name__}: {e}", flush=True)
            errors.append({"index": index, "reason": str(e), "data": person})

    response = {
        "message": "Certificates generated successfully",
        "count": generated_count,
        "skipped": len(duplicates),
        "skip_reasons": duplicates,
    }
    if errors:
        response["warnings"] = errors
    return response


@certificates_bp.route("/issue", methods=["POST"])
def issue_certificates():
    issuer = get_verified_email(request)
    if not issuer:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "No filename."}), 400

    event_name = (request.form.get("event_name") or "").strip()
    event_date = (request.form.get("event_date") or "").strip()
    organisation = (
        request.form.get("organisation") or request.form.get("issued_by") or ""
    ).strip()
    expiry_date = request.form.get("expiry_date")

    if not event_name:
        return jsonify({"error": "'event_name' is required."}), 400
    if not event_date:
        return jsonify({"error": "'event_date' is required."}), 400

    try:
        participants, _csv_dups = _parse_participants_csv(file)
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 422

    if not participants:
        return jsonify({"error": "CSV has no valid recipient rows."}), 422
    if len(participants) > 2000:
        return jsonify({"error": "Batch too large. Maximum 2000 rows per request."}), 422

    return jsonify(_issue_certificates(
        issuer, event_name, event_date, organisation, participants, expiry_date
    )), 200


@certificates_bp.route("/upload-csv", methods=["POST"])
def upload_csv():
    issuer = get_verified_email(request)
    if not issuer:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No filename."}), 400

    try:
        participants, duplicates = _parse_participants_csv(file)
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 422

    event_name = request.form.get("event_name", "default")
    temp_key = f"{issuer}__{event_name}"
    temp_participants[temp_key] = participants

    return jsonify({
        "participants": participants,
        "duplicates": duplicates,
        "upload_id": event_name,
        "total_rows": len(participants),
    }), 200


@certificates_bp.route("/generate", methods=["POST"])
def generate_certificates():
    issuer = get_verified_email(request)
    if not issuer:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    event_name = (data.get("event_name") or "").strip()
    event_date = (data.get("event_date") or "").strip()
    organisation = (data.get("organisation") or "").strip()
    participants = data.get("participants") or []
    expiry_date = data.get("expiry_date")

    if not event_name:
        return jsonify({"error": "'event_name' is required."}), 400
    if not event_date:
        return jsonify({"error": "'event_date' is required."}), 400
    if not participants or not isinstance(participants, list):
        return jsonify({"error": "'participants' must be a non-empty list."}), 400
    if len(participants) > 2000:
        return jsonify({"error": "Batch too large. Maximum 2000 rows per request."}), 422

    return jsonify(_issue_certificates(
        issuer, event_name, event_date, organisation, participants, expiry_date
    )), 200


@certificates_bp.route("", methods=["GET"])
@certificates_bp.route("/", methods=["GET"])
@certificates_bp.route("/list", methods=["GET"])
def list_certificates():
    user_email = get_verified_email(request)
    if not user_email:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        docs  = db.collection("certificates").where(filter=FieldFilter("issued_by", "==", user_email)).stream()
        certs = [doc.to_dict() for doc in docs]
        return jsonify({"certificates": certs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/batch/<batch_id>", methods=["GET"])
def get_batch(batch_id):
    user_email = get_verified_email(request)
    if not user_email:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        docs = (
            db.collection("certificates")
            .where(filter=FieldFilter("event_name", "==", batch_id))
            .where(filter=FieldFilter("issued_by", "==", user_email))
            .stream()
        )
        certificates = [doc.to_dict() for doc in docs]
        if not certificates:
            return jsonify({"error": "No certificates found"}), 404
        return jsonify({
            "batch_id": batch_id,
            "certificates": certificates,
            "count": len(certificates)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/download/<cert_id>", methods=["GET"])
@limiter.limit("30 per minute")
def download_certificate(cert_id):
    if not re.match(r'^CERT-[A-Za-z0-9\-]{4,50}$', cert_id):
        return jsonify({"error": "Invalid certificate ID format"}), 400

    try:
        doc = db.collection("certificates").document(cert_id).get()
        if not doc.exists:
            return jsonify({"error": "Certificate not found"}), 404

        cert = doc.to_dict()
        qr_path = generate_qr(cert_id=cert_id)

        pdf_bytes = generate_certificate(
            name=cert["name"],
            event=cert["event_name"],
            date=cert["event_date"],
            cert_id=cert_id,
            logo_path="assets/logo.png",
            qr_path=qr_path,
            role=cert.get("role", "Participant"),
            organisation=cert.get("organisation", ""),
        )

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{cert_id}.pdf"
        )

    except Exception as e:
        print(f"[DOWNLOAD ERROR] {e}")
        return jsonify({"error": str(e)}), 500




@certificates_bp.route("/public-stats", methods=["GET"])
@limiter.limit("60 per hour")
def public_stats():
    try:
        docs  = db.collection("certificates").stream()
        total = sum(1 for _ in docs)
        return jsonify({"total": total}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/public-event/<event_name>", methods=["GET"])
def public_event_gallery(event_name):
    try:
        docs = db.collection("certificates").where(filter=FieldFilter("event_name", "==", event_name)).stream()
        certs = []
        for doc in docs:
            d = doc.to_dict()
            certs.append({
                "cert_id": d.get("cert_id"),
                "name": d.get("name"),
                "role": d.get("role"),
                "event_name": d.get("event_name"),
                "event_date": d.get("event_date")
            })
        return jsonify({"certificates": certs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500