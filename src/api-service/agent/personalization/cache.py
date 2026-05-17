"""
Simple in-memory cache for user contexts to improve latency
"""

import time
from typing import Optional, Any, Dict
from threading import Lock


class SimpleCache:
    """Thread-safe in-memory cache with TTL support."""

    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache.

        Args:
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
        """
        self.cache: Dict[str, tuple[Any, float]] = {}
        self.lock = Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired.

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/missing
        """
        with self.lock:
            if key not in self.cache:
                return None

            value, expiry = self.cache[key]
            if time.time() > expiry:
                # Expired, remove from cache
                del self.cache[key]
                return None

            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)
        with self.lock:
            self.cache[key] = (value, expiry)

    def invalidate(self, key: str):
        """Remove key from cache."""
        with self.lock:
            if key in self.cache:
                del self.cache[key]

    def clear(self):
        """Clear entire cache."""
        with self.lock:
            self.cache.clear()


# Global cache instances
user_context_cache = SimpleCache(default_ttl=300)  # 5 minutes
profile_cache = SimpleCache(default_ttl=600)  # 10 minutes
