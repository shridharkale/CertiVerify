import firebase_admin
from firebase_admin import credentials, firestore, auth  # ✅ add auth

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
# ✅ auth is importable directly from firebase_admin — no extra line needed
# just import it wherever you need: from firebase_admin import auth