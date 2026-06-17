# Vidya backend — FastAPI on Render (or any container host).
FROM python:3.12-slim

WORKDIR /app

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code (credential JSONs are NOT copied — see .dockerignore;
# they are provided at runtime via Render Secret Files).
COPY . .

# Render injects $PORT. Bind to 0.0.0.0 so it's reachable.
ENV PORT=8001
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
