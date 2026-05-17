"""
Pytest configuration and shared fixtures for all tests
Provides common mock fixtures and test setup
"""

import os
import sys
from unittest.mock import MagicMock, patch, AsyncMock

# Mock GCS client BEFORE any imports that might initialize it
mock_storage_client = MagicMock()
sys.modules['google.cloud.storage'] = MagicMock()

# Set environment variables BEFORE any imports that might use them
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'false'
os.environ['GCP_PROJECT'] = 'test-project'
os.environ['BUCKET_NAME'] = 'test-bucket'
os.environ['RAG_CORPUS'] = 'test-corpus'
os.environ['GEMINI_MODEL'] = 'gemini-2.0-flash'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/tmp/fake-credentials.json'

# Mock Google Auth to prevent credential errors
import google.auth
google.auth.default = MagicMock(return_value=(MagicMock(), 'test-project'))

import pytest


@pytest.fixture(autouse=True)
def mock_env_vars():
    """
    Set up test environment variables for all tests
    This fixture runs automatically for every test
    """
    # Save original env vars
    original_env = os.environ.copy()

    # Ensure test environment variables are set
    os.environ['GCP_PROJECT'] = 'test-project'
    os.environ['BUCKET_NAME'] = 'test-bucket'
    os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'false'
    os.environ['RAG_CORPUS'] = 'test-corpus'
    os.environ['GEMINI_MODEL'] = 'gemini-2.0-flash'

    yield

    # Restore original environment after test
    os.environ.clear()
    os.environ.update(original_env)


@pytest.fixture
def mock_gcp_storage():
    """Mock Google Cloud Storage client"""
    with patch('google.cloud.storage.Client') as mock_client:
        mock_storage = MagicMock()
        mock_client.return_value = mock_storage
        yield mock_storage


@pytest.fixture
def mock_vertexai():
    """Mock Vertex AI initialization"""
    with patch('vertexai.init') as mock_init:
        yield mock_init


@pytest.fixture
def mock_genai_client():
    """Mock Google GenAI client"""
    with patch('google.genai.Client') as mock_client:
        yield mock_client


# Optional: Add custom markers for test categorization
def pytest_configure(config):
    """Register custom pytest markers"""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "system: mark test as a system test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
