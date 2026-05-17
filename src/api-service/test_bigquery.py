"""
Test script for BigQuery connection and basic queries
Run this to verify your BigQuery setup is working correctly
"""

import os
import sys

# Add agent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from agent.bigquery_service import bigquery_service


def test_connection():
    """Test basic BigQuery connection"""
    print("=" * 60)
    print("Testing BigQuery Connection...")
    print("=" * 60)

    try:
        success = bigquery_service.test_connection()
        if success:
            print("✅ BigQuery connection successful!")
        else:
            print("❌ BigQuery connection failed!")
        return success
    except Exception as e:
        print(f"❌ Error testing connection: {e}")
        return False


def test_search_products():
    """Test product search functionality"""
    print("\n" + "=" * 60)
    print("Testing Product Search...")
    print("=" * 60)

    search_terms = ["moisturizer", "serum", "cleanser"]

    for term in search_terms:
        try:
            print(f"\nSearching for: '{term}'")
            results = bigquery_service.search_products(query=term, limit=3)

            if results:
                print(f"✅ Found {len(results)} products:")
                for i, product in enumerate(results[:3], 1):
                    print(f"  {i}. {product.get('title', 'N/A')}")
                    print(f"     Brand: {product.get('brand', 'N/A')}")
                    print(f"     Category: {product.get('category', 'N/A')}")
            else:
                print(f"⚠️  No products found for '{term}'")

        except Exception as e:
            print(f"❌ Error searching for '{term}': {e}")


def test_get_product_ingredients():
    """Test getting product ingredients"""
    print("\n" + "=" * 60)
    print("Testing Product Ingredients Query...")
    print("=" * 60)

    try:
        # First, search for a product
        print("\n1. Searching for products...")
        results = bigquery_service.search_products(query="serum", limit=1)

        if not results:
            print("⚠️  No products found to test ingredients query")
            return

        product_id = results[0].get("product_id")
        product_title = results[0].get("title")

        print(f"\n2. Getting ingredients for: {product_title}")
        print(f"   Product ID: {product_id}")

        # Get ingredients
        data = bigquery_service.get_product_ingredients_by_id(product_id)

        if data:
            product = data.get("product", {})
            ingredients = data.get("ingredients", [])

            print(f"\n✅ Product Details:")
            print(f"   Title: {product.get('title')}")
            print(f"   Brand: {product.get('brand')}")
            print(f"   Category: {product.get('category')}")

            print(f"\n✅ Found {len(ingredients)} ingredients:")
            for i, ing in enumerate(ingredients[:10], 1):  # Show first 10
                print(f"   {i}. {ing.get('name_original', 'N/A')}")
                print(f"      Function: {ing.get('function', 'N/A')}")
                print(f"      Risk: {ing.get('risk_level', 'N/A')}")

            if len(ingredients) > 10:
                print(f"   ... and {len(ingredients) - 10} more ingredients")

        else:
            print(f"❌ No ingredient data found for product ID: {product_id}")

    except Exception as e:
        print(f"❌ Error testing ingredients query: {e}")


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "BigQuery Service Test Suite" + " " * 20 + "║")
    print("╚" + "=" * 58 + "╝")

    print(f"\nProject ID: {os.getenv('GCP_PROJECT_ID', 'resonant-time-480901-n6')}")
    print(f"Dataset: {os.getenv('BIGQUERY_DATASET', 'skinme')}")
    print(f"Credentials: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'Not set')}")

    # Run tests
    connection_ok = test_connection()

    if connection_ok:
        test_search_products()
        test_get_product_ingredients()
    else:
        print("\n❌ Skipping further tests due to connection failure")

    print("\n" + "=" * 60)
    print("Test suite completed!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
