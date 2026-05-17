# FastAPI RAG Service

A FastAPI-based skincare RAG service with intelligent routing, streaming responses, and image analysis.

## Features

- **Smart Routing**: Auto-detects user intent (skin analysis, product recommendations, general chat)
- **Streaming Support**: Server-Sent Events (SSE) for real-time streaming
- **Image Analysis**: Supports image-based skin condition detection and multi-day history analysis from GCS
- **Session Management**: Automatic session ID generation and management
- **Error Handling**: Robust error handling with fallback mechanisms

## API Endpoints

### 1. Health Check
```
GET /rag/health
```

Response:
```json
{
  "status": "ok"
}
```

### 2. Chat (Non-streaming)
```
POST /rag/chat
```

Request:
```json
{
  "message": "I have wrinkles, recommend products",
  "session_id": "optional-session-id",
  "user_image": "optional-base64-image"
}
```

Response:
```json
{
  "response": "Based on your needs, I recommend...",
  "session_id": "generated-or-provided-session-id"
}
```

### 3. Chat Stream
```
POST /rag/chat/stream
```

Same request format as above, returns Server-Sent Events (SSE):
```
event: start
data: {}

data: Based
data: on
data: your
...

event: end
data: {}
```

### 4. Analyze User Image History
Download all images for a user from GCS (one shot) and summarize day-over-day skin changes.
```
POST /rag/analyze-images
```

Request:
```json
{
  "user": "ruyiyang",
  "max_images": 10
}
```

Response (shape):
```json
{
  "message": "Summary of skin progression ...",
  "images": ["...local paths..."],
  "days": ["20251027", "20251028"]
}
```

## Quick Start

### 1. Start Service

```bash
# Using Docker Compose
docker-compose up api-service --build

# Background mode
docker-compose up -d api-service

# View logs
docker-compose logs -f api-service
```

### 2. Test API

```bash
# Health check
curl http://localhost:8080/rag/health

# Non-streaming chat
curl -X POST "http://localhost:8080/rag/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "I have wrinkles, recommend products"}'

# Streaming chat
curl -X POST "http://localhost:8080/rag/chat/stream" \
     -H "Content-Type: application/json" \
     -d '{"message": "I have wrinkles, recommend products"}'
```

### 3. API Documentation

Once running, access:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   Vertex AI     │    │   Google Cloud  │
│   (Port 8080)   │────│   RAG Corpus    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Note**: No local ChromaDB required, uses Google Cloud services directly.

## Environment Variables

Required environment variables:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/secrets/llm-service-account.json
GCP_PROJECT=ac215-herm
GOOGLE_CLOUD_LOCATION=us-east4
BUCKET_NAME=ac215-skincare
GCS_BUCKET=ac215-skincare                 # optional alias
GCS_IMAGE_PREFIX=user_image               # default prefix for per-user folders
IMAGE_DOWNLOAD_DIR=/tmp/user_images       # where images are downloaded inside the container
RAG_CORPUS=projects/816656062955/locations/us-east4/ragCorpora/4611686018427387904
GOOGLE_GENAI_USE_VERTEXAI=true
GEMINI_MODEL=gemini-2.0-flash
```

## File Structure

```
src/api-service/
├── Dockerfile              # Container config
├── pyproject.toml          # Python dependencies
├── uv.lock                 # Lock file
├── agent/                  # Agent module
│   ├── routing_agent.py    # Intent routing
│   ├── analysis_agent.py   # Skin analysis
│   ├── recommendation_agent.py # Product recommendations
│   └── image_analysis_agent.py # Multi-day skin image analysis via GCS download
└── api-service/            # API service
    ├── main.py             # FastAPI app
    └── runner.py           # Session management
```

docker login
