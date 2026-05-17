"""
Authentication Manager - Handle user authentication with GCS storage
Stores user credentials securely in Google Cloud Storage
"""

import os
import json
import hashlib
import secrets
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


def sanitize_email(email: str) -> str:
    """Convert email to safe filename format."""
    return email.lower().replace("@", "_at_").replace(".", "_").replace("+", "_plus_")


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hash password with salt using SHA-256.

    Args:
        password: Plain text password
        salt: Optional salt, if None a new one is generated

    Returns:
        Tuple of (hashed_password, salt)
    """
    if salt is None:
        salt = secrets.token_hex(32)

    # Hash password with salt
    password_salt = f"{password}{salt}"
    hashed = hashlib.sha256(password_salt.encode()).hexdigest()

    return hashed, salt


def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    """
    Verify password against stored hash.

    Args:
        password: Plain text password to verify
        hashed_password: Stored hashed password
        salt: Salt used for hashing

    Returns:
        True if password matches, False otherwise
    """
    test_hash, _ = hash_password(password, salt)
    return test_hash == hashed_password


def generate_token() -> str:
    """Generate a random session token."""
    return secrets.token_urlsafe(32)


class AuthManager:
    """Manage user authentication with GCS storage."""

    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.auth_prefix = "user_auth"
        self.index_path = f"{self.auth_prefix}/email_index.json"

    def _get_user_auth_path(self, username: str) -> str:
        """Get GCS path for user authentication data."""
        return f"{self.auth_prefix}/{username}/credentials.json"

    def _load_email_index(self) -> Dict[str, str]:
        """
        Load email index mapping email -> username.
        This allows quick duplicate email checking.
        """
        blob = self.bucket.blob(self.index_path)

        if blob.exists():
            try:
                return json.loads(blob.download_as_text())
            except Exception as e:
                print(f"Error loading email index: {e}")
                return {}
        return {}

    def _save_email_index(self, index: Dict[str, str]) -> bool:
        """Save email index to GCS."""
        blob = self.bucket.blob(self.index_path)
        try:
            blob.upload_from_string(json.dumps(index, indent=2), content_type="application/json")
            return True
        except Exception as e:
            print(f"Error saving email index: {e}")
            return False

    def email_exists(self, email: str) -> bool:
        """
        Check if email is already registered.

        Args:
            email: Email address to check

        Returns:
            True if email exists, False otherwise
        """
        email_lower = email.lower()
        index = self._load_email_index()
        return email_lower in index

    def register_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """
        Register a new user.

        Args:
            email: User's email address
            password: Plain text password (will be hashed)
            name: User's display name

        Returns:
            Dict with success status, user data, or error message
        """
        email_lower = email.lower()

        # Check if email already exists
        if self.email_exists(email_lower):
            return {
                "success": False,
                "error": "Email already registered. Please use a different email or try logging in.",
            }

        # Validate password length
        if len(password) < 6:
            return {"success": False, "error": "Password must be at least 6 characters long."}

        # Generate username from email
        username = sanitize_email(email_lower)

        # Hash password
        hashed_password, salt = hash_password(password)

        # Create user authentication data
        auth_data = {
            "email": email_lower,
            "name": name,
            "username": username,
            "hashed_password": hashed_password,
            "salt": salt,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "last_login": None,
            "active": True,
        }

        # Save auth data to GCS
        auth_path = self._get_user_auth_path(username)
        auth_blob = self.bucket.blob(auth_path)

        try:
            auth_blob.upload_from_string(json.dumps(auth_data, indent=2), content_type="application/json")

            # Update email index
            index = self._load_email_index()
            index[email_lower] = username
            self._save_email_index(index)

            # Generate session token
            token = generate_token()

            # Return user data (without sensitive info)
            return {
                "success": True,
                "user": {"id": username, "email": email_lower, "name": name, "createdAt": auth_data["created_at"]},
                "token": token,
            }

        except Exception as e:
            print(f"Error registering user {username}: {e}")
            return {"success": False, "error": f"Registration failed: {str(e)}"}

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user login.

        Args:
            email: User's email address
            password: Plain text password

        Returns:
            Dict with success status, user data, token, or error message
        """
        email_lower = email.lower()

        # Check if email exists
        if not self.email_exists(email_lower):
            return {"success": False, "error": "Invalid email or password."}

        # Get username from index
        index = self._load_email_index()
        username = index.get(email_lower)

        if not username:
            return {"success": False, "error": "Invalid email or password."}

        # Load auth data
        auth_path = self._get_user_auth_path(username)
        auth_blob = self.bucket.blob(auth_path)

        if not auth_blob.exists():
            return {"success": False, "error": "Invalid email or password."}

        try:
            auth_data = json.loads(auth_blob.download_as_text())

            # Check if account is active
            if not auth_data.get("active", True):
                return {"success": False, "error": "Account is disabled. Please contact support."}

            # Verify password
            if not verify_password(password, auth_data["hashed_password"], auth_data["salt"]):
                return {"success": False, "error": "Invalid email or password."}

            # Update last login time
            auth_data["last_login"] = datetime.utcnow().isoformat() + "Z"
            auth_blob.upload_from_string(json.dumps(auth_data, indent=2), content_type="application/json")

            # Generate session token
            token = generate_token()

            # Return user data (without sensitive info)
            return {
                "success": True,
                "user": {
                    "id": username,
                    "email": auth_data["email"],
                    "name": auth_data["name"],
                    "createdAt": auth_data["created_at"],
                },
                "token": token,
            }

        except Exception as e:
            print(f"Error during login for {username}: {e}")
            return {"success": False, "error": "Login failed. Please try again."}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify session token (basic implementation).
        For production, use JWT or similar.

        Args:
            token: Session token

        Returns:
            User data if valid, None otherwise
        """
        # This is a basic implementation
        # In production, you should use JWT tokens with expiration
        # For now, we'll just validate the token format
        if not token or len(token) < 32:
            return None

        # In a real implementation, you would:
        # 1. Decode JWT token
        # 2. Verify signature
        # 3. Check expiration
        # 4. Return user data from token payload

        return None  # Placeholder

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user data by email (without sensitive information).

        Args:
            email: User's email address

        Returns:
            User data dict or None if not found
        """
        email_lower = email.lower()

        if not self.email_exists(email_lower):
            return None

        index = self._load_email_index()
        username = index.get(email_lower)

        if not username:
            return None

        auth_path = self._get_user_auth_path(username)
        auth_blob = self.bucket.blob(auth_path)

        if not auth_blob.exists():
            return None

        try:
            auth_data = json.loads(auth_blob.download_as_text())
            return {
                "id": username,
                "email": auth_data["email"],
                "name": auth_data["name"],
                "createdAt": auth_data["created_at"],
                "lastLogin": auth_data.get("last_login"),
            }
        except Exception as e:
            print(f"Error loading user data: {e}")
            return None


# Global instance
auth_manager = AuthManager()
