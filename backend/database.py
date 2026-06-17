import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

try:
    if not firebase_admin._apps:
        # Use a specific variable for Firebase to avoid collision with Vertex AI credentials
        cred_path = os.getenv("FIREBASE_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to default if not specified
            firebase_admin.initialize_app()
except Exception as e:
    print(f"Warning: Could not initialize Firebase. Please set FIREBASE_CREDENTIALS. Error: {e}")

try:
    db = firestore.client()
except Exception as e:
    db = None
    print(f"Warning: Could not initialize Firestore client. Error: {e}")

def get_db():
    return db
