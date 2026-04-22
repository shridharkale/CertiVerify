"""
routes/certificates.py
-----------------------
FIXES APPLIED:
  #1 - LLM timeout → pandas fallback duplicate checker
  #2 - QR URL → no hardcoded IP, reads from env via qr_generator
  #3 - Account separation → issuer always from verified Firebase token (not request body)
  #4 - temp_participants scoped by issuer+event_name to prevent collision
  #5 - Path traversal fix in /download via cert_id validation
"""

from flask import send_file, Blueprint, request, jsonify
import io
import os
import re
import random
import string
from datetime import datetime

import pandas as pd

from utils.qr_generator import generate_qr
from utils.cert_generator import generate_certificate
from firebase_config import db, auth   # ✅ auth imported at top (was at bottom before)

try:
    from utils.duplicate_checker import check_duplicates_with_llm
    LLM_AVAILABLE = True
except Exception:
    LLM_AVAILABLE = False
    print("[WARN] LLM duplicate checker not available. Pandas fallback will be used.")

temp_participants = {}

certificates_bp = Blueprint("certificates", __name__, url_prefix="/api/certificates")


# ✅ FIX #3 — Auth helper: reads Firebase token from header, never from request body
def get_verified_email(req):
    """Extract and verify Firebase ID token from Authorization header."""
    token = req.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        decoded = auth.verify_id_token(token)
        return decoded.get("email", "").strip().lower()
    except Exception:
        return None


def generate_cert_id():
    year = datetime.now().year
    random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    cert_id = f"CERT-{year}-{random_part}"
    print(f"[DEBUG] Generated cert_id: {cert_id}")
    return cert_id


# ✅ FIX #1 — Pandas fallback when LLM times out
def pandas_duplicate_check(participants):
    df = pd.DataFrame(participants)
    df["name_lower"]  = df["name"].astype(str).str.strip().str.lower()
    df["email_lower"] = df["email"].astype(str).str.strip().str.lower()
    is_duplicate = df.duplicated(subset=["name_lower", "email_lower"], keep="first")
    duplicates   = df[is_duplicate].to_dict(orient="records")
    clean        = df[~is_duplicate].to_dict(orient="records")
    print(f"[Pandas] Found {len(duplicates)} duplicates, {len(clean)} clean entries.")
    return {"duplicates": duplicates, "suspicious": [], "clean": clean}


@certificates_bp.route("/upload-csv", methods=["POST"])
def upload_csv():
    print("[DEBUG] /upload-csv endpoint hit")

    # ✅ FIX #3 — verify identity before accepting upload
    issuer = get_verified_email(request)
    if not issuer:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded.", "keys_received": list(request.files.keys())}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "The uploaded file has no filename."}), 400

    try:
        file.stream.seek(0)
        file_bytes  = file.read()
        file_stream = io.BytesIO(file_bytes)
        df          = pd.read_csv(file_stream)
        df.columns  = df.columns.str.strip().str.lower()
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV file: {str(e)}"}), 422

    required_columns = {"name", "email", "role"}
    if not required_columns.issubset(set(df.columns)):
        missing = required_columns - set(df.columns)
        return jsonify({"error": f"CSV is missing required columns: {missing}"}), 422

    try:
        df["name"]  = df["name"].astype(str).str.strip().str.lower()
        df["email"] = df["email"].astype(str).str.strip().str.lower()
        df["role"]  = df["role"].astype(str).str.strip()
    except Exception as e:
        return jsonify({"error": f"Error while cleaning data: {str(e)}"}), 500

    try:
        is_duplicate = df.duplicated(subset=["name", "email"], keep=False)
        clean_df     = df[~is_duplicate]
        duplicate_df = df[is_duplicate]
        participants = clean_df.to_dict(orient="records")
        duplicates   = duplicate_df.to_dict(orient="records")
    except Exception as e:
        return jsonify({"error": f"Error during duplicate detection: {str(e)}"}), 500

    event_name = request.form.get("event_name", "default")

    # ✅ FIX #4 — scope temp storage by issuer+event to prevent cross-user collision
    temp_key = f"{issuer}__{event_name}"
    temp_participants[temp_key] = participants

    return jsonify({
        "participants": participants,
        "duplicates":   duplicates,
        "upload_id":    event_name,
        "total_rows":   len(participants),
    }), 200


