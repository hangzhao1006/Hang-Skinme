"""
Image Upload Handler - Save user-uploaded images to GCS with proper naming
"""

import os
import base64
from datetime import datetime
from typing import Optional
from google.cloud import storage
from .user_profile_manager import sanitize_email

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
GCS_IMAGE_PREFIX = os.getenv("GCS_IMAGE_PREFIX", "user_image")


class ImageUploadHandler:
    """Handle uploading user images to GCS with proper naming convention."""

    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.image_prefix = GCS_IMAGE_PREFIX

    def upload_image(self, email: str, image_data: str, image_format: str = "jpg") -> Optional[str]:
        """
        Upload user image to GCS.

        Args:
            email: User's email address
            image_data: Base64 encoded image data
            image_format: Image format (jpg, png, etc.)

        Returns:
            GCS path to uploaded image, or None if failed
        """
        username = sanitize_email(email)
        now = datetime.utcnow()

        # Generate filename: username_YYYYMMDD_HHMMSS.ext
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        filename = f"{username}_{timestamp}.{image_format.lower()}"

        # Full GCS path
        blob_path = f"{self.image_prefix}/{username}/{filename}"
        blob = self.bucket.blob(blob_path)

        try:
            # Decode base64 image data
            image_bytes = base64.b64decode(image_data)

            # Set content type
            content_type_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif"}
            content_type = content_type_map.get(image_format.lower(), "image/jpeg")

            # Upload to GCS
            blob.upload_from_string(image_bytes, content_type=content_type)

            print(f"Image uploaded: {blob_path}")
            return blob_path

        except Exception as e:
            print(f"Error uploading image for {username}: {e}")
            return None

    def get_user_image_count(self, email: str) -> int:
        """Get total number of images uploaded by user."""
        username = sanitize_email(email)
        prefix = f"{self.image_prefix}/{username}/"

        blobs = list(self.bucket.list_blobs(prefix=prefix))
        return len([b for b in blobs if not b.name.endswith("/")])

    def get_recent_images(self, email: str, limit: int = 5) -> list:
        """
        Get list of recent images uploaded by user.

        Args:
            email: User's email
            limit: Maximum number of images to return

        Returns:
            List of image blob paths
        """
        username = sanitize_email(email)
        prefix = f"{self.image_prefix}/{username}/"

        blobs = [blob for blob in self.bucket.list_blobs(prefix=prefix) if not blob.name.endswith("/")]

        # Sort by time_created (most recent first)
        blobs.sort(key=lambda b: b.time_created, reverse=True)

        return [blob.name for blob in blobs[:limit]]


# Global instance
image_upload_handler = ImageUploadHandler()
