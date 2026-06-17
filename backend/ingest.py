import os
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from database import get_db
from dotenv import load_dotenv
import time

load_dotenv()

# Configure Gemini (with Vertex AI support)
client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)

db = get_db()
if not db:
    raise RuntimeError("Firestore Database connection failed. Cannot proceed with ingestion.")

def extract_text_from_pdf(pdf_path: str):
    print(f"Loading {pdf_path}...")
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    return full_text

def chunk_text(text: str, grade: int, source_name: str):
    print(f"Chunking text for {source_name} (Grade {grade})...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,       # ~150 words per chunk — ideal for math context
        chunk_overlap=100,    # overlap preserves context across chunks
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.create_documents(
        [text],
        metadatas=[{"grade": grade, "source": source_name}]
    )
    return chunks

def embed_and_store(chunks: list):
    print(f"Embedding and storing {len(chunks)} chunks using 'gemini-embedding-2-preview' (multimodal preview)...")
    collection_ref = db.collection('ncert_knowledge_base')
    
    for i, chunk in enumerate(chunks):
        try:
            # Generate Embedding using Gemini's requested multimodal model
            result = client.models.embed_content(
                model="publishers/google/models/gemini-embedding-2-preview",
                contents=chunk.page_content,
            )
            embedding = result.embeddings[0].values
            
            # Store in Firestore
            doc_ref = collection_ref.document()
            doc_ref.set({
                "content": chunk.page_content,
                "embedding": embedding,
                "metadata": chunk.metadata
            })
            
            if (i+1) % 10 == 0:
                print(f"  -> Stored {i+1}/{len(chunks)} chunks...")
                
            time.sleep(0.5) # Prevent rate limits
        except Exception as e:
            print(f"Error processing chunk {i}: {e}")
            time.sleep(2) # Backoff on error

    print("Finished ingestion for this document!")

def is_already_ingested(source_name: str):
    print(f"Checking if {source_name} is already in Firestore...")
    query = db.collection('ncert_knowledge_base').where('metadata.source', '==', source_name).limit(1).stream()
    return any(query)

def main():
    data_dir = "./data/ncert_pdfs"
    os.makedirs(data_dir, exist_ok=True)
    
    pdf_files = []
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
                
    if not pdf_files:
        print(f"No PDF files found in {os.path.abspath(data_dir)}")
        return
        
    print(f"Found {len(pdf_files)} PDF files.")
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        
        if is_already_ingested(filename):
            print(f"Skipping {filename} (already ingested).")
            continue
            
        # NCERT English Medium Math Prefix mapping: f=6, g=7, h=8
        grade = 6 # Default
        if filename.startswith('gegp') or 'class7' in pdf_path.lower(): grade = 7
        elif filename.startswith('hegp') or 'class8' in pdf_path.lower(): grade = 8
        elif filename.startswith('fegp'): grade = 6
            
        text = extract_text_from_pdf(pdf_path)
        if text.strip():
            chunks = chunk_text(text, grade=grade, source_name=filename)
            embed_and_store(chunks)
        else:
            print(f"Warning: No text extracted from {filename}")

if __name__ == "__main__":
    main()
