import logging
import os
import re

import requests
from flask import Blueprint, jsonify, request
from firebase_admin import auth as firebase_auth

from extensions import limiter

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

FIREBASE_ERROR_MAP = {
    "EMAIL_NOT_FOUND": "No account found with that email.",
    "INVALID_PASSWORD": "Incorrect email or password.",
    "INVALID_LOGIN_CREDENTIALS": "Incorrect email or password.",
    "INVALID_EMAIL": "Please enter a valid email address.",
    "USER_DISABLED": "This account has been disabled.",
    "TOO_MANY_ATTEMPTS_TRY_LATER": "Too many attempts. Please try again later.",
    "EMAIL_EXISTS": "An account with this email already exists.",
    "WEAK_PASSWORD": "Password is too weak. Use at least 8 characters.",
    "MISSING_PASSWORD": "Password is required.",
    "OPERATION_NOT_ALLOWED": "Email/password sign-in is not enabled.",
}


def _api_key():
    return os.environ.get("FIREBASE_API_KEY")


def _signin_url():
    key = _api_key()
    if not key:
        return None
    return (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={key}"
    )


def _friendly_firebase_error(code):
    if not code:
        return "Incorrect email or password."
    short = str(code).split(":")[0].strip()
    return FIREBASE_ERROR_MAP.get(short, "Incorrect email or password.")


def _user_payload(id_token, fallback_email="", fallback_name=""):
    decoded = firebase_auth.verify_id_token(id_token)
    email = decoded.get("email") or fallback_email
    name = decoded.get("name") or fallback_name or (email.split("@")[0] if email else "")
    return {
        "token": id_token,
        "user": {
            "email": email,
            "name": name,
            "uid": decoded.get("uid"),
        },
    }


def _sign_in_with_password(email, password):
    url = _signin_url()
    if not url:
        return None, (jsonify({"error": "Authentication is not configured."}), 503)

    resp = requests.post(
        url,
        json={"email": email, "password": password, "returnSecureToken": True},
        timeout=20,
    )
    resp_data = resp.json() if resp.content else {}

    if "error" in resp_data:
        message = _friendly_firebase_error(resp_data["error"].get("message"))
        return None, (jsonify({"error": message}), 401)

    return resp_data, None


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json(force=True, silent=True) or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not name or not email or not password:
            return jsonify({"error": "Name, email, and password are required"}), 400
        if not EMAIL_RE.match(email):
            return jsonify({"error": "Please enter a valid email address"}), 400
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name,
        )

        resp_data, err = _sign_in_with_password(email, password)
        if err:
            return jsonify({
                "error": "Account created, but automatic sign-in failed. Please sign in.",
                "uid": user.uid,
            }), 201

        payload = _user_payload(
            resp_data["idToken"],
            fallback_email=email,
            fallback_name=name,
        )
        payload["message"] = "Registered successfully"
        payload["uid"] = user.uid
        return jsonify(payload), 201

    except firebase_auth.EmailAlreadyExistsError:
        return jsonify({"error": "An account with this email already exists"}), 409
    except Exception:
        logging.exception("Register error")
        return jsonify({"error": "An error occurred. Please try again."}), 500


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        if not EMAIL_RE.match(email):
            return jsonify({"error": "Please enter a valid email address"}), 400

        resp_data, err = _sign_in_with_password(email, password)
        if err:
            return err

        return jsonify(_user_payload(
            resp_data["idToken"],
            fallback_email=email,
            fallback_name=resp_data.get("displayName", ""),
        )), 200

    except Exception:
        logging.exception("Login error")
        return jsonify({"error": "An error occurred. Please try again."}), 500
