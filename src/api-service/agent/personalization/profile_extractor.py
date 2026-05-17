"""
Profile Extractor - Automatically extract and update user profile from conversations
"""

import os
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from .user_profile_manager import profile_manager
from .cache import user_context_cache

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


class ProfileExtractor:
    """Extract user profile information from conversations."""

    def __init__(self):
        self.profile_manager = profile_manager

    def extract_from_conversation(
        self, email: str, user_message: str, assistant_response: str, analysis_result: Optional[Dict] = None
    ) -> bool:
        """
        Extract profile information from a conversation turn and update profile.

        Args:
            email: User's email
            user_message: What the user said
            assistant_response: What the assistant responded
            analysis_result: Optional analysis result from image analysis

        Returns:
            True if profile was updated
        """
        # Build extraction prompt
        prompt = f"""Extract user profile information from this skincare conversation.

USER MESSAGE: {user_message}

ASSISTANT RESPONSE: {assistant_response[:500]}

Extract ONLY information explicitly mentioned by the user. Return JSON with these fields (use null if not mentioned):
- skin_type: one of ["oily", "dry", "combination", "normal", "sensitive"] or null
- allergies: list of ingredients user is allergic to (e.g., ["fragrance", "parabens"])
- sensitivities: list of ingredients that irritate their skin (e.g., ["retinol", "vitamin C"])
- goals: list of skincare goals (e.g., ["reduce acne", "anti-aging", "hydration"])
- current_products: list of products they mentioned using (just product names)
- avoid_preferences: list of ingredients they want to avoid (not allergies, just preferences)

IMPORTANT:
- Only extract what the user EXPLICITLY stated
- Do not infer or assume
- Return empty lists [] for categories not mentioned
- Return null for skin_type if not mentioned

Example:
User: "I have oily skin and I'm allergic to fragrance. I'm using CeraVe cleanser."
Output: {{"skin_type": "oily", "allergies": ["fragrance"], "sensitivities": [],
"goals": [], "current_products": ["CeraVe cleanser"], "avoid_preferences": []}}
"""

        try:
            # Use structured output to get JSON
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "skin_type": types.Schema(type=types.Type.STRING),
                        "allergies": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "sensitivities": types.Schema(
                            type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)
                        ),
                        "goals": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "current_products": types.Schema(
                            type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)
                        ),
                        "avoid_preferences": types.Schema(
                            type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)
                        ),
                    },
                ),
                temperature=0.1,
            )

            response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt, config=config)

            extracted = response.parsed or {}

            # Also extract from analysis result if available
            if analysis_result and "condition" in analysis_result:
                condition = analysis_result["condition"].lower()
                # Extract skin concerns from condition
                concerns = self._extract_concerns_from_condition(condition)
                if concerns and "goals" in extracted:
                    extracted["goals"] = list(set(extracted.get("goals", []) + concerns))

            # Update profile with extracted information
            return self._update_profile(email, extracted)

        except Exception as e:
            print(f"Error extracting profile info: {e}")
            return False

    def _extract_concerns_from_condition(self, condition: str) -> list:
        """Extract skincare concerns from analysis condition text."""
        concerns = []
        concern_keywords = {
            "acne": "treat acne",
            "breakout": "treat acne",
            "pimple": "treat acne",
            "wrinkle": "anti-aging",
            "fine line": "anti-aging",
            "aging": "anti-aging",
            "dark spot": "reduce hyperpigmentation",
            "hyperpigmentation": "reduce hyperpigmentation",
            "dry": "hydration",
            "dehydrat": "hydration",
            "oily": "oil control",
            "redness": "reduce redness",
            "inflammation": "reduce inflammation",
        }

        for keyword, concern in concern_keywords.items():
            if keyword in condition and concern not in concerns:
                concerns.append(concern)

        return concerns[:3]  # Max 3 auto-extracted concerns

    def _update_profile(self, email: str, extracted: Dict[str, Any]) -> bool:
        """Update user profile with extracted information."""
        profile = self.profile_manager.load_profile(email)
        updated = False

        # Update skin_type if mentioned and not already set
        if extracted.get("skin_type") and not profile.get("skin_type"):
            skin_type = extracted["skin_type"].lower()
            if skin_type in ["oily", "dry", "combination", "normal", "sensitive"]:
                profile["skin_type"] = skin_type
                updated = True
                print(f"Updated skin_type to: {skin_type}")

        # Add allergies (avoid duplicates)
        for allergy in extracted.get("allergies", []):
            if allergy and allergy.lower() not in [a.lower() for a in profile.get("allergies", [])]:
                if "allergies" not in profile:
                    profile["allergies"] = []
                profile["allergies"].append(allergy.lower())
                updated = True
                print(f"Added allergy: {allergy}")

        # Add sensitivities
        for sensitivity in extracted.get("sensitivities", []):
            if sensitivity and sensitivity.lower() not in [s.lower() for s in profile.get("sensitivities", [])]:
                if "sensitivities" not in profile:
                    profile["sensitivities"] = []
                profile["sensitivities"].append(sensitivity.lower())
                updated = True
                print(f"Added sensitivity: {sensitivity}")

        # Add goals
        for goal in extracted.get("goals", []):
            if goal and goal.lower() not in [g.lower() for g in profile.get("goals", [])]:
                if "goals" not in profile:
                    profile["goals"] = []
                profile["goals"].append(goal.lower())
                updated = True
                print(f"Added goal: {goal}")

        # Add current products
        for product in extracted.get("current_products", []):
            if product:
                # Check if product already exists
                existing_products = [p.get("product_name", "").lower() for p in profile.get("current_products", [])]
                if product.lower() not in existing_products:
                    self.profile_manager.add_product_feedback(email, product, "User mentioned using this product", True)
                    updated = True
                    print(f"Added product: {product}")

        # Add avoid preferences
        for avoid in extracted.get("avoid_preferences", []):
            if avoid and avoid.lower() not in [
                a.lower() for a in profile.get("preferences", {}).get("avoid_ingredients", [])
            ]:
                if "preferences" not in profile:
                    profile["preferences"] = {}
                if "avoid_ingredients" not in profile["preferences"]:
                    profile["preferences"]["avoid_ingredients"] = []
                profile["preferences"]["avoid_ingredients"].append(avoid.lower())
                updated = True
                print(f"Added avoid ingredient: {avoid}")

        # Save if updated
        if updated:
            success = self.profile_manager.save_profile(email, profile)
            if success:
                # Invalidate cache so next request gets fresh profile
                cache_key_pattern = f"context:{email}:"
                # Clear all cache entries for this user
                for key in list(user_context_cache.cache.keys()):
                    if key.startswith(cache_key_pattern):
                        user_context_cache.invalidate(key)
            return success

        return False


# Global instance
profile_extractor = ProfileExtractor()
