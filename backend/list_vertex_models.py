import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Vertex AI
client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)

print(f"Listing models for project {os.getenv('GOOGLE_CLOUD_PROJECT')} in {os.getenv('GOOGLE_CLOUD_LOCATION')}...")
try:
    for model in client.models.list(config={'page_size': 50}):
        print(f"- {model.name}")
except Exception as e:
    print(f"Error listing models: {e}")
