# Data Versioning

## What we use: DVC (Data Version Control) + Google Cloud Storage (GCS)

We use **DVC (Data Version Control) with Google Cloud Storage (GCS)** because our project contains **large datasets** (e.g., product catalog) and **dynamic, user-generated data** (chat logs, uploaded images, profiles) that cannot be stored or versioned reliably with Git.

DVC handles versioning; GCS handles storage. Together they give us a reproducible, cloud-native workflow for both static dataset versions and dynamic user-generated data.


## Version History

Version history for datasets or large artifacts (commits, tags, or snapshots).


### Tags: dataset_v1 & Commits: dataset_v1_subset
#### **Contents**:

-  ewg_full_dataset_use_this.jsonl



### Tags: dataset_v2 & Commits: dataset_v2_full_snapshot

#### **Contents**:

-  ewg_full_dataset_use_this.jsonl
-  All user chat histories (user_chat_history)
-  All user-uploaded images (user_image)
-  User profiles (user_profiles)

### Tags: dataset_v3 & Commits: dataset_v3: structured EWG dataset(used version for M4) + full user snapshot

#### **Contents**:

-  ewg_product_structured.jsonl (skin product dataset used for Milestone_4)
-  All user chat histories (user_chat_history)
-  All user-uploaded images (user_image)
-  User profiles (user_profiles)

## Instructions for Data Retrieval

### Reproduce dataset_v1:
```bash
git checkout dataset_v1
dvc pull
ls data
```

**expected to see:**

-  ewg_full_dataset_use_this.jsonl


### Reproduce dataset_v2:
```bash
git checkout dataset_v2
dvc pull
ls -R data
```

**expected to see:**

-  ewg_full_dataset_use_this.jsonl
-  user_chat_history/
-  user_image/
-  user_profiles/

### Reproduce dataset_v3:
```bash
git checkout dataset_v3
dvc pull
ls -R data
```

**expected to see:**

-  ewg_product_structured.jsonl
-  user_chat_history/
-  user_image/
-  user_profiles/

## LLM Prompt & Output Storage

We stored all user chat logs (prompt, image, and corresponding responses generated) as hashed folders in GCS under our DVC remote:
```bash
gs://ac215-skincare/dvc_store/
```
