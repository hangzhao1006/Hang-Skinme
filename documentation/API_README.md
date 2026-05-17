# RAG Pipeline - Cloud Run Deployment

## Quick Deployment

### 1. Build and Push to Docker Hub

```bash
# From the project root directory, build with docker-compose
docker-compose build skincare-api

# Login to Docker Hub
docker login

# Tag the image
docker tag skincare-api:latest ruyiyangemma/skincare-api:latest

# Push to Docker Hub
docker push ruyiyangemma/skincare-api:latest
```

### 2. Deploy to Cloud Run

Deploy the container via Google Cloud Console or reference the [Cloud Run deployment guide](https://github.com/dlops-io/serverless-deployment#running-app-in-cloud-run).

## Live API

**Deployed at:** https://skincare-api-309934976439.europe-west1.run.app/

**API Documentation:** https://skincare-api-309934976439.europe-west1.run.app/docs

---

**Note:** Always build with `--platform linux/amd64` to ensure Cloud Run compatibility.
