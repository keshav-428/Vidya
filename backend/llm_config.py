# ─────────────────────────────────────────────────────────────
#  Shared LLM clients.
#
#  Two clients because the model availability differs by GCP project/location:
#    • EMBEDDINGS + Firestore KB  → original project (where NCERT vectors live)
#    • GENERATION (gemini-3.5-flash) → mozark-ai-gcp / global, via its own SA
#
#  If the GENAI_* generation overrides are unset, generation falls back to the
#  same project/creds as embeddings (original single-project behaviour).
# ─────────────────────────────────────────────────────────────
import os
from google import genai
from google.oauth2 import service_account
from dotenv import load_dotenv

load_dotenv()

GEN_MODEL = os.getenv("GENAI_MODEL", "gemini-3.5-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "publishers/google/models/gemini-embedding-2-preview")

# Shared writing-style rule injected into every generation prompt so all
# student-facing text has one consistent voice.
STYLE_GUIDE = """LANGUAGE & TONE (follow strictly):
- Write in very simple, clear Indian English that a Class 6 to 8 student can easily read and understand.
- Use short sentences and everyday words. Explain any difficult term in simple language the first time you use it.
- Be warm, patient and encouraging, like a kind Indian school teacher.
- Do NOT use slang, casual American expressions, or trendy words (for example, avoid: crush it, awesome, cool, nailed it, let's tackle, game plan, super, guys).
- Prefer familiar Indian examples where natural (rupees, cricket, rotis, buses, common Indian names).
- Keep it respectful and age-appropriate. No jokes that could confuse a young student."""

_USE_VERTEX = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE"
_EMBED_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
_EMBED_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")

# Generation overrides (optional)
_GEN_PROJECT = os.getenv("GENAI_PROJECT")
_GEN_LOCATION = os.getenv("GENAI_LOCATION", _EMBED_LOCATION)
_GEN_CREDENTIALS = os.getenv("GENAI_CREDENTIALS")

# Embeddings / RAG client — original project (KB is ingested here).
embed_client = genai.Client(
    vertexai=_USE_VERTEX,
    project=_EMBED_PROJECT,
    location=_EMBED_LOCATION,
)


def _make_gen_client():
    """Generation client. Uses a separate project + service account when the
    GENAI_* env vars are set; otherwise reuses the embeddings client."""
    if _GEN_PROJECT and _GEN_CREDENTIALS and os.path.exists(_GEN_CREDENTIALS):
        creds = service_account.Credentials.from_service_account_file(
            _GEN_CREDENTIALS,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return genai.Client(
            vertexai=True,
            project=_GEN_PROJECT,
            location=_GEN_LOCATION,
            credentials=creds,
        )
    return embed_client


gen_client = _make_gen_client()
