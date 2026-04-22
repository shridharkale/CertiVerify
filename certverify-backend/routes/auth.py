import requests
import os
from flask import Blueprint, request, jsonify
from firebase_admin import auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Firebase Auth REST API — used for email/password sign-in
# Admin SDK can create users but can't sign them in (that's client-side)
FIREBASE_API_KEY = os.environ.get("FIREBASE_API_KEY")
FIREBASE_SIGNIN_URL = (
    f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    f"?key={FIREBASE_API_KEY}"
)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    organisation = data.get("organisation", "")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, password required"}), 400

    # ✅ Bug 2 fix — actually create the user in Firebase
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=name,
        )
        return jsonify({"message": "Registered successfully", "uid": user.uid}), 201

    except auth.EmailAlreadyExistsError:
        return jsonify({"error": "An account with this email already exists"}), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    # ✅ Bug 1 + 3 fix — call Firebase REST API to get a real ID token
    try:
        resp = requests.post(FIREBASE_SIGNIN_URL, json={
            "email": email,
            "password": password,
            "returnSecureToken": True,
        })
        resp_data = resp.json()

        if "error" in resp_data:
            # Firebase error messages are safe to forward here
            return jsonify({"error": resp_data["error"]["message"]}), 401

        id_token = resp_data["idToken"]

        # Verify the token and pull display name from Firebase
        decoded = auth.verify_id_token(id_token)

        return jsonify({
            "token": id_token,           # ✅ real Firebase ID token
            "user": {
                "email": decoded.get("email"),
                "name": decoded.get("name", email.split("@")[0]),
                "uid": decoded.get("uid"),
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Login failed", "details": str(e)}), 500