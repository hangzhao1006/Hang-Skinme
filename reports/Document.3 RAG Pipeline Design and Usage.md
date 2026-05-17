## Document.3 RAG Pipeline Design and Usage

1. Overview

This project builds a **Retrieval-Augmented Generation (RAG)** pipeline for personalized skincare recommendations.
The system integrates an **LLM** with three structured data sources and a user preference database:

- **Facial Image Data** – visual feature descriptions
- **DermNet Articles** – dermatology references
- **Cosmetic Ingredient Data** – product and formula information
- **User Profiles** – feedback and personalization history

All components run as Docker containers and share data through a **common volume** and a **Chroma vector database**.

---

2. Pipeline Architecture

| Container | Description | Output |
|------------|--------------|---------|
| 1 – Facial Preprocessor | Converts image data to descriptive text and embeddings | Stored in ChromaDB |
| 2 – Medical Scraper | Scrapes and cleans dermatology articles | Stored in ChromaDB |
| 3 – Cosmetic DB Builder | Collects and summarizes cosmetic product data | Stored in ChromaDB |
| 4 – RAG Service (LLM) | Retrieves documents, builds prompts, and generates answers | Returns LLM outputs |

All containers connect via Docker Compose and a shared directory `/shared_data`.

---

### 3. Data Flow and Integration

Containers **1–3** each produce processed text and embeddings → stored in **ChromaDB collections**
Container **4** retrieves from these collections to generate grounded responses.

    ┌──────────────────────────┐
    │  Facial Preprocessor     │
    │  (Container 1)           │
    └────────────┬─────────────┘
                 │
    ┌────────────▼─────────────┐
    │  Medical Scraper         │
    │  (Container 2)           │
    └────────────┬─────────────┘
                 │
    ┌────────────▼─────────────┐
    │  Cosmetic DB Builder     │
    │  (Container 3)           │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Shared Volume + ChromaDB │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ RAG Service + LLM Engine │
    │ (Container 4)            │
    └──────────────────────────┘


---

4. Data Schema

All outputs follow a unified JSON format:

```json
{
  "id": "doc_001",
  "source": "dermnet",
  "title": "Acne Overview",
  "content": "Acne vulgaris is a chronic inflammatory condition...",
  "embedding": [...],
  "tags": ["acne", "treatment"]
}
```

Collections:
facial_collection
dermnet_collection
cosmetic_collection
They can also be merged into one skincare_docs collection for joint retrieval.

---

5. RAG Pipeline Usage
-  Data Loading
Each container generates its JSON and embeddings. Load all into ChromaDB:

-  User Query
The user sends a natural-language request

-  Retrieval & Context Building
Container 4 retrieves top documents from ChromaDB and combines them with user profile info to build a prompt:

-  LLM Generation
The LLM generates an specialized data-based response.

-  Feedback Update
The answer and user feedback are saved into user profile database.

6. API Endpoints (Container 4)
Takes user query and returns LLM result
Logs user feedback and updates preferences
GET	Checks service and database status
