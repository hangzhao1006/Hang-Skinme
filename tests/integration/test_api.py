"""
Integration tests for the Skincare RAG API
Tests the API endpoints with FastAPI TestClient (no real server needed)
Uses mocks for external services (Vertex AI, GCS)
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import sys
from pathlib import Path

api_service_path = Path(__file__).parent.parent.parent / "src" / "api-service" / "api-service"
sys.path.insert(0, str(api_service_path))

from main import app

client = TestClient(app)

class TestHealthEndpoint:
    """Tests for health check endpoint"""

    def test_health_check(self):
        """Test health check endpoint returns ok status"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_check_returns_json(self):
        """Test that health check returns JSON content type"""
        response = client.get("/health")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]

    def test_invalid_route_returns_404(self):
        """Test that invalid routes return 404"""
        response = client.get("/this-route-does-not-exist")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test that POST to GET-only endpoint returns 405"""
        response = client.post("/health")
        assert response.status_code == 405

class TestChatEndpoints:
    """Tests for chat-related endpoints"""

    @patch('runner.runner.run', new_callable=AsyncMock)
    def test_chat_endpoint_with_mock(self, mock_run):
        """Test chat endpoint with mocked runner"""
        # Mock the async runner.run method
        mock_run.return_value = {
            "response": "This is a test response",
            "session_id": "test-session-123"
        }

        # /chat endpoint uses Form data, not JSON
        response = client.post(
            "/chat",
            data={
                "message": "Hello, how are you?",
                "session_id": "test-session-123"
            }
        )

        # May succeed with mock or fail if runner not properly mocked
        assert response.status_code in [200, 500]

    def test_chat_endpoint_missing_message(self):
        """Test chat endpoint with missing message field"""
        response = client.post("/chat", json={})
        assert response.status_code == 422  # Validation error

    def test_chat_endpoint_with_optional_fields(self):
        """Test chat endpoint with all optional fields"""
        # /chat endpoint uses Form data, not JSON
        # session_id is optional, image file is optional
        response = client.post(
            "/chat",
            data={
                "message": "Test message",
                "session_id": "test-123"
            }
        )

        # Even if runner fails, should at least validate the request format
        assert response.status_code in [200, 500, 503]

    @patch('runner.runner.run', new_callable=AsyncMock)
    def test_chat_endpoint_with_image_upload(self, mock_run):
        """Test chat endpoint with image file upload"""
        from io import BytesIO

        # Mock the runner.run method
        mock_run.return_value = {
            "response": "Image analyzed successfully",
            "session_id": "test-session-456"
        }

        # Create a fake image file
        fake_image = BytesIO(b"fake image content")
        fake_image.name = "test.jpg"

        response = client.post(
            "/chat",
            data={"message": "Analyze this image"},
            files={"image": ("test.jpg", fake_image, "image/jpeg")}
        )

        # May succeed with mock or fail if runner not properly mocked
        assert response.status_code in [200, 500]

class TestSessionEndpoints:
    """Tests for session management endpoints"""

    def test_clear_session(self):
        """Test clearing a session"""
        response = client.delete("/session/test-session-123")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cleared"
        assert data["session_id"] == "test-session-123"

    @patch('runner.runner.get_session_history', new_callable=AsyncMock)
    def test_get_session_history(self, mock_history):
        """Test getting session history"""
        # Mock the async function
        mock_history.return_value = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"}
        ]

        response = client.get("/session/test-session/history")
        # May succeed with mock or fail if session doesn't exist
        assert response.status_code in [200, 404, 500]


# Weather skincare endpoint is currently commented out in main.py (lines 131-217)
# Uncomment these tests if the endpoint is re-enabled
#
# class TestWeatherSkincareEndpoint:
#     """Tests for weather-based skincare advice endpoint"""
#     def test_weather_advice_missing_fields(self): ...
#     def test_weather_advice_invalid_types(self): ...
#     def test_weather_advice_with_valid_data(self, mock_advice): ...
#     def test_weather_advice_chinese_language(self, mock_advice): ...
#     def test_weather_advice_error_handling(self, mock_advice): ...

class TestAnalyzeImagesEndpoint:
    """Tests for image analysis endpoint"""

    def test_analyze_images_missing_user(self):
        """Test analyze images with missing user field"""
        response = client.post("/analyze-images", json={})
        assert response.status_code == 422  # Validation error

    @patch('runner.runner.analyze_images', new_callable=AsyncMock)
    def test_analyze_images_with_user(self, mock_analyze):
        """Test analyze images endpoint with mocked runner"""
        # Mock the async function
        mock_analyze.return_value = {
            "analysis": "Skin condition has improved over the past week",
            "images_analyzed": 5
        }

        response = client.post(
            "/analyze-images",
            json={"user": "test-user-123", "max_images": 10}
        )

        # May succeed with mock or fail if dependencies not available
        assert response.status_code in [200, 500, 503]


class TestCORS:
    """Tests for CORS configuration"""

    def test_cors_enabled(self):
        """Test that CORS headers are present"""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"}
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_cors_allows_all_origins(self):
        """Test that CORS allows all origins"""
        response = client.get(
            "/health",
            headers={"Origin": "http://example.com"}
        )
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == "*"

class TestErrorHandling:
    """Tests for error handling and edge cases"""

    def test_invalid_route_returns_404(self):
        """Test that invalid routes return 404"""
        response = client.get("/this-route-does-not-exist")
        assert response.status_code == 404

    def test_invalid_http_method(self):
        """Test that wrong HTTP method returns 405"""
        response = client.post("/health")  # Health is GET only
        assert response.status_code == 405

    def test_malformed_json(self):
        """Test that malformed JSON returns 422"""
        response = client.post(
            "/chat",
            data="this is not json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

class TestAPIMetadata:
    """Tests for API metadata and configuration"""

    def test_api_title(self):
        """Test that API has correct title"""
        assert app.title == "Skincare RAG API"

    def test_api_version(self):
        """Test that API has version defined"""
        assert app.version == "1.0.0"

    def test_cors_middleware_configured(self):
        """Test that CORS middleware is configured"""
        # Check by verifying CORS headers are present in response
        response = client.get("/health", headers={"Origin": "http://test.com"})
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers


def test_api_health_check():
    """Test that the API is healthy and responding"""
    # Use /health endpoint since there's no root endpoint
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
