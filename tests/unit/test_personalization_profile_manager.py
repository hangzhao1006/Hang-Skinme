"""
Unit tests for personalization.user_profile_manager module
"""

import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch, Mock
from datetime import datetime

# Add the api-service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src/api-service/api-service'))

from agent.personalization.user_profile_manager import (
    UserProfileManager,
    sanitize_email,
    profile_manager,
)


class TestSanitizeEmail:
    """Test email sanitization function"""

    def test_sanitize_simple_email(self):
        """Test sanitizing a simple email"""
        result = sanitize_email("user@example.com")
        assert result == "user_at_example_com"

    def test_sanitize_email_with_plus(self):
        """Test sanitizing email with plus sign"""
        result = sanitize_email("user+tag@example.com")
        assert result == "user_plus_tag_at_example_com"

    def test_sanitize_email_uppercase(self):
        """Test that emails are lowercased"""
        result = sanitize_email("USER@EXAMPLE.COM")
        assert result == "user_at_example_com"

    def test_sanitize_complex_email(self):
        """Test sanitizing complex email"""
        result = sanitize_email("Test.User+tag@Example.COM")
        assert result == "test_user_plus_tag_at_example_com"


class TestUserProfileManager:
    """Test UserProfileManager class"""

    @pytest.fixture
    def mock_bucket(self):
        """Create a mock GCS bucket"""
        bucket = MagicMock()
        return bucket

    @pytest.fixture
    def manager(self, mock_bucket):
        """Create UserProfileManager with mocked storage"""
        with patch('google.cloud.storage.Client') as mock_client:
            mock_client.return_value.bucket.return_value = mock_bucket
            mgr = UserProfileManager(bucket_name="test-bucket")
            mgr.bucket = mock_bucket
            return mgr

    def test_initialization(self):
        """Test UserProfileManager initializes correctly"""
        with patch('google.cloud.storage.Client') as mock_client:
            manager = UserProfileManager(bucket_name="test-bucket")
            assert manager.profile_prefix == "user_profiles"

    def test_get_profile_path(self, manager):
        """Test profile path generation"""
        path = manager._get_profile_path("test_user")
        assert path == "user_profiles/test_user/profile.json"

    def test_create_default_profile(self, manager):
        """Test creating a default profile"""
        email = "test@example.com"
        username = "test_at_example_com"

        profile = manager._create_default_profile(email, username)

        assert profile["email"] == email
        assert profile["username"] == username
        assert "created_at" in profile
        assert "updated_at" in profile
        assert profile["skin_type"] is None
        assert profile["allergies"] == []
        assert profile["sensitivities"] == []
        assert profile["current_products"] == []
        assert profile["goals"] == []
        assert "preferences" in profile
        assert profile["preferences"]["avoid_ingredients"] == []
        assert profile["metadata"]["total_chats"] == 0

    def test_load_profile_new_user(self, manager, mock_bucket):
        """Test loading profile for new user (doesn't exist)"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = False
        mock_bucket.blob.return_value = mock_blob

        profile = manager.load_profile("newuser@example.com")

        assert profile["email"] == "newuser@example.com"
        assert profile["username"] == "newuser_at_example_com"
        assert profile["allergies"] == []

    def test_load_profile_existing_user(self, manager, mock_bucket):
        """Test loading existing user profile"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True

        existing_profile = {
            "email": "existing@example.com",
            "username": "existing_at_example_com",
            "skin_type": "oily",
            "allergies": ["fragrance"],
            "goals": ["reduce acne"],
        }
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        profile = manager.load_profile("existing@example.com")

        assert profile["email"] == "existing@example.com"
        assert profile["skin_type"] == "oily"
        assert "fragrance" in profile["allergies"]
        assert "reduce acne" in profile["goals"]

    def test_load_profile_error_fallback(self, manager, mock_bucket):
        """Test loading profile falls back to default when error occurs"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_text.side_effect = Exception("JSON parse error")
        mock_bucket.blob.return_value = mock_blob

        profile = manager.load_profile("error@example.com")

        # Should return default profile
        assert profile["email"] == "error@example.com"
        assert profile["allergies"] == []

    def test_save_profile(self, manager, mock_bucket):
        """Test saving a profile"""
        mock_blob = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        profile_data = {
            "email": "save@example.com",
            "username": "save_at_example_com",
            "skin_type": "dry",
        }

        result = manager.save_profile("save@example.com", profile_data)

        assert result is True
        mock_blob.upload_from_string.assert_called_once()
        # Verify updated_at was added
        call_args = mock_blob.upload_from_string.call_args
        uploaded_data = json.loads(call_args[0][0])
        assert "updated_at" in uploaded_data

    def test_save_profile_error(self, manager, mock_bucket):
        """Test save profile handles errors"""
        mock_blob = MagicMock()
        mock_blob.upload_from_string.side_effect = Exception("Upload failed")
        mock_bucket.blob.return_value = mock_blob

        profile_data = {"email": "fail@example.com"}
        result = manager.save_profile("fail@example.com", profile_data)

        assert result is False

    def test_update_profile_field_simple(self, manager, mock_bucket):
        """Test updating a simple profile field"""
        # Setup existing profile
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {
            "email": "user@example.com",
            "username": "user_at_example_com",
            "skin_type": None,
        }
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.update_profile_field("user@example.com", "skin_type", "oily")

        assert result is True
        # Verify the profile was saved with updated field
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        assert updated_profile["skin_type"] == "oily"

    def test_update_profile_field_nested(self, manager, mock_bucket):
        """Test updating a nested profile field"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {
            "email": "user@example.com",
            "preferences": {"avoid_ingredients": []},
        }
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.update_profile_field(
            "user@example.com", "preferences.prefer_vegan", True
        )

        assert result is True
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        assert updated_profile["preferences"]["prefer_vegan"] is True

    def test_add_to_list_field_new_list(self, manager, mock_bucket):
        """Test adding to a list field that doesn't exist"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {"email": "user@example.com"}
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_to_list_field("user@example.com", "allergies", "fragrance")

        assert result is True
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        assert "fragrance" in updated_profile["allergies"]

    def test_add_to_list_field_existing_list(self, manager, mock_bucket):
        """Test adding to an existing list field"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {"email": "user@example.com", "allergies": ["nuts"]}
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_to_list_field("user@example.com", "allergies", "fragrance")

        assert result is True
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        assert "nuts" in updated_profile["allergies"]
        assert "fragrance" in updated_profile["allergies"]

    def test_add_to_list_field_duplicate(self, manager, mock_bucket):
        """Test adding duplicate item to list field"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {"email": "user@example.com", "allergies": ["fragrance"]}
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_to_list_field("user@example.com", "allergies", "fragrance")

        # Should return True (already exists)
        assert result is True

    def test_add_to_list_field_not_list(self, manager, mock_bucket):
        """Test adding to a field that is not a list"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {"email": "user@example.com", "skin_type": "oily"}
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_to_list_field("user@example.com", "skin_type", "dry")

        # Should return False (field is not a list)
        assert result is False

    def test_add_product_feedback_new_product(self, manager, mock_bucket):
        """Test adding feedback for a new product"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {"email": "user@example.com", "current_products": []}
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_product_feedback(
            "user@example.com", "CeraVe Cleanser", "Works great!", still_using=True
        )

        assert result is True
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        products = updated_profile["current_products"]
        assert len(products) == 1
        assert products[0]["product_name"] == "CeraVe Cleanser"
        assert products[0]["feedback"] == "Works great!"
        assert products[0]["still_using"] is True

    def test_add_product_feedback_update_existing(self, manager, mock_bucket):
        """Test updating feedback for existing product"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        existing_profile = {
            "email": "user@example.com",
            "current_products": [
                {
                    "product_name": "CeraVe Cleanser",
                    "feedback": "Old feedback",
                    "still_using": True,
                    "started_date": "2023-01-01T00:00:00Z",
                }
            ],
        }
        mock_blob.download_as_text.return_value = json.dumps(existing_profile)
        mock_bucket.blob.return_value = mock_blob

        result = manager.add_product_feedback(
            "user@example.com", "CeraVe Cleanser", "Updated feedback", still_using=False
        )

        assert result is True
        call_args = mock_blob.upload_from_string.call_args
        updated_profile = json.loads(call_args[0][0])
        products = updated_profile["current_products"]
        assert len(products) == 1
        assert products[0]["feedback"] == "Updated feedback"
        assert products[0]["still_using"] is False
        # Original started_date should be preserved
        assert products[0]["started_date"] == "2023-01-01T00:00:00Z"

    def test_get_user_context_summary_new_user(self, manager, mock_bucket):
        """Test context summary for new user"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = False
        mock_bucket.blob.return_value = mock_blob

        summary = manager.get_user_context_summary("newuser@example.com")
        assert "New user - no previous profile data" in summary

    def test_get_user_context_summary_complete_profile(self, manager, mock_bucket):
        """Test context summary with complete profile"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        complete_profile = {
            "email": "user@example.com",
            "skin_type": "oily",
            "allergies": ["fragrance", "nuts"],
            "sensitivities": ["retinol"],
            "goals": ["reduce acne", "anti-aging"],
            "current_products": [
                {
                    "product_name": "CeraVe Cleanser",
                    "feedback": "Works well",
                    "still_using": True,
                }
            ],
            "preferences": {"avoid_ingredients": ["parabens", "sulfates"]},
        }
        mock_blob.download_as_text.return_value = json.dumps(complete_profile)
        mock_bucket.blob.return_value = mock_blob

        summary = manager.get_user_context_summary("user@example.com")

        assert "USER PROFILE:" in summary
        assert "Skin type: oily" in summary
        assert "Allergies: fragrance, nuts" in summary
        assert "Sensitivities: retinol" in summary
        assert "Goals: reduce acne, anti-aging" in summary
        assert "CeraVe Cleanser" in summary
        assert "Avoid ingredients: parabens, sulfates" in summary

    def test_get_user_context_summary_inactive_products(self, manager, mock_bucket):
        """Test that inactive products are filtered out"""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        profile = {
            "email": "user@example.com",
            "current_products": [
                {"product_name": "Product A", "still_using": False},
                {"product_name": "Product B", "still_using": True, "feedback": "Good"},
            ],
        }
        mock_blob.download_as_text.return_value = json.dumps(profile)
        mock_bucket.blob.return_value = mock_blob

        summary = manager.get_user_context_summary("user@example.com")

        assert "Product B" in summary
        assert "Product A" not in summary


class TestGlobalProfileManager:
    """Test global profile_manager instance"""

    def test_profile_manager_exists(self):
        """Test that global profile_manager is initialized"""
        assert profile_manager is not None
        assert isinstance(profile_manager, UserProfileManager)
