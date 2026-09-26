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


# ─────────────────────────────────────────────────────────────
#  Class summary — "what should I reteach tomorrow, and who should
#  I sit with?", which is the only question the teacher app answers.
#
#  Aggregated HERE rather than in the browser: a teacher's phone should
#  never download 38 children's full records, and those records should
#  not sit in a browser at all.
# ─────────────────────────────────────────────────────────────

# Mirrors src/lib/mastery.ts and src/lib/progress.ts. If a threshold moves
# there it has to move here, or a teacher and a student will be told two
# different things about the same number.
MIN_EVIDENCE = int(os.getenv("CLASS_MIN_EVIDENCE", "5"))      # scored questions before a level means anything
STALE_DAYS = int(os.getenv("CLASS_STALE_DAYS", "7"))          # silence that is worth a teacher's attention
MAX_RETEACH = int(os.getenv("CLASS_MAX_RETEACH", "3"))        # a teacher has one period, not ten
MAX_ATTENTION = int(os.getenv("CLASS_MAX_ATTENTION", "4"))    # four names, never a league table
SAFE_RATIO = float(os.getenv("CLASS_SAFE_RATIO", "0.8"))      # "safe to move on" needs to be genuinely safe

WEAK = ("needshelp", "improving")


def _bucket(ewma: float) -> str:
    """Same thresholds the student sees on their own progress screen."""
    if ewma >= 0.9:
        return "strong"
    if ewma >= 0.75:
        return "confident"
    if ewma >= 0.5:
        return "improving"
    return "needshelp"


def _parse_key(key: str):
    chapter_id, _, section = key.partition("::")
    return chapter_id, (section or None)


_TITLE_CACHE: dict = {}


def _section_titles(chapter_id: str) -> dict:
    """section number → NCERT section title, read from the ingested KB.

    The teacher app has no copy of the syllabus, and duplicating one would
    be a second thing to keep in step. The knowledge base already carries
    the real titles, so they come from there and are cached per process.
    """
    if chapter_id in _TITLE_CACHE:
        return _TITLE_CACHE[chapter_id]
    titles = {}
    try:
        db = _db()
        docs = db.collection("ncert_knowledge_base").where(
            "metadata.chapter_id", "==", chapter_id).stream()
        for d in docs:
            meta = (d.to_dict() or {}).get("metadata") or {}
            sec, title = meta.get("section"), meta.get("section_title")
            if sec and title and sec not in titles:
                titles[sec] = title
    except Exception:
        titles = {}
    _TITLE_CACHE[chapter_id] = titles
    return titles


def _chapter_name(chapter_id: str) -> str:
    """'g6-fractions' → 'Fractions'. A fallback for display only."""
    slug = chapter_id.split("-", 1)[1] if "-" in chapter_id else chapter_id
    return slug.replace("-", " ").strip().title()


def _title_for(key: str) -> str:
    chapter_id, section = _parse_key(key)
    if section:
        found = _section_titles(chapter_id).get(section)
        if found:
            return found
        return f"{_chapter_name(chapter_id)} {section}"
    return _chapter_name(chapter_id)


def _days_since(iso: str) -> int:
    try:
        seen = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        if seen.tzinfo is None:
            seen = seen.replace(tzinfo=timezone.utc)
        return max(0, (datetime.now(timezone.utc) - seen).days)
    except Exception:
        return -1   # unknown, not "today" — never invent recency


def class_summary(class_id: str, teacher_uid: str) -> dict:
    """The three blocks, each carrying the evidence it rests on.

    Every count says how many students it is based on. A dashboard that
    speaks confidently from 15 of 38 children will be wrong in front of a
    teacher once, and then never be trusted again.
    """
    klass = get_class(class_id, teacher_uid)
    db = _db()
    docs = db.collection(PROFILES).where("class_ids", "array_contains", class_id).stream()

    total = 0
    with_data = 0
    # skill key → {"shaky": n, "seen": n}
    skills: dict = {}
    students = []

    for d in docs:
        total += 1
        p = d.to_dict() or {}
        mastery = p.get("mastery") or {}
        name = p.get("name") or p.get("student_name") or ""
        weak_count = 0
        evidence = 0
        last_seen_days = -1

        for key, m in mastery.items():
            if not isinstance(m, dict):
                continue
            days = _days_since(m.get("lastSeen"))
            if days >= 0 and (last_seen_days < 0 or days < last_seen_days):
                last_seen_days = days
            if int(m.get("attempts") or 0) < MIN_EVIDENCE:
                continue          # not enough evidence — counted nowhere
            evidence += 1
            bucket = _bucket(float(m.get("ewma") or 0))
            row = skills.setdefault(key, {"shaky": 0, "seen": 0})
            row["seen"] += 1
            if bucket in WEAK:
                row["shaky"] += 1
                weak_count += 1

        if evidence:
            with_data += 1
        students.append({
            "student_id": d.id, "name": name,
            "weak": weak_count, "evidence": evidence, "idle_days": last_seen_days,
            # Started but below the evidence gate is not the same as never
            # opened it, and a teacher acts on those two differently.
            "started": bool(mastery),
        })

    # Reteach: the subtopics the most students are shaky on.
    reteach = [
        {"key": k, "title": _title_for(k), "shaky": v["shaky"], "of": v["seen"]}
        for k, v in skills.items() if v["shaky"]
    ]
    reteach.sort(key=lambda r: (r["shaky"], r["shaky"] / max(r["of"], 1)), reverse=True)

    # Safe to move on: nearly everyone with evidence is past it.
    safe = [
        {"key": k, "title": _title_for(k), "of": v["seen"]}
        for k, v in skills.items()
        if v["seen"] and (v["seen"] - v["shaky"]) / v["seen"] >= SAFE_RATIO
    ]
    safe.sort(key=lambda r: r["of"], reverse=True)

    # Sit with these: who needs a teacher's five minutes. Deliberately NOT a
    # ranking — no scores, capped at four names, and a plain reason each.
    #
    # Ordered in tiers rather than by weak-topic count alone. A child who has
    # never practised has no weak topics BY DEFINITION, so counting alone
    # buried the one student the teacher most needs to know about beneath
    # classmates who are merely shaky on one thing.
    def attention_rank(s):
        if not s["evidence"]:
            tier = 3            # invisible: we know nothing about them at all
        elif s["idle_days"] >= STALE_DAYS:
            tier = 2            # was here, has gone quiet
        else:
            tier = 1            # practising, and struggling
        return (tier, s["weak"], max(s["idle_days"], 0))

    candidates = [s for s in students if s["weak"] or (s["idle_days"] >= STALE_DAYS) or not s["evidence"]]
    candidates.sort(key=attention_rank, reverse=True)
    attention = []
    for s in candidates[:MAX_ATTENTION]:
        if not s["evidence"]:
            reason = "only just started" if s["started"] else "has not practised yet"
        elif s["idle_days"] >= STALE_DAYS:
            reason = f"nothing for {s['idle_days']} days"
        else:
            reason = f"shaky on {s['weak']} topic{'s' if s['weak'] != 1 else ''}"
        attention.append({"student_id": s["student_id"], "name": s["name"], "reason": reason})

    return {
        "class_id": class_id,
        "name": klass.get("name"),
        "grade": klass.get("grade"),
        "students": total,
        "students_with_data": with_data,
        "reteach": reteach[:MAX_RETEACH],
        "attention": attention,
        "safe": safe[:MAX_RETEACH],
    }
