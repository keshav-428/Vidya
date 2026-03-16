import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)

model_id = "publishers/google/models/gemini-3-flash-preview"
print(f"Testing generation with {model_id}...")
try:
    response = client.models.generate_content(
        model=model_id,
        contents="Say hello"
    )
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Failed with {model_id}: {e}")

model_id_short = "gemini-3-flash-preview"
print(f"Testing generation with {model_id_short}...")
try:
    response = client.models.generate_content(
        model=model_id_short,
        contents="Say hello"
    )
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Failed with {model_id_short}: {e}")
