"""
Unit tests for personalization.user_context_retriever module
"""

import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# Add the api-service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src/api-service/api-service'))

from agent.personalization.user_context_retriever import (
    UserContextRetriever,
    user_context_retriever,
)


class TestUserContextRetriever:
    """Test UserContextRetriever class"""

    @pytest.fixture
    def retriever(self):
        """Create a UserContextRetriever instance"""
        return UserContextRetriever()

    def test_initialization(self, retriever):
        """Test retriever initializes correctly"""
        assert retriever.profile_manager is not None
        assert retriever.chat_logger is not None
        assert retriever.image_handler is not None
        assert retriever.cache is not None

    @patch('api-service.agent.personalization.user_context_retriever.profile_manager')
    @patch('api-service.agent.personalization.user_context_retriever.chat_logger')
    @patch('api-service.agent.personalization.user_context_retriever.image_upload_handler')
    def test_get_full_context_with_cache(self, mock_image, mock_chat, mock_profile, retriever):
        """Test get_full_context returns cached value"""
        # Set up cache with a value
        retriever.cache.set("context:user@example.com:7:True", "Cached context")

        result = retriever.get_full_context("user@example.com")

        assert result == "Cached context"
        # Should not call profile_manager since it's cached
        mock_profile.get_user_context_summary.assert_not_called()

    def test_get_full_context_no_cache(self, retriever):
        """Test get_full_context generates context when not cached"""
        # Clear cache
        retriever.cache.clear()

        # Mock the methods on the retriever's attributes
        retriever.profile_manager.get_user_context_summary = MagicMock(
            return_value="USER PROFILE: Skin type: oily"
        )
        retriever.image_handler.get_user_image_count = MagicMock(return_value=3)
        retriever.chat_logger.get_conversation_summary = MagicMock(
            return_value="Recent chat summary"
        )

        result = retriever.get_full_context("user@example.com")

        assert "USER CONTEXT" in result
        assert "Skin type: oily" in result
        assert "Total images uploaded: 3" in result
        assert "Recent chat summary" in result

    def test_get_full_context_no_images(self, retriever):
        """Test context when user has no images"""
        retriever.cache.clear()

        retriever.profile_manager.get_user_context_summary = MagicMock(
            return_value="USER PROFILE: New user"
        )
        retriever.image_handler.get_user_image_count = MagicMock(return_value=0)
        retriever.chat_logger.get_conversation_summary = MagicMock(
            return_value="No recent conversation history."
        )

        result = retriever.get_full_context("user@example.com")

        assert "Total images uploaded" not in result

    def test_get_full_context_no_chat_history(self, retriever):
        """Test context excludes chat history when specified"""
        retriever.cache.clear()

        retriever.profile_manager.get_user_context_summary = MagicMock(
            return_value="USER PROFILE: Skin type: dry"
        )
        retriever.image_handler.get_user_image_count = MagicMock(return_value=0)

        result = retriever.get_full_context("user@example.com", include_chat_history=False)

        # Chat logger should not be called when include_chat_history=False
        assert "Skin type: dry" in result

    def test_get_profile_only(self, retriever):
        """Test getting just the profile data"""
        mock_profile_data = {
            "email": "user@example.com",
            "skin_type": "oily",
            "allergies": ["fragrance"],
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=mock_profile_data)

        result = retriever.get_profile_only("user@example.com")

        assert result == mock_profile_data
        retriever.profile_manager.load_profile.assert_called_once_with("user@example.com")

    def test_get_recent_conversations(self, retriever):
        """Test getting recent conversations"""
        mock_conversations = [
            {"message": "Hello", "timestamp": "2024-01-01"},
            {"message": "How are you?", "timestamp": "2024-01-02"},
        ]
        retriever.chat_logger.get_recent_conversations = MagicMock(
            return_value=mock_conversations
        )

        result = retriever.get_recent_conversations("user@example.com", days=7, limit=20)

        assert result == mock_conversations
        retriever.chat_logger.get_recent_conversations.assert_called_once_with(
            "user@example.com", days=7, limit=20
        )

    def test_update_profile_from_conversation_simple_fields(self, retriever):
        """Test updating profile with simple fields"""
        existing_profile = {
            "email": "user@example.com",
            "skin_type": None,
            "goals": [],
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=existing_profile)
        retriever.profile_manager.save_profile = MagicMock(return_value=True)

        extracted_info = {"skin_type": "oily", "goals": ["reduce acne"]}

        result = retriever.update_profile_from_conversation("user@example.com", extracted_info)

        assert result is True
        retriever.profile_manager.save_profile.assert_called_once()
        # Check that the profile was updated
        saved_profile = retriever.profile_manager.save_profile.call_args[0][1]
        assert saved_profile["skin_type"] == "oily"
        assert saved_profile["goals"] == ["reduce acne"]

    def test_update_profile_from_conversation_list_fields(self, retriever):
        """Test updating profile with list fields (no duplicates)"""
        existing_profile = {
            "email": "user@example.com",
            "allergies": ["nuts"],
            "sensitivities": [],
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=existing_profile)
        retriever.profile_manager.save_profile = MagicMock(return_value=True)

        extracted_info = {
            "allergies": ["fragrance", "nuts"],  # nuts is duplicate
            "sensitivities": ["retinol"],
        }

        result = retriever.update_profile_from_conversation("user@example.com", extracted_info)

        assert result is True
        saved_profile = retriever.profile_manager.save_profile.call_args[0][1]
        # Should have nuts (existing) + fragrance (new), but not duplicate nuts
        assert "nuts" in saved_profile["allergies"]
        assert "fragrance" in saved_profile["allergies"]
        assert saved_profile["allergies"].count("nuts") == 1
        assert "retinol" in saved_profile["sensitivities"]

    def test_update_profile_from_conversation_preferences(self, retriever):
        """Test updating profile preferences"""
        existing_profile = {
            "email": "user@example.com",
            "preferences": {"avoid_ingredients": ["parabens"]},
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=existing_profile)
        retriever.profile_manager.save_profile = MagicMock(return_value=True)

        extracted_info = {"preferences": {"prefer_vegan": True, "price_range": "mid"}}

        result = retriever.update_profile_from_conversation("user@example.com", extracted_info)

        assert result is True
        saved_profile = retriever.profile_manager.save_profile.call_args[0][1]
        assert saved_profile["preferences"]["prefer_vegan"] is True
        assert saved_profile["preferences"]["price_range"] == "mid"
        # Original preference should still be there
        assert saved_profile["preferences"]["avoid_ingredients"] == ["parabens"]

    def test_should_ask_for_profile_info_complete_profile(self, retriever):
        """Test should_ask_for_profile_info with complete profile"""
        complete_profile = {
            "email": "user@example.com",
            "skin_type": "oily",
            "allergies": ["fragrance"],
            "goals": ["reduce acne"],
            "current_products": [{"product_name": "CeraVe"}],
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=complete_profile)

        result = retriever.should_ask_for_profile_info("user@example.com")

        assert result["skin_type"] is False
        assert result["allergies"] is False
        assert result["goals"] is False
        assert result["current_products"] is False

    def test_should_ask_for_profile_info_empty_profile(self, retriever):
        """Test should_ask_for_profile_info with empty profile"""
        empty_profile = {
            "email": "user@example.com",
            "skin_type": None,
            "allergies": [],
            "goals": [],
            "current_products": [],
        }
        retriever.profile_manager.load_profile = MagicMock(return_value=empty_profile)

        result = retriever.should_ask_for_profile_info("user@example.com")

        assert result["skin_type"] is True
        assert result["allergies"] is True
        assert result["goals"] is True
        assert result["current_products"] is True


class TestGlobalUserContextRetriever:
    """Test global user_context_retriever instance"""

    def test_user_context_retriever_exists(self):
        """Test that global user_context_retriever is initialized"""
        assert user_context_retriever is not None
        assert isinstance(user_context_retriever, UserContextRetriever)
