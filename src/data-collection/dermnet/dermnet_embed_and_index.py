# import os, time, pandas as pd, chromadb
# from google import genai
# from google.genai import types
# from pathlib import Path
# from google.cloud import storage

# # ---- Config ----
# GCP_PROJECT = os.environ["GCP_PROJECT"]
# GCP_LOCATION = "us-central1"
# EMBEDDING_MODEL = "text-embedding-004"
# EMBEDDING_DIMENSION = 256
# COLLECTION_NAME = "dermnet"
# BUCKET_NAME = "ac215-skincare"


# CHROMADB_HOST = os.getenv("CHROMADB_HOST", "llm-rag-chromadb")
# CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))

# client = genai.Client(vertexai=True, project=GCP_PROJECT, location=GCP_LOCATION)


# def download_from_gcs(bucket_name, blob_path):
#     """从 GCS 下载文件到本地，保持相同的目录结构"""
#     storage_client = storage.Client(project=GCP_PROJECT)
#     bucket = storage_client.bucket(bucket_name)
#     blob = bucket.blob(blob_path)

#     # 确保本地目录存在
#     local_path = blob_path
#     os.makedirs(os.path.dirname(local_path), exist_ok=True)

#     blob.download_to_filename(local_path)
#     print(f"Downloaded {blob_path} from GCS to {local_path}")


# chroma_client = chromadb.HttpClient(
#     host=CHROMADB_HOST,
#     port=CHROMADB_PORT
# )

# try:
#     chroma_client.delete_collection(name=COLLECTION_NAME)
#     print(f"Deleted existing collection '{COLLECTION_NAME}'")
# except Exception:
#     print(f"Collection '{COLLECTION_NAME}' did not exist. Creating new one.")

# collection = chroma_client.create_collection(
#     name=COLLECTION_NAME,
#     metadata={"hnsw:space": "cosine"}
# )

# # 从 GCS 下载数据文件，保持目录结构
# blob_path = "dermnet/dermnet_chunks.jsonl"
# local_file = download_from_gcs(BUCKET_NAME, blob_path)

# df = pd.read_json(local_file, lines=True)
# texts = df["chunk"].tolist()
# ids = df["id"].astype(str).tolist()
# metas = df[["title", "url", "source"]].to_dict(orient="records")

# print(f"Generating embeddings for {len(df)} chunks using Vertex AI...")

# # ---- Batch Embedding ----
# batch_size = 100
# all_embeddings = []
# for i in range(0, len(texts), batch_size):
#     batch = texts[i:i+batch_size]
#     response = client.models.embed_content(
#         model=EMBEDDING_MODEL,
#         contents=batch,
#         config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSION)
#     )
#     embs = [e.values for e in response.embeddings]
#     all_embeddings.extend(embs)
#     print(f"Embedded {i + len(batch)} / {len(texts)} chunks")
#     time.sleep(0.5)

# collection.add(
#     ids=ids,
#     documents=texts,
#     metadatas=metas,
#     embeddings=all_embeddings
# )

# print(f"Indexed {len(df)} DermNet chunks → Chroma at {CHROMADB_HOST}:{CHROMADB_PORT}")
