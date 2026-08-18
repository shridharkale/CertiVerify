import re
import time
from cachetools import TTLCache
from flask import Blueprint, jsonify
from firebase_config import db
from app import limiter

verify_bp = Blueprint("verify", __name__)

# ── Bounded LRU cache — replaces any unbounded dict ──────────────────────────
# Max 1000 entries, each expires after 5 minutes
_cert_cache = TTLCache(maxsize=1000, ttl=300)

# ── Input validator — alphanumeric + hyphens only, 4–50 chars ────────────────
CERT_ID_RE = re.compile(r'^[A-Za-z0-9\-]{4,50}$')

def _valid_cert_id(cert_id: str) -> bool:
    return bool(CERT_ID_RE.match(cert_id))

@verify_bp.route("/api/verify/<cert_id>", methods=["GET"])
@limiter.limit("30 per minute")
def verify_certificate(cert_id):
    # ── Input validation ───────────────────────────────────────────────────
    if not _valid_cert_id(cert_id):
        return jsonify({"valid": False, "error": "Invalid certificate ID format"}), 400

    # ── Cache lookup ───────────────────────────────────────────────────────
    if cert_id in _cert_cache:
        cert_data = _cert_cache[cert_id]
        expiry = cert_data.get("expiry_date")
        now = time.time()
        if expiry and now > expiry:
            return jsonify({"status": "EXPIRED", "cert_id": cert_id,
                          "certificate": cert_data}), 200
        return jsonify({"status": "VALID", "cert_id": cert_id,
                       "certificate": cert_data}), 200
    
    # ── Firestore lookup ───────────────────────────────────────────────────
    cert_ref = db.collection("certificates").document(cert_id)
    cert_doc = cert_ref.get()
    
    if cert_doc.exists:
        cert_data = cert_doc.to_dict()
        _cert_cache[cert_id] = cert_data
        
        expiry = cert_data.get("expiry_date")
        now = time.time()
        if expiry and now > expiry:
            return jsonify({"status": "EXPIRED", "cert_id": cert_id,
                          "certificate": cert_data}), 200
        return jsonify({"status": "VALID", "cert_id": cert_id,
                       "certificate": cert_data}), 200
    else:
        return jsonify({"status": "INVALID", "cert_id": cert_id,
                       "message": "Certificate not found."}), 404
