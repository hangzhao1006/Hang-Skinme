import os
import json
import glob
import pandas as pd
from pathlib import Path
from langchain.text_splitter import CharacterTextSplitter
from google.cloud import storage

RAW = Path("data/raw")
PROC = Path("data/processed")
PROC.mkdir(parents=True, exist_ok=True)

# GCS Config
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "ac215-skincare")
GCS_PREFIX = "dermnet"


def upload_to_gcs(file_path: str):
    """Upload jsonl file to GCS"""
    print(f"Uploading to GCS: {file_path}")
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)

    filename = os.path.basename(file_path)
    destination_blob_name = f"{GCS_PREFIX}/{filename}"
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(file_path)
    print(f"Uploaded to gs://{BUCKET_NAME}/{destination_blob_name}")


def main():
    splitter = CharacterTextSplitter(chunk_size=350, chunk_overlap=20, separator=" ", strip_whitespace=True)

    rows = []
    for jf in glob.glob(str(RAW / "*.json")):
        data = json.load(open(jf))
        text = data.get("text", "")
        if not text.strip():
            continue
        chunks = splitter.split_text(text)
        for i, chunk in enumerate(chunks):
            rows.append(
                {
                    "id": f"{Path(jf).stem}-{i}",
                    "source": "DermNet",
                    "title": data.get("title", ""),
                    "url": data.get("url", ""),
                    "chunk": chunk,
                }
            )

    out = PROC / "chunks-char-split-DermNet.jsonl"  # only for naming
    pd.DataFrame(rows).to_json(out, orient="records", lines=True)
    print(f"Wrote {len(rows)} chunks → {out}")

    # Upload to GCS
    upload_to_gcs(str(out))


if __name__ == "__main__":
    main()
