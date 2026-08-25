import os
import sys
import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

# ── Validate required env vars before touching Firebase ────────────────────────
REQUIRED_VARS = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_STORAGE_BUCKET",
]
missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
if missing:
    print(f"[firebase_config] FATAL: Missing env vars: {missing}", file=sys.stderr)
    sys.exit(1)

# ── Build credentials dict ─────────────────────────────────────────────────────
private_key = os.environ.get("FIREBASE_PRIVATE_KEY", "")
if "\\n" in private_key:
    private_key = private_key.replace("\\n", "\n")

firebase_config = {
    "type": "service_account",
    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
    "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": private_key,
    "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
}

# ── Guard against double-initialization (dev reload crash) ────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred, {
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET")
    })

db = firestore.client()
# Re-export so routes can `from firebase_config import db, auth`
__all__ = ["db", "auth"]