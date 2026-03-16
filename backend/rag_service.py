import os
import numpy as np
from google import genai
from google.genai import types
from database import get_db
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client (with Vertex AI support)
client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)
db = get_db()

def get_query_embedding(query: str):
    """Generates a vector embedding for the search query."""
    result = client.models.embed_content(
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

def retrieve_context(query: str, grade: int = 6, top_k: int = 5):
    """
    Simulates vector search in Firestore by retrieving documents for the grade
    and calculating similarity locally (Fallback for simple local dev).
    """
    try:
        query_vector = get_query_embedding(query)
    except Exception as e:
        print(f"Warning: Embedding failure, falling back to keyword search: {e}")
        # Fallback to simple keyword search if embeddings are down/quota hit
        candidates = db.collection('ncert_knowledge_base').where('metadata.grade', '==', grade).stream()
        keyword_results = []
        for doc in candidates:
            data = doc.to_dict()
            content = data.get('content', '').lower()
            if query.lower() in content:
                keyword_results.append({
                    "content": data.get('content'),
                    "score": 0.5, # Mid-level score for keywords
                    "metadata": data.get('metadata')
                })
        return keyword_results[:top_k]

    # ... Proceed with normal vector search if embedding succeeded ...
    candidates = db.collection('ncert_knowledge_base').where('metadata.grade', '==', grade).stream()
    
    results = []
    for doc in candidates:
        data = doc.to_dict()
        doc_vector = data.get('embedding')
        if doc_vector:
            score = cosine_similarity(query_vector, doc_vector)
            results.append({
                "content": data.get('content'),
                "score": score,
                "metadata": data.get('metadata')
            })
    
    # Sort by similarity score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:top_k]

def generate_answer(query: str, context: list, language: str = "English"):
    """
    Generates a response using Gemini 2.5 Flash, grounded in retrieved context.
    Returns a JSON with 'answer' and 'suggestions'.
    """
    context_text = "\n\n".join([f"Source: {c['metadata']['source']}\n{c['content']}" for c in context])
    
    # Define Persona and Language instructions
    lang_instruction = f"Always answer in {language}."
    if language.lower() == "hinglish":
        lang_instruction = "Always answer in Hinglish (a mix of Hindi and English, written in Latin script, e.g., 'Chalo integers seekhte hain!')."
    
    prompt = f"""
    You are Vidya, a friendly and sharp AI tutor for Class 6-8 Math. 
    You speak like a cool older sibling — warm, direct, and encouraging.
    The student is asking: "{query}"
    
    INSTRUCTIONS:
    1. Answer the question using the NCERT context provided below.
    2. {lang_instruction}
    3. Keep the explanation punchy, use everyday examples.
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
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
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
