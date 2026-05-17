"""
Unit tests for personalization.cache module
"""

import pytest
import time
import sys
import os
from unittest.mock import patch

# Add the api-service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src/api-service/api-service'))

from agent.personalization.cache import SimpleCache, user_context_cache, profile_cache


class TestSimpleCache:
    """Test SimpleCache class"""

    def test_cache_initialization(self):
        """Test cache initializes with correct default TTL"""
        cache = SimpleCache(default_ttl=300)
        assert cache.default_ttl == 300
        assert cache.cache == {}

    def test_cache_set_and_get(self):
        """Test basic set and get operations"""
        cache = SimpleCache(default_ttl=60)
        cache.set("test_key", "test_value")

        result = cache.get("test_key")
        assert result == "test_value"

    def test_cache_get_nonexistent_key(self):
        """Test getting a key that doesn't exist"""
        cache = SimpleCache()
        result = cache.get("nonexistent")
        assert result is None

    def test_cache_expiry(self):
        """Test that expired items return None"""
        cache = SimpleCache(default_ttl=1)
        cache.set("test_key", "test_value", ttl=1)

        # Value should exist immediately
        assert cache.get("test_key") == "test_value"

        # Wait for expiry
        time.sleep(1.1)

        # Value should be expired and removed
        assert cache.get("test_key") is None

    def test_cache_custom_ttl(self):
        """Test setting custom TTL for individual items"""
        cache = SimpleCache(default_ttl=300)
        cache.set("short_ttl", "value1", ttl=1)
        cache.set("long_ttl", "value2", ttl=10)

        time.sleep(1.1)

        assert cache.get("short_ttl") is None
        assert cache.get("long_ttl") == "value2"

    def test_cache_invalidate(self):
        """Test invalidating a cache entry"""
        cache = SimpleCache()
        cache.set("test_key", "test_value")

        assert cache.get("test_key") == "test_value"

        cache.invalidate("test_key")
        assert cache.get("test_key") is None

    def test_cache_invalidate_nonexistent(self):
        """Test invalidating a key that doesn't exist"""
        cache = SimpleCache()
        # Should not raise an error
        cache.invalidate("nonexistent")

    def test_cache_clear(self):
        """Test clearing entire cache"""
        cache = SimpleCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") is None
        assert len(cache.cache) == 0

    def test_cache_stores_different_types(self):
        """Test that cache can store different data types"""
        cache = SimpleCache()

        cache.set("string", "test")
        cache.set("int", 42)
        cache.set("list", [1, 2, 3])
        cache.set("dict", {"key": "value"})

        assert cache.get("string") == "test"
        assert cache.get("int") == 42
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"key": "value"}

    def test_cache_thread_safety(self):
        """Test that cache operations are thread-safe"""
        import threading
        cache = SimpleCache()

        def set_value(key, value):
            cache.set(key, value)

        def get_value(key):
            return cache.get(key)

        # Create multiple threads
        threads = []
        for i in range(10):
            t = threading.Thread(target=set_value, args=(f"key{i}", f"value{i}"))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        # Verify all values were set
        for i in range(10):
            assert cache.get(f"key{i}") == f"value{i}"

    def test_expired_entry_removed_on_get(self):
        """Test that expired entries are removed from cache on get"""
        cache = SimpleCache()
        cache.set("test_key", "test_value", ttl=1)

        time.sleep(1.1)

        # Getting expired key should remove it
        assert cache.get("test_key") is None
        assert "test_key" not in cache.cache


class TestGlobalCacheInstances:
    """Test global cache instances"""

    def test_user_context_cache_exists(self):
        """Test that user_context_cache is initialized"""
        assert user_context_cache is not None
        assert user_context_cache.default_ttl == 300

    def test_profile_cache_exists(self):
        """Test that profile_cache is initialized"""
        assert profile_cache is not None
        assert profile_cache.default_ttl == 600

    def test_global_caches_are_independent(self):
        """Test that global caches don't interfere with each other"""
        user_context_cache.set("test_key", "user_value")
        profile_cache.set("test_key", "profile_value")

        assert user_context_cache.get("test_key") == "user_value"
        assert profile_cache.get("test_key") == "profile_value"

        # Cleanup
        user_context_cache.clear()
        profile_cache.clear()
