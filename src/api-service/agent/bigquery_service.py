"""
BigQuery Service for Product and Ingredient Queries
Handles all BigQuery operations for the SkinMe AI application

Table Structure:
- products: id, url, title, brand, ingredients_raw, buy_button_urls
- ingredients: ingredient_id, name_normalized, example_name
- product_ingredients: product_id, ingredient_id
"""

import os
import logging
from typing import List, Dict, Any, Optional
from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resonant-time-480901-n6")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "skinme")

# Default query limits
DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 200


def get_dataset_table(table_name: str) -> str:
    """
    Get fully qualified BigQuery table name

    Args:
        table_name: Name of the table (e.g., 'products', 'ingredients')

    Returns:
        Fully qualified table name: project.dataset.table
    """
    return f"{GCP_PROJECT_ID}.{BIGQUERY_DATASET}.{table_name}"


class BigQueryService:
    """Service for executing BigQuery queries for product and ingredient data"""

    def __init__(self):
        """
        Initialize BigQuery client

        Note: Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
        pointing to service account JSON key file
        """
        try:
            self.client = bigquery.Client(project=GCP_PROJECT_ID)
            logger.info(f"BigQuery client initialized for project: {GCP_PROJECT_ID}")
        except Exception as e:
            logger.error(f"Failed to initialize BigQuery client: {e}")
            raise

    def _run_query(
        self,
        sql: str,
        params: Optional[List[bigquery.ScalarQueryParameter]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a BigQuery SQL query with optional parameters

        Args:
            sql: SQL query string
            params: List of bigquery.ScalarQueryParameter for parameterized queries

        Returns:
            List of dictionaries representing query results

        Raises:
            GoogleCloudError: If query execution fails
        """
        try:
            job_config = bigquery.QueryJobConfig()
            if params:
                job_config.query_parameters = params

            logger.info(f"Executing query: {sql[:200]}...")
            query_job = self.client.query(sql, job_config=job_config)
            results = query_job.result()

            # Convert results to list of dicts
            rows = []
            for row in results:
                rows.append(dict(row.items()))

            logger.info(f"Query returned {len(rows)} rows")
            return rows

        except GoogleCloudError as e:
            logger.error(f"BigQuery error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error executing query: {e}")
            raise

    def search_products(self, query: str, limit: int = DEFAULT_SEARCH_LIMIT) -> List[Dict[str, Any]]:
        """
        Search products by keyword (searches title and brand)

        Args:
            query: Search keyword (e.g., "niacinamide" or brand name)
            limit: Maximum number of results to return (default: 10, max: 100)

        Returns:
            List of product dictionaries with fields:
            - id (product_id)
            - title
            - brand
            - url

        Example:
            >>> service.search_products("moisturizer", limit=5)
            [
                {
                    "id": "f6938788-ba55-4cce-b232-1d84574c3b4d",
                    "title": "Sunny Charcoal Silk Face Masque",
                    "brand": "&Sunny",
                    "url": "https://www.ewg.org/..."
                }
            ]
        """
        # Validate and cap limit
        limit = min(max(1, limit), MAX_SEARCH_LIMIT)

        # Build SQL query - note: table uses 'id' not 'product_id'
        sql = f"""
        SELECT
            id,
            title,
            brand,
            url
        FROM `{get_dataset_table('products')}`
        WHERE
            (LOWER(title) LIKE CONCAT('%', LOWER(@query), '%')
             OR LOWER(brand) LIKE CONCAT('%', LOWER(@query), '%'))
        ORDER BY title
        LIMIT @limit
        """

        # Create query parameters
        params = [
            bigquery.ScalarQueryParameter("query", "STRING", query),
            bigquery.ScalarQueryParameter("limit", "INT64", limit),
        ]

        try:
            results = self._run_query(sql, params)
            logger.info(f"Product search for '{query}' returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            raise

    def get_product_ingredients_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Get product details and all ingredients by product_id

        Args:
            product_id: Unique product identifier

        Returns:
            Dictionary with 'product' and 'ingredients' keys, or None if not found

            Example:
            {
                "product": {
                    "id": "f6938788...",
                    "title": "Charcoal Silk Face Masque",
                    "brand": "&Sunny",
                    "url": "https://www.ewg.org/..."
                },
                "ingredients": [
                    {
                        "ingredient_id": "ing_001",
                        "name_normalized": "water",
                        "example_name": "Aqua"
                    },
                    ...
                ]
            }
        """
        sql = f"""
        SELECT
            p.id,
            p.title,
            p.brand,
            p.url,
            ing.ingredient_id,
            ing.name_normalized,
            ing.example_name
        FROM `{get_dataset_table('products')}` AS p
        JOIN `{get_dataset_table('product_ingredients')}` AS pi
            ON p.id = pi.product_id
        JOIN `{get_dataset_table('ingredients')}` AS ing
            ON pi.ingredient_id = ing.ingredient_id
        WHERE p.id = @product_id
        """

        params = [
            bigquery.ScalarQueryParameter("product_id", "STRING", product_id),
        ]

        try:
            results = self._run_query(sql, params)

            if not results:
                logger.info(f"No product found with product_id: {product_id}")
                return None

            # Extract product info from first row
            first_row = results[0]
            product_info = {
                "id": first_row.get("id"),
                "title": first_row.get("title"),
                "brand": first_row.get("brand"),
                "url": first_row.get("url"),
            }

            # Extract all ingredients
            ingredients = []
            for row in results:
                ingredients.append({
                    "ingredient_id": row.get("ingredient_id"),
                    "name_normalized": row.get("name_normalized"),
                    "example_name": row.get("example_name"),
                })

            return {
                "product": product_info,
                "ingredients": ingredients
            }

        except Exception as e:
            logger.error(f"Error fetching product ingredients: {e}")
            raise

    def get_product_ingredients_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Get product details and all ingredients by product URL

        Args:
            url: Product URL from EWG database

        Returns:
            Dictionary with 'product' and 'ingredients' keys, or None if not found
            (Same format as get_product_ingredients_by_id)
        """
        sql = f"""
        SELECT
            p.id,
            p.title,
            p.brand,
            p.url,
            ing.ingredient_id,
            ing.name_normalized,
            ing.example_name
        FROM `{get_dataset_table('products')}` AS p
        JOIN `{get_dataset_table('product_ingredients')}` AS pi
            ON p.id = pi.product_id
        JOIN `{get_dataset_table('ingredients')}` AS ing
            ON pi.ingredient_id = ing.ingredient_id
        WHERE p.url = @url
        """

        params = [
            bigquery.ScalarQueryParameter("url", "STRING", url),
        ]

        try:
            results = self._run_query(sql, params)

            if not results:
                logger.info(f"No product found with URL: {url}")
                return None

            # Extract product info from first row
            first_row = results[0]
            product_info = {
                "id": first_row.get("id"),
                "title": first_row.get("title"),
                "brand": first_row.get("brand"),
                "url": first_row.get("url"),
            }

            # Extract all ingredients
            ingredients = []
            for row in results:
                ingredients.append({
                    "ingredient_id": row.get("ingredient_id"),
                    "name_normalized": row.get("name_normalized"),
                    "example_name": row.get("example_name"),
                })

            return {
                "product": product_info,
                "ingredients": ingredients
            }

        except Exception as e:
            logger.error(f"Error fetching product by URL: {e}")
            raise

    def get_ingredients_summary(self, product_ids: List[str]) -> Dict[str, Any]:
        """
        TODO: Get ingredient summary across multiple products

        This endpoint will be used to analyze multiple products used together
        (e.g., morning routine with 3 products)

        Args:
            product_ids: List of product IDs to analyze together

        Returns:
            Dictionary with:
            - total_ingredients: Total unique ingredients count
            - ingredient_frequency: Dict of ingredient -> count
            - ingredients_list: List of all unique ingredients

        Example:
            >>> service.get_ingredients_summary(["prod_1", "prod_2", "prod_3"])
            {
                "total_ingredients": 45,
                "unique_ingredients": 38,
                "ingredient_frequency": {
                    "water": 3,
                    "glycerin": 2,
                    ...
                }
            }
        """
        # TODO: Implement this query
        # Will aggregate ingredients across multiple products
        # Count duplicates, categorize by function and risk
        raise NotImplementedError("Ingredient summary endpoint coming soon")

    def test_connection(self) -> bool:
        """
        Test BigQuery connection

        Returns:
            True if connection successful, False otherwise
        """
        try:
            sql = f"SELECT 1 as test FROM `{get_dataset_table('products')}` LIMIT 1"
            self._run_query(sql)
            logger.info("BigQuery connection test successful")
            return True
        except Exception as e:
            logger.error(f"BigQuery connection test failed: {e}")
            return False


# Global BigQuery service instance
bigquery_service = BigQueryService()
