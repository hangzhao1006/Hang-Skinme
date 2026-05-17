"""
User Profile Manager - Handle user profiles and preferences stored in GCS
"""

import os
import json
from datetime import datetime
from typing import Dict, Any
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


def sanitize_email(email: str) -> str:
    """Convert email to safe filename format."""
    return email.lower().replace("@", "_at_").replace(".", "_").replace("+", "_plus_")


class UserProfileManager:
    """Manage user profiles stored in GCS."""

    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.profile_prefix = "user_profiles"

    def _get_profile_path(self, username: str) -> str:
        """Get GCS path for user profile."""
        return f"{self.profile_prefix}/{username}/profile.json"

    def load_profile(self, email: str) -> Dict[str, Any]:
        """Load user profile from GCS, or create new if doesn't exist."""
        username = sanitize_email(email)
        blob_path = self._get_profile_path(username)
        blob = self.bucket.blob(blob_path)

        if blob.exists():
            try:
                profile_data = json.loads(blob.download_as_text())
                return profile_data
            except Exception as e:
                print(f"Error loading profile for {username}: {e}")
                return self._create_default_profile(email, username)
        else:
            return self._create_default_profile(email, username)

    def _create_default_profile(self, email: str, username: str) -> Dict[str, Any]:
        """Create default profile structure."""
        return {
            "email": email,
            "username": username,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "skin_type": None,
            "allergies": [],
            "sensitivities": [],
            "current_products": [],
            "goals": [],
            "preferences": {
                "avoid_ingredients": [],
                "prefer_cruelty_free": False,
                "prefer_vegan": False,
                "price_range": None,
            },
            "metadata": {"total_chats": 0, "total_images_uploaded": 0, "last_chat_date": None},
        }

    def save_profile(self, email: str, profile_data: Dict[str, Any]) -> bool:
        """Save user profile to GCS."""
        username = sanitize_email(email)
        blob_path = self._get_profile_path(username)
        blob = self.bucket.blob(blob_path)

        # Update timestamp
        profile_data["updated_at"] = datetime.utcnow().isoformat() + "Z"

        try:
            blob.upload_from_string(json.dumps(profile_data, indent=2), content_type="application/json")
            print(f"Profile saved for {username}")
            return True
        except Exception as e:
            print(f"Error saving profile for {username}: {e}")
            return False

    def update_profile_field(self, email: str, field: str, value: Any) -> bool:
        """Update a specific field in user profile."""
        profile = self.load_profile(email)

        # Support nested fields like "preferences.avoid_ingredients"
        if "." in field:
            parts = field.split(".")
            current = profile
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            current[parts[-1]] = value
        else:
            profile[field] = value

        return self.save_profile(email, profile)

    def add_to_list_field(self, email: str, field: str, item: Any) -> bool:
        """Add item to a list field (e.g., allergies, current_products)."""
        profile = self.load_profile(email)

        if field not in profile:
            profile[field] = []

        if not isinstance(profile[field], list):
            print(f"Field {field} is not a list")
            return False

        # Avoid duplicates for simple strings
        if isinstance(item, str) and item in profile[field]:
            return True  # Already exists

        profile[field].append(item)
        return self.save_profile(email, profile)

    def add_product_feedback(self, email: str, product_name: str, feedback: str, still_using: bool = True) -> bool:
        """Add or update product in user's current products list."""
        profile = self.load_profile(email)

        # Find existing product or create new
        product_entry = {
            "product_name": product_name,
            "started_date": datetime.utcnow().isoformat() + "Z",
            "feedback": feedback,
            "still_using": still_using,
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }

        # Check if product already exists
        found = False
        for i, prod in enumerate(profile.get("current_products", [])):
            if prod.get("product_name", "").lower() == product_name.lower():
                profile["current_products"][i] = {
                    **prod,
                    "feedback": feedback,
                    "still_using": still_using,
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }
                found = True
                break

        if not found:
            if "current_products" not in profile:
                profile["current_products"] = []
            profile["current_products"].append(product_entry)

        return self.save_profile(email, profile)

    def get_user_context_summary(self, email: str) -> str:
        """Generate a text summary of user profile for AI context."""
        profile = self.load_profile(email)

        context_parts = []

        # Skin type
        if profile.get("skin_type"):
            context_parts.append(f"Skin type: {profile['skin_type']}")

        # Allergies
        if profile.get("allergies"):
            context_parts.append(f"Allergies: {', '.join(profile['allergies'])}")

        # Sensitivities
        if profile.get("sensitivities"):
            context_parts.append(f"Sensitivities: {', '.join(profile['sensitivities'])}")

        # Goals
        if profile.get("goals"):
            context_parts.append(f"Goals: {', '.join(profile['goals'])}")

        # Current products
        if profile.get("current_products"):
            active_products = [p for p in profile["current_products"] if p.get("still_using", True)]
            if active_products:
                product_info = []
                for p in active_products[:3]:  # Limit to 3 most recent
                    product_info.append(f"{p['product_name']} ({p.get('feedback', 'no feedback')})")
                context_parts.append(f"Currently using: {'; '.join(product_info)}")

        # Ingredient preferences
        avoid = profile.get("preferences", {}).get("avoid_ingredients", [])
        if avoid:
            context_parts.append(f"Avoid ingredients: {', '.join(avoid)}")

        if not context_parts:
            return "New user - no previous profile data."

        return "USER PROFILE: " + " | ".join(context_parts)


# Global instance
profile_manager = UserProfileManager()
