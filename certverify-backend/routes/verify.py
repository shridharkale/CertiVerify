import re
import time
from cachetools import TTLCache
from flask import Blueprint, jsonify
from firebase_config import db
from extensions import limiter

verify_bp = Blueprint("verify", __name__)

_cert_cache = TTLCache(maxsize=1000, ttl=300)

CERT_ID_RE = re.compile(r'^[A-Za-z0-9\-]{4,50}$')


def _valid_cert_id(cert_id: str) -> bool:
    return bool(CERT_ID_RE.match(cert_id))


def _public_cert(cert_id, cert_data):
    cert_data = cert_data or {}
    return {
        "recipient_name": cert_data.get("name"),
        "name": cert_data.get("name"),
        "event_name": cert_data.get("event_name"),
        "issued_date": cert_data.get("event_date") or cert_data.get("created_at"),
        "event_date": cert_data.get("event_date"),
        "cert_id": cert_data.get("cert_id", cert_id),
        "issued_by": cert_data.get("organisation") or cert_data.get("issued_by"),
        "organisation": cert_data.get("organisation"),
        "email": cert_data.get("email"),
        "role": cert_data.get("role"),
        "download_url": f"/certificates/download/{cert_id}",
    }


def _result(status, cert_id, cert_data=None, error=None, http=200):
    body = {
        "valid": status == "VALID",
        "status": status,
        "cert_id": cert_id,
        "certificate": cert_data,
        "data": _public_cert(cert_id, cert_data) if cert_data else None,
    }
    if error:
        body["error"] = error
        body["message"] = error
    return jsonify(body), http


@verify_bp.route("/api/verify/<cert_id>", methods=["GET"])
@limiter.limit("30 per minute")
def verify_certificate(cert_id):
    if not _valid_cert_id(cert_id):
        return _result("INVALID", cert_id, error="Invalid certificate ID format", http=400)

    now = time.time()
    cert_data = _cert_cache.get(cert_id)

    if cert_data is None:
        cert_doc = db.collection("certificates").document(cert_id).get()
        if not cert_doc.exists:
            return _result("INVALID", cert_id, error="Certificate not found.", http=404)
        cert_data = cert_doc.to_dict()
        _cert_cache[cert_id] = cert_data

    expiry = cert_data.get("expiry_date")
    if expiry and now > expiry:
        return _result("EXPIRED", cert_id, cert_data, error="This certificate has expired.")

    return _result("VALID", cert_id, cert_data)
