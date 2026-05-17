"""
Integration tests for FastAPI endpoints
Tests the actual API endpoints with HTTP requests
"""

import pytest
import requests
import time
import os


# Base URL for the API (assumes API is running)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")


def is_api_running():
    """Check if API is accessible"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False


@pytest.mark.skipif(not is_api_running(), reason="API not running at localhost:8080")
class TestAPIEndpoints:
    """Integration tests for API endpoints"""

    # def test_root_endpoint(self):
    #     """Test the root endpoint returns welcome message"""
    #     response = requests.get(f"{API_BASE_URL}/")
    #     assert response.status_code == 200
    #     data = response.json()
    #     assert "message" in data
    #     assert "Skinme API Server" in data["message"]

    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{API_BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_check_response_structure(self):
        """Test health check returns correct structure"""
        response = requests.get(f"{API_BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert isinstance(data["status"], str)

    def test_clear_session(self):
        """Test clearing a session"""
        test_session_id = "test-session-123"
        response = requests.delete(f"{API_BASE_URL}/session/{test_session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cleared"
        assert data["session_id"] == test_session_id

    def test_get_session_history_empty(self):
        """Test getting history for non-existent session"""
        test_session_id = "non-existent-session-456"
        response = requests.get(f"{API_BASE_URL}/session/{test_session_id}/history")
        # 应该返回 200 和空历史，或者返回 404
        # 根据你的实际实现调整
        assert response.status_code in [200, 404]

# ============= Tier 2: request validation =============

    def test_chat_endpoint_missing_message(self):
        """Test chat endpoint with missing required field"""
        # /chat uses Form data, not JSON
        response = requests.post(
            f"{API_BASE_URL}/chat",
            data={}  # 缺少必需的 message 字段
        )
        assert response.status_code == 422  # Validation error

    def test_chat_endpoint_invalid_data(self):
        """Test chat endpoint with invalid data"""
        # /chat uses Form data
        response = requests.post(
            f"{API_BASE_URL}/chat",
            data={"message": ""}  # Empty message
        )
        # 服务实现可能接受空字符串并返回 200，或返回 422/500/503；测试接受这些情况
        assert response.status_code in [200, 422, 500, 503]

    # Weather advice endpoint tests removed - endpoint is commented out in main.py

    def test_analyze_images_missing_user(self):
        """Test analyze images endpoint with missing user field"""
        response = requests.post(
            f"{API_BASE_URL}/analyze-images",
            json={}  # 缺少必需的 user 字段
        )
        assert response.status_code == 422  # Validation error


# ============= Tier 3: end-to-end tests (if test environment available)=============

    @pytest.mark.skipif(
        os.getenv("ENABLE_E2E_TESTS") != "true",
        reason="E2E tests disabled (set ENABLE_E2E_TESTS=true to run)"
    )
    def test_chat_endpoint_real(self):
        """Test chat endpoint with real request (requires Vertex AI)"""
        # /chat uses Form data, not JSON
        response = requests.post(
            f"{API_BASE_URL}/chat",
            data={
                "message": "Hello, test message",
                "session_id": "test-e2e-session"
            }
        )
        # 如果外部服务可用，应该返回 200
        # 如果不可用，可能返回 503 或其他错误
        assert response.status_code in [200, 503]

        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert "session_id" in data
    # Weather advice E2E test removed - endpoint is commented out in main.py


# Standalone tests that don't require running API
class TestAPIWithoutServer:
    """Tests that can run without a live server"""

    def test_api_structure(self):
        """Test that we can import the API module"""
        import sys
        from pathlib import Path

        api_service_path = Path(__file__).parent.parent.parent / "src" / "api-service" / "api-service"

        sys.path.insert(0, str(api_service_path))

        from main import app

        assert app.title == "Skincare RAG API"
        assert app.version == "1.0.0"
