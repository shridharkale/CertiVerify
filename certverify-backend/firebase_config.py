import firebase_admin
from firebase_admin import credentials, firestore

# Only initialize once (avoids error if this file is imported multiple times)
if not firebase_admin._apps:
    # Load your Firebase service account key JSON file
    # Download this from Firebase Console → Project Settings → Service Accounts
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# Create a Firestore client — import this in any route file that needs the DB
db = firestore.client()
