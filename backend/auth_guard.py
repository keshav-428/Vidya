"""
Who is calling — verified from a Firebase ID token.

The student endpoints take a user id in the body and trust it, which is fine
while every request only reaches that student's own record. A class holds OTHER
people's children, so the teacher endpoints cannot work that way: the caller has
to prove who they are.

Used only by the new class routes. Nothing existing changes.
"""
from fastapi import Header, HTTPException
from firebase_admin import auth as fb_auth

import database  # noqa: F401  — imported for its Firebase initialisation side effect


def require_uid(authorization: str = Header(None)) -> str:
    """FastAPI dependency: returns the caller's Firebase uid, or 401.

    Expects the standard `Authorization: Bearer <id-token>` header, which the
    Firebase client SDK hands you with `user.getIdToken()`.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign-in required")
    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Sign-in expired or invalid")
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Sign-in required")
    return uid
