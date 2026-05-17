"""
Daily Skincare Routine Manager
Tracks daily skincare products usage and stores in GCS
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from google.cloud import storage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resonant-time-480901-n6")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
ROUTINES_PREFIX = "daily_routines"  # GCS path: daily_routines/{user_identifier}/{date}.json


class DailyRoutineManager:
    """Manage daily skincare routine records in GCS"""

    def __init__(self):
        """Initialize GCS client"""
        try:
            self.storage_client = storage.Client(project=GCP_PROJECT_ID)
            self.bucket = self.storage_client.bucket(BUCKET_NAME)
            logger.info(f"DailyRoutineManager initialized with bucket: {BUCKET_NAME}")
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            raise

    def _get_routine_path(self, user_identifier: str, date: str) -> str:
        """
        Get GCS path for a routine record

        Args:
            user_identifier: Email or session_id
            date: Date in YYYY-MM-DD format

        Returns:
            GCS blob path
        """
        # Sanitize user identifier
        safe_identifier = user_identifier.replace("@", "_at_").replace(".", "_")
        return f"{ROUTINES_PREFIX}/{safe_identifier}/{date}.json"

    def save_routine(
        self,
        user_identifier: str,
        date: str,
        products: List[Dict[str, Any]]
    ) -> bool:
        """
        Save daily routine to GCS

        Args:
            user_identifier: Email or session_id
            date: Date in YYYY-MM-DD format
            products: List of products used
                [
                    {
                        "product_id": "uuid",
                        "product_name": "Product Name",
                        "brand": "Brand Name",
                        "amount": "2 drops",
                        "time": "morning",  # morning/evening
                        "order": 1
                    }
                ]

        Returns:
            True if successful, False otherwise
        """
        try:
            routine_data = {
                "user_identifier": user_identifier,
                "date": date,
                "products": products,
                "updated_at": datetime.utcnow().isoformat(),
            }

            blob_path = self._get_routine_path(user_identifier, date)
            blob = self.bucket.blob(blob_path)
            blob.upload_from_string(
                json.dumps(routine_data, ensure_ascii=False),
                content_type="application/json"
            )

            logger.info(f"Saved routine for {user_identifier} on {date}")
            return True

        except Exception as e:
            logger.error(f"Error saving routine: {e}")
            return False

    def get_routine(self, user_identifier: str, date: str) -> Optional[Dict[str, Any]]:
        """
        Get routine for a specific date

        Args:
            user_identifier: Email or session_id
            date: Date in YYYY-MM-DD format

        Returns:
            Routine data or None if not found
        """
        try:
            blob_path = self._get_routine_path(user_identifier, date)
            blob = self.bucket.blob(blob_path)

            if not blob.exists():
                logger.info(f"No routine found for {user_identifier} on {date}")
                return None

            data = json.loads(blob.download_as_text())
            return data

        except Exception as e:
            logger.error(f"Error getting routine: {e}")
            return None

    def get_routines_range(
        self,
        user_identifier: str,
        start_date: str,
        end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Get routines for a date range

        Args:
            user_identifier: Email or session_id
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format

        Returns:
            List of routine data sorted by date
        """
        try:
            safe_identifier = user_identifier.replace("@", "_at_").replace(".", "_")
            prefix = f"{ROUTINES_PREFIX}/{safe_identifier}/"

            # List all blobs with this prefix
            blobs = self.bucket.list_blobs(prefix=prefix)

            routines = []
            for blob in blobs:
                # Extract date from filename
                filename = blob.name.split("/")[-1]
                if not filename.endswith(".json"):
                    continue

                date_str = filename.replace(".json", "")

                # Check if within date range
                if start_date <= date_str <= end_date:
                    data = json.loads(blob.download_as_text())
                    routines.append(data)

            # Sort by date
            routines.sort(key=lambda x: x["date"])
            logger.info(f"Found {len(routines)} routines for {user_identifier}")
            return routines

        except Exception as e:
            logger.error(f"Error getting routines range: {e}")
            return []

    def delete_routine(self, user_identifier: str, date: str) -> bool:
        """
        Delete routine for a specific date

        Args:
            user_identifier: Email or session_id
            date: Date in YYYY-MM-DD format

        Returns:
            True if successful, False otherwise
        """
        try:
            blob_path = self._get_routine_path(user_identifier, date)
            blob = self.bucket.blob(blob_path)

            if blob.exists():
                blob.delete()
                logger.info(f"Deleted routine for {user_identifier} on {date}")
                return True
            else:
                logger.warning(f"No routine to delete for {user_identifier} on {date}")
                return False

        except Exception as e:
            logger.error(f"Error deleting routine: {e}")
            return False

    def get_ingredient_summary(
        self,
        user_identifier: str,
        date: str,
        product_ingredients_map: Dict[str, List[Dict]]
    ) -> Dict[str, Any]:
        """
        Get ingredient summary for a specific day

        Args:
            user_identifier: Email or session_id
            date: Date in YYYY-MM-DD format
            product_ingredients_map: Map of product_id to ingredients list

        Returns:
            Summary of ingredients used that day
            {
                "date": "2025-12-11",
                "total_products": 3,
                "ingredients": [
                    {
                        "name": "hyaluronic acid",
                        "count": 2,
                        "products": ["Product A", "Product B"]
                    }
                ]
            }
        """
        try:
            routine = self.get_routine(user_identifier, date)
            if not routine:
                return {"date": date, "total_products": 0, "ingredients": []}

            products = routine.get("products", [])

            # Aggregate ingredients
            ingredient_map = {}  # ingredient_name -> {count, products}

            for product in products:
                product_id = product.get("product_id")
                product_name = product.get("product_name", "Unknown")

                # Get ingredients for this product
                ingredients = product_ingredients_map.get(product_id, [])

                for ing in ingredients:
                    ing_name = ing.get("name_normalized", "Unknown")

                    if ing_name not in ingredient_map:
                        ingredient_map[ing_name] = {
                            "name": ing_name,
                            "count": 0,
                            "products": []
                        }

                    ingredient_map[ing_name]["count"] += 1
                    if product_name not in ingredient_map[ing_name]["products"]:
                        ingredient_map[ing_name]["products"].append(product_name)

            # Convert to list and sort by count
            ingredients_list = list(ingredient_map.values())
            ingredients_list.sort(key=lambda x: x["count"], reverse=True)

            return {
                "date": date,
                "total_products": len(products),
                "ingredients": ingredients_list
            }

        except Exception as e:
            logger.error(f"Error getting ingredient summary: {e}")
            return {"date": date, "total_products": 0, "ingredients": []}


# Global instance
daily_routine_manager = DailyRoutineManager()
