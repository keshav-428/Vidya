"""
Classes — the link between a teacher and their students.

Phase 0 of the teacher app (see docs/teacher-app-plan.md). Until this exists
every student is a standalone document and nothing can be shown to a teacher.

Deliberately additive: nothing here touches how the student app reads or writes
`user_profiles`. A student who never joins a class is unaffected — `class_ids`
is simply absent, exactly as it is today.

Students join by CODE, written on the blackboard. The alternative — a teacher
typing in 40 children's accounts — does not scale to a real classroom and drags
minors' credentials through a third party.
"""
import os
import random
import string
from datetime import datetime, timezone

from database import get_db

CLASSES = "classes"
PROFILES = "user_profiles"

# Unambiguous alphabet: no O/0, I/1, S/5 — the code gets copied off a blackboard
# by 11-year-olds, so the characters that get misread are left out.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789"
CODE_LENGTH = int(os.getenv("CLASS_CODE_LENGTH", "6"))
CODE_ATTEMPTS = int(os.getenv("CLASS_CODE_ATTEMPTS", "12"))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db():
    db = get_db()
    if db is None:
        raise RuntimeError("Firestore is not configured")
    return db


def _find_by_code(code: str):
    """The class document for a join code, or None."""
    db = _db()
    hits = db.collection(CLASSES).where("join_code", "==", code).limit(1).stream()
    for doc in hits:
        return doc
    return None


def generate_join_code() -> str:
    """A short code that is not already in use.

    Collisions are rare but not impossible, so this checks rather than hopes.
    """
    for _ in range(CODE_ATTEMPTS):
        code = "".join(random.choices(CODE_ALPHABET, k=CODE_LENGTH))
        if _find_by_code(code) is None:
            return code
    raise RuntimeError("Could not allocate an unused class code")


def create_class(teacher_uid: str, name: str, grade: int) -> dict:
    """Creates a class owned by this teacher and returns it, code included."""
    db = _db()
    code = generate_join_code()
    data = {
        "teacher_id": teacher_uid,
        "name": name,
        "grade": grade,
        "join_code": code,
        "created_at": _now(),
        "archived": False,
    }
    ref = db.collection(CLASSES).document()
    ref.set(data)
    return {"class_id": ref.id, **data}


def list_classes(teacher_uid: str) -> list:
    """Every class this teacher owns, newest first."""
    db = _db()
    docs = db.collection(CLASSES).where("teacher_id", "==", teacher_uid).stream()
    out = [{"class_id": d.id, **(d.to_dict() or {})} for d in docs]
    out.sort(key=lambda c: c.get("created_at") or "", reverse=True)
    return [c for c in out if not c.get("archived")]


def get_class(class_id: str, teacher_uid: str) -> dict:
    """One class — only for the teacher who owns it.

    Raises PermissionError for anyone else: a class holds children's records,
    so ownership is checked on every read rather than trusted from the client.
    """
    db = _db()
    doc = db.collection(CLASSES).document(class_id).get()
    if not doc.exists:
        raise LookupError("No such class")
    data = doc.to_dict() or {}
    if data.get("teacher_id") != teacher_uid:
        raise PermissionError("Not your class")
    return {"class_id": doc.id, **data}


def join_class(code: str, student_uid: str) -> dict:
    """Puts a student into the class with this code.

    Idempotent: entering the same code twice leaves one membership, so a child
    who taps twice does not end up counted twice.
    """
    doc = _find_by_code((code or "").strip().upper())
    if doc is None:
        raise LookupError("No class has that code")
    data = doc.to_dict() or {}
    if data.get("archived"):
        raise LookupError("That class is closed")

    db = _db()
    ref = db.collection(PROFILES).document(student_uid)
    snap = ref.get()
    profile = (snap.to_dict() or {}) if snap.exists else {}
    class_ids = list(profile.get("class_ids") or [])
    if doc.id not in class_ids:
        class_ids.append(doc.id)
    # merge=True so joining a class cannot clear a profile the student app owns
    ref.set({"class_ids": class_ids}, merge=True)
    return {"class_id": doc.id, "name": data.get("name"), "grade": data.get("grade")}


def roster(class_id: str, teacher_uid: str) -> list:
    """Who is in the class. Ownership-checked via get_class first."""
    get_class(class_id, teacher_uid)
    db = _db()
    docs = db.collection(PROFILES).where("class_ids", "array_contains", class_id).stream()
    out = []
    for d in docs:
        p = d.to_dict() or {}
        out.append({
            "student_id": d.id,
            "name": p.get("name") or p.get("student_name") or "",
            "grade": p.get("grade") or p.get("class_level"),
        })
    out.sort(key=lambda s: (s.get("name") or "").lower())
    return out


def leave_class(class_id: str, student_uid: str) -> dict:
    """Removes a student from a class without touching the rest of the profile."""
    db = _db()
    ref = db.collection(PROFILES).document(student_uid)
    snap = ref.get()
    profile = (snap.to_dict() or {}) if snap.exists else {}
    class_ids = [c for c in (profile.get("class_ids") or []) if c != class_id]
    ref.set({"class_ids": class_ids}, merge=True)
    return {"class_id": class_id, "left": True}
