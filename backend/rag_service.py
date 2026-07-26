import os
import numpy as np
from google import genai
from google.genai import types
from database import get_db
from dotenv import load_dotenv

load_dotenv()

# Generation model — configurable via .env (GENAI_MODEL)
from llm_config import gen_client, embed_client, GEN_MODEL, STYLE_GUIDE

# Initialize Gemini Client (with Vertex AI support)
client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)
db = get_db()

def get_query_embedding(query: str):
    """Generates a vector embedding for the search query."""
    result = embed_client.models.embed_content(
        model="publishers/google/models/gemini-embedding-2-preview",
        contents=query
    )
    return result.embeddings[0].values

def cosine_similarity(v1, v2):
    """Calculates cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0
    return dot_product / (norm_v1 * norm_v2)

def _candidate_docs(grade, chapter_id=None, section=None):
    """Pull candidate chunks with the tightest scope available, using only
    single-field (auto-indexed) equality filters — no composite index needed.

    Scope order: (chapter_id [+ section]) → chapter_id → grade.
    Falls back outward when a tighter scope yields nothing, so a thin/intro-only
    section still returns its chapter's context rather than empty.
    """
    col = db.collection('ncert_knowledge_base')
    if chapter_id:
        docs = [d.to_dict() for d in col.where('metadata.chapter_id', '==', chapter_id).stream()]
        if section:
            scoped = [d for d in docs if (d.get('metadata') or {}).get('section') == section]
            if scoped:
                return scoped
        if docs:
            return docs
    # Grade is ingested as a string, so compare as one — an int here silently
    # matched nothing and made this last-resort scope always come back empty.
    return [d.to_dict() for d in col.where('metadata.grade', '==', str(grade)).stream()]


def chapter_context_by_section(grade: int, chapter_id: str, char_cap: int = 6000):
    """Every ingested chunk of one chapter, grouped by section number.

    For whole-chapter work (revision notes) the section's OWN text is what's
    wanted, not a semantic top-k of it — and grouping one chapter-wide read beats
    a separate scoped query plus query embedding per section.

    Returns: { section_num: "the section's text, capped" }
    """
    if not db or not chapter_id:
        return {}
    try:
        docs = [d.to_dict() for d in db.collection('ncert_knowledge_base')
                .where('metadata.chapter_id', '==', chapter_id).stream()]
    except Exception as e:
        print(f"Warning: chapter context read failed for {chapter_id}: {e}")
        return {}

    grouped = {}
    for d in docs:
        sec = str((d.get('metadata') or {}).get('section') or '').strip()
        if not sec:
            continue
        grouped.setdefault(sec, []).append(d.get('content') or '')
    return {sec: "\n\n".join(parts)[:char_cap] for sec, parts in grouped.items()}


def retrieve_context(query: str, grade: int = 6, top_k: int = 5,
                     chapter_id: str = None, section: str = None):
    """
    Semantic search in Firestore, scoped to a chapter/subtopic when given.
    Retrieves candidate chunks for the tightest available scope and ranks them
    by cosine similarity locally.
    """
    if not db:
        return []

    try:
        query_vector = get_query_embedding(query)
    except Exception as e:
        print(f"Warning: Embedding failure, falling back to keyword search: {e}")
        try:
            candidates = _candidate_docs(grade, chapter_id, section)
            keyword_results = []
            for data in candidates:
                content = data.get('content', '').lower()
                if query.lower() in content:
                    keyword_results.append({
                        "content": data.get('content'),
                        "score": 0.5,
                        "metadata": data.get('metadata')
                    })
            return keyword_results[:top_k]
        except Exception as fe:
            print(f"Warning: Firestore unavailable, returning empty context: {fe}")
            return []

    # ... Proceed with normal vector search if embedding succeeded ...
    try:
        candidates = _candidate_docs(grade, chapter_id, section)
        results = []
        for data in candidates:
            doc_vector = data.get('embedding')
            if doc_vector:
                score = cosine_similarity(query_vector, doc_vector)
                results.append({
                    "content": data.get('content'),
                    "score": score,
                    "metadata": data.get('metadata')
                })
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]
    except Exception as fe:
        print(f"Warning: Firestore unavailable, returning empty context: {fe}")
        return []

def generate_answer(query: str, context: list, language: str = "English"):
    """
    Generates a response using Gemini 3.5 Flash, grounded in retrieved context.
    Returns a JSON with 'answer' and 'suggestions'.
    """
    context_text = "\n\n".join([f"Source: {c['metadata']['source']}\n{c['content']}" for c in context])
    
    # Define Persona and Language instructions (centralized in languages.py)
    from languages import lang_instruction as _lang
    lang_instruction = _lang(language)
    
    prompt = f"""
    You are Vidya, a friendly and patient AI Maths teacher for Class 6-8 students.
    The student is asking: "{query}"

    {STYLE_GUIDE}

    INSTRUCTIONS:
    1. Answer the question using the NCERT context provided below.
    2. {lang_instruction}
    3. Keep the explanation simple and clear, with familiar everyday examples.
    4. Generate exactly 3 short follow-up questions.
    5. PROVIDE THREE DISTINCT SECTIONS:
       - "explanation": The main conceptual answer.
       - "key_principle": A short, high-impact math rule or formula related to this.
       - "common_mistake": A warning about what students often do wrong here.
       
    6. Format your response as a JSON object:
       {{
         "explanation": "...",
         "key_principle": "...",
         "common_mistake": "...",
         "suggestions": ["...", "...", "..."]
       }}
    
    --- NCERT TEXTBOOK CONTEXT ---
    {context_text}
    """
    
    try:
        response = gen_client.models.generate_content(
            model=GEN_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return response.text
    except Exception as e:
        print(f"Error in generate_answer v2: {e}")
        return f'{{"answer": "I had a tiny bit of trouble thinking that through. Can you try again?", "suggestions": []}}'

def search_videos(concept: str, grade: int = 7):
    """
    Uses the Official YouTube Data API v3 to find educational video tutorials.
    Returns a list of dictionaries with title, url, and thumbnail.
    """
    import urllib.request
    import json
    
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("Error: YOUTUBE_API_KEY not found in environment.")
        return "[]"
        
    query = f"{concept} NCERT Class {grade} maths explained"
    # Whitelist trusted channels for better relevance
    # query += " (Khan Academy, NCERT Official, Learnohub)"
    
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={encoded_query}&type=video&videoDuration=medium&relevanceLanguage=en&maxResults=2&key={api_key}"
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            results = []
            for item in data.get("items", []):
                results.append({
                    "title": item["snippet"]["title"],
                    "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    "thumbnail": item["snippet"]["thumbnails"]["high"]["url"]
                })
            return json.dumps(results)
    except Exception as e:
        print(f"Error in official search_videos: {e}")
        return "[]"
