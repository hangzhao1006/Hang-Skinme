"""
User Context Retriever - Retrieve and format user context for personalized AI responses
"""

import os
from typing import Dict, Any, Optional
from .user_profile_manager import profile_manager
from .chat_logger import chat_logger
from .image_upload_handler import image_upload_handler
from .calendar_manager import calendar_manager
from .cache import user_context_cache
from .weather_context_manager import format_weather_context

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class UserContextRetriever:
    """Retrieve and format user context for AI agents."""

    def __init__(self):
        self.profile_manager = profile_manager
        self.chat_logger = chat_logger
        self.image_handler = image_upload_handler
        self.calendar_manager = calendar_manager
        self.cache = user_context_cache

    def get_full_context(
        self,
        email: str,
        conversation_days: int = 7,
        include_chat_history: bool = True,
        weather_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> str:
        """
        Retrieve full user context for AI personalization with caching.

        Args:
            email: User's email address (None for anonymous users)
            conversation_days: How many days of conversation history to include
            include_chat_history: Whether to include recent chat summaries
            weather_data: Optional weather data to include in context
            session_id: Session ID for anonymous users (fallback when email is None)

        Returns:
            Formatted context string to prepend to AI prompts
        """
        # For anonymous users, only include weather and calendar (no profile/chat history)
        if not email and session_id:
            context_parts = []

            # 1. Weather Context (if provided)
            if weather_data:
                weather_context = format_weather_context(weather_data)
                if weather_context:
                    context_parts.append(f"\n{weather_context}")

            # 2. Calendar Events for anonymous user
            calendar_summary = self.calendar_manager.get_calendar_context_summary(session_id)
            if calendar_summary:
                context_parts.append(calendar_summary)

            if len(context_parts) == 0:
                return ""

            full_context = "\n".join(context_parts)
            return f"""
=== SYSTEM CONTEXT - IMPORTANT: Use this factual information to answer user questions ===
{full_context}
=== END CONTEXT ===

"""

        # Logged-in user flow (existing logic)
        # Check cache first (skip cache if weather data provided, as it changes frequently)
        cache_key = f"context:{email}:{conversation_days}:{include_chat_history}"
        if not weather_data:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached

        context_parts = []

        # 1. User Profile Context
        profile_summary = self.profile_manager.get_user_context_summary(email)
        context_parts.append(profile_summary)

        # 2. Image Upload Statistics
        image_count = self.image_handler.get_user_image_count(email)
        if image_count > 0:
            context_parts.append(f"Total images uploaded: {image_count}")

        # 3. Weather Context (if provided)
        if weather_data:
            weather_context = format_weather_context(weather_data)
            print(f"Formatted weather context:\n{weather_context}")
            if weather_context:
                context_parts.append(f"\n{weather_context}")

        # 4. Recent Conversation History
        if include_chat_history:
            chat_summary = self.chat_logger.get_conversation_summary(email, days=conversation_days)
            if chat_summary != "No recent conversation history.":
                context_parts.append(f"\n{chat_summary}")

        if len(context_parts) == 0:
            return ""

        # Format as system context
        full_context = "\n".join(context_parts)
        result = f"""
=== SYSTEM CONTEXT - IMPORTANT: Use this factual information to answer user questions ===
{full_context}
=== END CONTEXT ===

"""

        # Cache only if no weather data (weather changes frequently)
        if not weather_data:
            self.cache.set(cache_key, result, ttl=120)
        return result

    def get_smart_context(
        self,
        email: Optional[str],
        user_message: str,
        has_image: bool = False,
        weather_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> str:
        """
        Smart context retrieval - includes relevant information based on query.

        For agent-involved requests (product recommendations, skin analysis), includes:
        - User profile (skin type, allergies, sensitivities) when discussing products
        - Calendar events (upcoming events that may affect skincare needs)
        - Weather context (current conditions affecting skincare)
        - Chat history summary (~20 words, concise - includes key info like allergies)

        Returns empty string for simple greetings or irrelevant queries.

        Args:
            email: User's email address (None for anonymous users)
            user_message: The user's current message
            has_image: Whether user uploaded an image (always include context for images)
            weather_data: Optional weather data
            session_id: Session ID for anonymous users

        Returns:
            Filtered context string or empty string if no context is relevant
        """
        message_lower = user_message.lower()

        if has_image:
            return self.get_full_context(email, weather_data=weather_data, session_id=session_id)

        skip_keywords = ["hello", "hi", "hey", "thanks", "thank you", "bye", "goodbye"]
        if any(kw in message_lower for kw in skip_keywords) and len(user_message.split()) <= 3:
            return ""

        context_parts = []

        # 1. User Profile - ALWAYS include for product queries (logged-in users only)
        # Critical for safety: must check allergies when recommending products
        if email:
            product_keywords = [
                "product",
                "ingredient",
                "cream",
                "serum",
                "cleanser",
                "moisturizer",
                "recommend",
                "use",
                "allergic",
                "sensitive",
                "buy",
                "routine",
                "treatment",
                "suggest",
                "looking for",
                "need",
                "what should",
                "help me",
            ]
            if any(kw in message_lower for kw in product_keywords):
                profile = self.profile_manager.load_profile(email)
                allergies = profile.get("allergies", [])
                sensitivities = profile.get("sensitivities", [])
                skin_type = profile.get("skin_type", "")

                profile_parts = []
                if skin_type:
                    profile_parts.append(f"Skin type: {skin_type}")
                if allergies:
                    profile_parts.append(f"⚠️ ALLERGIES: {', '.join(allergies)}")
                if sensitivities:
                    profile_parts.append(f"⚠️ SENSITIVITIES: {', '.join(sensitivities)}")

                if profile_parts:
                    context_parts.append("USER PROFILE:\n" + "\n".join(profile_parts))

        # 2. Calendar Events - Always include if user has upcoming events
        identifier = email if email else session_id
        if identifier:
            calendar_summary = self.calendar_manager.get_calendar_context_summary(identifier)
            if calendar_summary:
                context_parts.append(calendar_summary)

        # 3. Weather Context - always include if available (weather affects skincare advice)
        if weather_data:
            weather_context = format_weather_context(weather_data)
            if weather_context:
                context_parts.append(f"\n{weather_context}")

        # 4. Chat History Summary - ALWAYS include for logged-in users (concise ~20 words)
        # This ensures continuity and captures important info like allergies mentioned in previous chats
        if email:
            chat_summary = self.chat_logger.get_conversation_summary(email, days=7)
            if chat_summary != "No recent conversation history.":
                context_parts.append(f"\n{chat_summary}")

        # If no relevant context, return empty string
        if len(context_parts) == 0:
            return ""

        # Format as system context
        full_context = "\n".join(context_parts)
        return f"""
=== SYSTEM CONTEXT - IMPORTANT: Use this factual information to answer user questions ===
{full_context}
=== END CONTEXT ===

"""

    def get_profile_only(self, email: str) -> Dict[str, Any]:
        """Get just the raw user profile data."""
        return self.profile_manager.load_profile(email)

    def get_recent_conversations(self, email: str, days: int = 7, limit: int = 50):
        """Get recent conversation entries for detailed analysis."""
        return self.chat_logger.get_recent_conversations(email, days=days, limit=limit)

    def update_profile_from_conversation(self, email: str, extracted_info: Dict[str, Any]) -> bool:
        """
        Update user profile based on information extracted from conversation.

        Args:
            email: User's email
            extracted_info: Dict with keys like 'skin_type', 'allergies', 'goals', etc.

        Returns:
            True if successful
        """
        profile = self.profile_manager.load_profile(email)

        # Update simple fields
        for field in ["skin_type", "goals"]:
            if field in extracted_info and extracted_info[field]:
                profile[field] = extracted_info[field]

        # Update list fields (avoid duplicates)
        for list_field in ["allergies", "sensitivities"]:
            if list_field in extracted_info and extracted_info[list_field]:
                items = extracted_info[list_field]
                if isinstance(items, list):
                    for item in items:
                        if item not in profile.get(list_field, []):
                            if list_field not in profile:
                                profile[list_field] = []
                            profile[list_field].append(item)

        # Update preferences
        if "preferences" in extracted_info:
            if "preferences" not in profile:
                profile["preferences"] = {}
            profile["preferences"].update(extracted_info["preferences"])

        return self.profile_manager.save_profile(email, profile)

    def should_ask_for_profile_info(self, email: str) -> Dict[str, bool]:
        """
        Check which profile fields are missing and should be asked about.

        Returns:
            Dict indicating what info is missing: {'skin_type': True, 'allergies': False, ...}
        """
        profile = self.profile_manager.load_profile(email)

        return {
            "skin_type": not profile.get("skin_type"),
            "allergies": len(profile.get("allergies", [])) == 0,
            "goals": len(profile.get("goals", [])) == 0,
            "current_products": len(profile.get("current_products", [])) == 0,
        }


# Global instance
user_context_retriever = UserContextRetriever()