@certificates_bp.route("/generate", methods=["POST"])
def generate_certificates():
    print("[DEBUG] /generate endpoint hit")

    # ✅ FIX #3 — issuer always from verified token, never from request body
    issuer = get_verified_email(request)
    if not issuer:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    if not data:
        return jsonify({"error": "Request body is empty."}), 400

    event_name = data.get("event_name", "").strip()
    event_date = data.get("event_date", "").strip()

    # ✅ FIX #4 — look up participants using scoped key
    temp_key     = f"{issuer}__{event_name}"
    participants = data.get("participants") or temp_participants.get(temp_key, [])

    if not event_name:
        return jsonify({"error": "'event_name' is required."}), 400
    if not event_date:
        return jsonify({"error": "'event_date' is required."}), 400
    if not participants or not isinstance(participants, list):
        return jsonify({"error": "'participants' must be a non-empty list."}), 400

    # ── Duplicate Check: LLM with pandas fallback ────────────────────────────
    try:
        if LLM_AVAILABLE:
            print("[DEBUG] Trying LLM duplicate check...")
            llm_result = check_duplicates_with_llm(participants)
        else:
            raise Exception("LLM not available")
    except Exception as e:
        print(f"[WARN] LLM check failed: {e}. Using pandas fallback.")
        llm_result = pandas_duplicate_check(participants)

    flagged_emails = set()
    for entry in llm_result.get("duplicates", []):
        flagged_emails.add(entry.get("email", "").lower())
    for entry in llm_result.get("suspicious", []):
        flagged_emails.add(entry.get("email", "").lower())

    participants = [
        p for p in participants
        if p.get("email", "").lower() not in flagged_emails
    ]
    print(f"[DEBUG] {len(participants)} clean participants after dedup")

    # ── Generate certificates ─────────────────────────────────────────────────
    logo_path       = "assets/logo.png"
    generated_count = 0
    errors          = []

    for index, person in enumerate(participants):
        try:
            name  = str(person.get("name", "")).strip()
            email = str(person.get("email", "")).strip().lower()
            role  = str(person.get("role", "Participant")).strip()

            if not name or not email:
                errors.append({"index": index, "reason": "Missing name or email", "data": person})
                continue

            cert_id = generate_cert_id()

            # ✅ FIX #2 — QR URL built from env variable inside qr_generator
            qr_path = generate_qr(cert_id=cert_id)

            pdf_path = generate_certificate(
                name=name.title(),
                event=event_name,
                date=event_date,
                cert_id=cert_id,
                logo_path=logo_path,
                qr_path=qr_path,
                role=role,
            )

            cert_data = {
                "cert_id":    cert_id,
                "name":       name.title(),
                "email":      email,
                "role":       role,
                "event_name": event_name,
                "event_date": event_date,
                "pdf_path":   pdf_path,
                "qr_path":    qr_path,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "verified":   False,
                "issued_by":  issuer,  # ✅ FIX #3 — always from verified token
            }

            db.collection("certificates").document(cert_id).set(cert_data)
            generated_count += 1

        except Exception as e:
            errors.append({"index": index, "reason": str(e), "data": person})
            continue

    # ✅ Clean up temp storage after generation
    temp_participants.pop(temp_key, None)

    response = {"message": "Certificates generated successfully", "count": generated_count}
    if errors:
        response["warnings"] = errors

    return jsonify(response), 200


@certificates_bp.route("/list", methods=["GET"])
def list_certificates():
    # ✅ FIX #2 & #3 — only return certs for the verified logged-in user
    user_email = get_verified_email(request)
    if not user_email:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        docs  = db.collection("certificates").where("issued_by", "==", user_email).stream()
        certs = [doc.to_dict() for doc in docs]
        return jsonify({"certificates": certs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/batch/<batch_id>", methods=["GET"])
def get_batch(batch_id):
    # ✅ FIX #3 — only return batch if it belongs to the requesting user
    user_email = get_verified_email(request)
    if not user_email:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        docs = (
            db.collection("certificates")
            .where("event_name", "==", batch_id)
            .where("issued_by", "==", user_email)   # ✅ scoped to user
            .stream()
        )
        certificates = [doc.to_dict() for doc in docs]
        if not certificates:
            return jsonify({"error": "No certificates found for this batch"}), 404
        return jsonify({"batch_id": batch_id, "certificates": certificates, "count": len(certificates)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/download/<cert_id>", methods=["GET"])
def download_certificate(cert_id):
    # ✅ FIX #5 — validate cert_id format to prevent path traversal
    if not re.match(r'^CERT-\d{4}-[A-Z0-9]{4}$', cert_id):
        return jsonify({"error": "Invalid certificate ID format"}), 400

    pdf_path = os.path.join("generated_certs", f"{cert_id}.pdf")
    if not os.path.exists(pdf_path):
        return jsonify({"error": "Certificate not found"}), 404

    return send_file(
        pdf_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{cert_id}.pdf"
    )


@certificates_bp.route("/check-duplicates", methods=["POST"])
def check_duplicates():
    try:
        data         = request.get_json()
        participants = data.get("participants", [])
        if not participants:
            return jsonify({"error": "No participants provided"}), 400
        result = check_duplicates_with_llm(participants) if LLM_AVAILABLE else pandas_duplicate_check(participants)
        return jsonify(result), 200
    except Exception as e:
        print(f"[ERROR] Duplicate check route failed: {e}")
        return jsonify({"error": str(e)}), 500


@certificates_bp.route("/public-stats", methods=["GET"])
def public_stats():
    """Returns total cert count for Landing page — no auth needed."""
    try:
        docs  = db.collection("certificates").stream()
        total = sum(1 for _ in docs)
        return jsonify({"total": total}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500