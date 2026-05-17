import os
import json
from google.cloud import storage
from google import genai
import vertexai

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
GEMINI_MODEL = "gemini-2.5-flash"

# Data source configuration: "sql" or "jsonl"
DATA_SOURCE = os.getenv("DATA_SOURCE", "jsonl")  # Default to JSONL for backward compatibility

# Only import psycopg2 if using SQL data source
if DATA_SOURCE == "sql":
    import psycopg2
    from psycopg2.extras import RealDictCursor

# SQL Database configuration (only used when DATA_SOURCE=sql)
DB_INSTANCE = os.getenv("DB_INSTANCE", "free-trial-first-project")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")  # Cloud SQL proxy host
DB_PORT = os.getenv("DB_PORT", "5432")

vertexai.init(project=PROJECT_ID, location=LOCATION)
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


def get_db_connection():
    """Create database connection for SQL mode."""
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD, cursor_factory=RealDictCursor
    )


def load_products_from_jsonl():
    """Load products from JSONL file in GCS."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob("EWG_face_product/ewg_product_structured.jsonl")
    data = [json.loads(line) for line in blob.download_as_text().splitlines()]
    return data


def load_products_from_sql():
    """Load products from SQL database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ewg_product")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


def load_products():
    """Load products based on DATA_SOURCE configuration."""
    if DATA_SOURCE.lower() == "sql":
        print(f"Loading products from SQL database ({DB_HOST}:{DB_PORT}/{DB_NAME})")
        return load_products_from_sql()
    else:
        print(f"Loading products from JSONL (gs://{BUCKET_NAME}/EWG_face_product/ewg_product_structured.jsonl)")
        return load_products_from_jsonl()


def recommend_products(analysis):
    """Find products based on analysis."""

    condition = analysis["condition"]
    primary_ingredients = analysis["primary_ingredients"]
    secondary_ingredients = analysis["secondary_ingredients"]
    avoid_ingredients = analysis["avoid_ingredients"]

    # map common names to alternatives
    ingredient_variations = {
        "ubiquinone": ["ubiquinone", "coenzyme q10", "coq10"],
        "retinol": ["retinol", "retinyl palmitate", "retinyl acetate", "retinoid"],
        "niacinamide": ["niacinamide", "vitamin b3"],
        "vitamin c": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "hyaluronic acid": ["hyaluronic acid", "sodium hyaluronate"],
        "salicylic acid": ["salicylic acid"],
        "glycolic acid": ["glycolic acid"],
    }

    # expand ingredient lists
    def get_variations(ingredient):
        ing_lower = ingredient.lower()
        if ing_lower in ingredient_variations:
            return ingredient_variations[ing_lower]
        return [ing_lower]

    primary_expanded = []
    for ing in primary_ingredients:
        primary_expanded.extend(get_variations(ing))

    secondary_expanded = []
    for ing in secondary_ingredients:
        secondary_expanded.extend(get_variations(ing))

    print(f"Searching for products with: {', '.join(primary_expanded)}")

    # Load products from configured data source (SQL or JSONL)
    data = load_products()

    # Score products AND collect fallback options in a single pass (optimization)
    scored_products = []
    fallback_products = []

    for p in data:
        # Handle both dict (SQL with RealDictCursor) and dict (JSONL)
        # SQL returns dict from RealDictCursor, fields may be stored as JSONB
        if isinstance(p.get("label_sections"), str):
            # If stored as JSON string, parse it
            label_sections = json.loads(p.get("label_sections", "{}"))
        else:
            label_sections = p.get("label_sections", {})

        product_ingredients = label_sections.get("ingredients", {}).get("text", "").lower()
        category = p.get("category", "").lower()
        title = p.get("title", "").lower()

        # Skip products with ingredients to avoid
        if any(avoid.lower() in product_ingredients for avoid in avoid_ingredients):
            continue

        # Score for exact ingredient matches
        score = 0

        # primary ingredients
        for ing in primary_expanded:
            if ing in product_ingredients:
                score += 10
                break

        # secondary ingredients
        for ing in secondary_expanded:
            if ing in product_ingredients:
                score += 5
                break

        if score > 0:
            scored_products.append({"product": p, "score": score})

        # Simultaneously collect fallback options (general skincare basics)
        # This way we don't need to loop through products again if no matches found
        is_cleanser = "cleanser" in category or "cleanser" in title or "cleansing" in title
        is_moisturizer = "moisturizer" in category or "moisturizer" in title or "lotion" in category
        is_sunscreen = "sunscreen" in category or "sunscreen" in title or "spf" in title

        if is_cleanser or is_moisturizer or is_sunscreen:
            # Prefer products with gentle ingredients
            fallback_score = 0
            if "gentle" in title or "sensitive" in title:
                fallback_score += 5
            if "fragrance free" in product_ingredients or "hypoallergenic" in product_ingredients:
                fallback_score += 3

            fallback_products.append(
                {
                    "product": p,
                    "score": fallback_score,
                    "category_type": "cleanser" if is_cleanser else "moisturizer" if is_moisturizer else "sunscreen",
                }
            )

    scored_products.sort(key=lambda x: x["score"], reverse=True)
    top_products = [sp["product"] for sp in scored_products[:15]]

    if not top_products:
        print("No products found matching criteria - using fallback general recommendations")

        # Sort by score and get diverse products (at least one from each category if possible)
        fallback_products.sort(key=lambda x: x["score"], reverse=True)

        # Try to get at least one product from each category
        selected = []
        categories_covered = set()

        for fp in fallback_products:
            cat = fp["category_type"]
            if cat not in categories_covered:
                selected.append(fp["product"])
                categories_covered.add(cat)
            if len(selected) >= 5:
                break

        # Fill remaining slots with highest scored products
        for fp in fallback_products:
            if len(selected) >= 5:
                break
            if fp["product"] not in selected:
                selected.append(fp["product"])

        if not selected:
            # Ultimate fallback - no products at all
            print("No fallback products found either")
            return {
                "products": [],
                "message": f"No products found with: {', '.join(primary_ingredients)}",
                "search_stats": {"total_scored": 0, "top_products": 0},
            }

        print(f"Found {len(selected)} fallback products (general skincare basics)")
        top_products = selected

    # Return raw structured product data - chat model will format conversationally
    products_data = []
    for i, p in enumerate(top_products[:5]):  # Top 5 products
        # Handle JSONB fields from SQL
        if isinstance(p.get("label_sections"), str):
            label_sections = json.loads(p.get("label_sections", "{}"))
        else:
            label_sections = p.get("label_sections", {})

        if isinstance(p.get("buy_button_urls"), str):
            buy_button_urls = json.loads(p.get("buy_button_urls", "[]"))
        else:
            buy_button_urls = p.get("buy_button_urls", [])

        products_data.append(
            {
                "title": p.get("title", "Unknown"),
                "brand": p.get("brand", "Unknown"),
                "category": p.get("category", "Unknown"),
                "ingredients": label_sections.get("ingredients", {}).get("text", "Not listed")[:400],
                "directions": label_sections.get("directions", {}).get("text", "Not provided")[:200],
                "buy_links": buy_button_urls[:2],  # Top 2 buy links
            }
        )

    return {
        "condition": condition,
        "primary_ingredients": primary_ingredients,
        "secondary_ingredients": secondary_ingredients,
        "avoid_ingredients": avoid_ingredients,
        "products": products_data,
        "search_stats": {
            "total_scored": len(scored_products),
            "top_products": len(top_products),
        },
    }
