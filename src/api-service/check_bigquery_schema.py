"""
Check BigQuery table schema to understand the actual structure
"""

import os
from google.cloud import bigquery

# Configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resonant-time-480901-n6")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "skinme")

def check_table_schema(table_name: str):
    """Print the schema of a BigQuery table"""
    client = bigquery.Client(project=GCP_PROJECT_ID)
    table_id = f"{GCP_PROJECT_ID}.{BIGQUERY_DATASET}.{table_name}"

    try:
        table = client.get_table(table_id)

        print(f"\n{'='*60}")
        print(f"Table: {table_id}")
        print(f"{'='*60}")
        print(f"Total rows: {table.num_rows:,}")
        print(f"\nSchema:")
        print(f"{'Field Name':<30} {'Type':<15} {'Mode':<10}")
        print(f"{'-'*60}")

        for field in table.schema:
            print(f"{field.name:<30} {field.field_type:<15} {field.mode:<10}")

        # Sample query to see actual data
        query = f"""
        SELECT *
        FROM `{table_id}`
        LIMIT 3
        """

        print(f"\n{'='*60}")
        print("Sample Data (first 3 rows):")
        print(f"{'='*60}")

        query_job = client.query(query)
        results = query_job.result()

        for i, row in enumerate(results, 1):
            print(f"\nRow {i}:")
            for key, value in dict(row.items()).items():
                # Truncate long values
                value_str = str(value)
                if len(value_str) > 100:
                    value_str = value_str[:100] + "..."
                print(f"  {key}: {value_str}")

    except Exception as e:
        print(f"❌ Error accessing table {table_name}: {e}")


if __name__ == "__main__":
    print("\n🔍 Checking BigQuery Table Schemas")
    print(f"Project: {GCP_PROJECT_ID}")
    print(f"Dataset: {BIGQUERY_DATASET}\n")

    # Check all relevant tables
    tables = ["products", "ingredients", "product_ingredients"]

    for table_name in tables:
        check_table_schema(table_name)
        print("\n")
