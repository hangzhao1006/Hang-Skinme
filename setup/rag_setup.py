# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Setup script for Vertex AI RAG Engine corpus.

Creates a RAG corpus and optionally imports documents from Google Cloud Storage.
"""

import os
import sys
from pathlib import Path
from vertexai.preview import rag
import vertexai

PROJECT_ID = "ac215-herm"
LOCATION = "us-east4"

PROJECT_ROOT = Path(__file__).parent.parent
credentials_path = PROJECT_ROOT / "secrets" / "llm-service-account.json"

if credentials_path.exists():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path)

vertexai.init(project=PROJECT_ID, location=LOCATION)


def create_corpus(display_name: str, description: str = "") -> str:
    """
    Create a new RAG corpus.

    Args:
        display_name: Human-readable name for the corpus
        description: Optional description

    Returns:
        Full corpus resource name
    """
    print(f"Creating RAG corpus: {display_name}")

    corpus = rag.create_corpus(
        display_name=display_name,
        description=description or f"RAG corpus for {display_name}",
    )

    print(f"✓ Corpus created: {corpus.name}")
    print(f"\nAdd this to your .env file:")
    print(f"RAG_CORPUS={corpus.name}")

    return corpus.name


def list_corpora():
    """List all RAG corpora in the project."""
    print(f"Listing RAG corpora in project: {PROJECT_ID}")
    print(f"Location: {LOCATION}\n")

    corpora = rag.list_corpora()

    if not corpora:
        print("No corpora found.")
        return

    for corpus in corpora:
        print(f"Name: {corpus.name}")
        print(f"Display Name: {corpus.display_name}")
        print(f"Description: {corpus.description}")
        print("-" * 80)


def import_files_from_gcs(corpus_name: str, gcs_uris: list[str]):
    """
    Import files from Google Cloud Storage into the corpus.

    Args:
        corpus_name: Full corpus resource name
        gcs_uris: List of GCS URIs (gs://bucket/path/to/file.pdf)
    """
    print(f"Importing {len(gcs_uris)} file(s) into corpus...")

    for uri in gcs_uris:
        print(f"  - {uri}")

    response = rag.import_files(
        corpus_name=corpus_name,
        paths=gcs_uris,
        chunk_size=1024,  # Tokens per chunk
        chunk_overlap=200,  # Overlap between chunks
    )

    print(f"✓ Import completed: {response.imported_rag_files_count} files imported")


def import_files_from_drive(corpus_name: str, drive_folder_id: str):
    """
    Import files from Google Drive folder into the corpus.

    Args:
        corpus_name: Full corpus resource name
        drive_folder_id: Google Drive folder ID
    """
    print(f"Importing files from Google Drive folder: {drive_folder_id}")

    response = rag.import_files(
        corpus_name=corpus_name,
        source=rag.GoogleDriveSource(
            resource_ids=[drive_folder_id],
        ),
        chunk_size=1024,
        chunk_overlap=200,
    )

    print(f"✓ Import completed: {response.imported_rag_files_count} files imported")


def delete_corpus(corpus_name: str):
    """
    Delete a RAG corpus.

    Args:
        corpus_name: Full corpus resource name
    """
    print(f"Deleting corpus: {corpus_name}")

    confirm = input("Are you sure? This cannot be undone. (yes/no): ")
    if confirm.lower() != "yes":
        print("Cancelled.")
        return

    rag.delete_corpus(name=corpus_name)
    print("✓ Corpus deleted")


def main():
    """Interactive setup menu."""
    print("=" * 80)
    print("Vertex AI RAG Engine - Corpus Setup")
    print("=" * 80)
    print()

    while True:
        print("\nOptions:")
        print("1. Create new corpus")
        print("2. List existing corpora")
        print("3. Import files from Google Cloud Storage")
        print("4. Import files from Google Drive")
        print("5. Delete corpus")
        print("6. Exit")

        choice = input("\nSelect option (1-6): ").strip()

        if choice == "1":
            name = input("Enter corpus display name: ").strip()
            description = input("Enter description (optional): ").strip()
            create_corpus(name, description)

        elif choice == "2":
            list_corpora()

        elif choice == "3":
            corpus_name = input("Enter corpus name: ").strip()
            print("Enter GCS URIs (one per line, empty line to finish):")
            uris = []
            while True:
                uri = input().strip()
                if not uri:
                    break
                uris.append(uri)
            if uris:
                import_files_from_gcs(corpus_name, uris)
            else:
                print("No URIs provided.")

        elif choice == "4":
            corpus_name = input("Enter corpus name: ").strip()
            folder_id = input("Enter Google Drive folder ID: ").strip()
            import_files_from_drive(corpus_name, folder_id)

        elif choice == "5":
            corpus_name = input("Enter corpus name to delete: ").strip()
            delete_corpus(corpus_name)

        elif choice == "6":
            print("Goodbye!")
            break

        else:
            print("Invalid option. Please try again.")


if __name__ == "__main__":
    main()
