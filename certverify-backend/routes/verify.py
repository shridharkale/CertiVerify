from flask import Blueprint, jsonify

# Import the shared Firestore client from firebase_config.py
from firebase_config import db

# Create a Blueprint — this groups related routes together
# "verify" is the name of this blueprint
verify_bp = Blueprint("verify", __name__)


@verify_bp.route("/api/verify/<cert_id>", methods=["GET"])
def verify_certificate(cert_id):
    """
    GET /api/verify/<cert_id>

    Looks up a certificate by its unique ID in Firestore.
    Returns VALID with certificate details if found,
    or INVALID if the cert_id doesn't exist.

    Example:
        GET /api/verify/abc-123-xyz
    """

    # --- Step 1: Reference the "certificates" collection in Firestore ---
    # Think of a collection like a table, and each document like a row
    cert_ref = db.collection("certificates").document(cert_id)

    # --- Step 2: Fetch the document from Firestore ---
    # .get() actually makes the network call to Firebase
    cert_doc = cert_ref.get()

    # --- Step 3: Check if the document exists ---
    if cert_doc.exists:
        # --- Step 4a: Document found → convert it to a Python dict ---
        cert_data = cert_doc.to_dict()

        # Return a JSON response with status VALID and all certificate fields
        return jsonify({
            "status"     : "VALID",
            "cert_id"    : cert_id,
            "certificate": cert_data   # e.g. name, email, event, date, role
        }), 200

    else:
        # --- Step 4b: Document not found → return INVALID status ---
        return jsonify({
            "status" : "INVALID",
            "cert_id": cert_id,
            "message": "Certificate not found."
        }), 404
