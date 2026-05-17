import os
import sys
from pathlib import Path
from vertexai.preview import rag
import vertexai

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT", "ac215-herm")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east4")
CORPUS = os.getenv("RAG_CORPUS")

PROJECT_ROOT = Path(__file__).parent.parent
credentials_path = PROJECT_ROOT / "secrets" / "llm-service-account.json"

if not credentials_path.exists():
    print(f"Error: Credentials not found at {credentials_path}")
    sys.exit(1)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path)
print(f"Using credentials: {credentials_path}")

vertexai.init(project=PROJECT_ID, location=LOCATION)

# Import files
gcs_uri = "gs://ac215-skincare/conditions_to_ingredients/skin.pdf"

print(f"\nImporting: {gcs_uri}")
print(f"To corpus: {CORPUS}")

try:
    response = rag.import_files(
        corpus_name=CORPUS,
        paths=[gcs_uri],
        chunk_size=512,
        chunk_overlap=100,
    )

    print(f"Imported {response.imported_rag_files_count} file(s)")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
