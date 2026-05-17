"""
Chat Logger - Log conversations to GCS for personalization and history
"""

import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from google.cloud import storage
from .user_profile_manager import sanitize_email

# Import timedelta
from datetime import timedelta

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class ChatLogger:
    """Log user conversations to GCS in JSONL format."""

    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.chat_log_prefix = "user_chat_history"

    def _get_log_path(self, username: str, date: datetime) -> str:
        """Get GCS path for chat log file."""
        year_month = date.strftime("%Y%m")
        date_str = date.strftime("%Y%m%d")
        return f"{self.chat_log_prefix}/{username}/{year_month}/chat_log_{date_str}.jsonl"

    def log_message(
        self,
        email: str,
        role: str,
        message: str,
        image_uploaded: bool = False,
        analysis_result: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
    ) -> bool:
        """
        Log a single message to GCS.

        Args:
            email: User's email address
            role: 'user' or 'assistant'
            message: The message content
            image_uploaded: Whether an image was uploaded with this message
            analysis_result: Analysis results if applicable
            metadata: Additional metadata to store
        """
        username = sanitize_email(email)
        now = datetime.utcnow()
        blob_path = self._get_log_path(username, now)
        blob = self.bucket.blob(blob_path)

        # Create log entry
        log_entry = {
            "timestamp": now.isoformat() + "Z",
            "role": role,
            "message": message,
            "image_uploaded": image_uploaded,
        }

        if analysis_result:
            log_entry["analysis"] = analysis_result

        if metadata:
            log_entry["metadata"] = metadata

        try:
            # Read existing content
            existing_content = ""
            if blob.exists():
                existing_content = blob.download_as_text()

            # Append new entry as JSONL
            new_line = json.dumps(log_entry) + "\n"
            updated_content = existing_content + new_line

            # Upload back
            blob.upload_from_string(updated_content, content_type="application/x-ndjson")
            return True
        except Exception as e:
            print(f"Error logging message for {username}: {e}")
            return False

    def log_conversation_turn(
        self,
        email: str,
        user_message: str,
        assistant_response: str,
        image_uploaded: bool = False,
        analysis_result: Optional[Dict] = None,
    ) -> bool:
        """
        Log both user message and assistant response in one call.

        Args:
            email: User's email
            user_message: User's message
            assistant_response: Assistant's response
            image_uploaded: Whether user uploaded an image
            analysis_result: Analysis results if applicable
        """
        # Log user message
        self.log_message(email=email, role="user", message=user_message, image_uploaded=image_uploaded)

        # Log assistant response
        return self.log_message(
            email=email, role="assistant", message=assistant_response, analysis_result=analysis_result
        )

    def get_recent_conversations(self, email: str, days: int = 7, limit: Optional[int] = 50) -> List[Dict[str, Any]]:
        """
        Retrieve recent conversation history for a user.

        Args:
            email: User's email
            days: Number of days to look back
            limit: Maximum number of messages to return

        Returns:
            List of log entries (most recent first)
        """
        username = sanitize_email(email)
        now = datetime.utcnow()

        # Generate list of potential log file paths to check
        conversations = []
        for day_offset in range(days):
            check_date = datetime(now.year, now.month, now.day) - timedelta(days=day_offset)
            blob_path = self._get_log_path(username, check_date)
            blob = self.bucket.blob(blob_path)

            if blob.exists():
                try:
                    content = blob.download_as_text()
                    for line in content.strip().split("\n"):
                        if line:
                            conversations.append(json.loads(line))
                except Exception as e:
                    print(f"Error reading {blob_path}: {e}")

        # Sort by timestamp (most recent first) and limit
        conversations.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return conversations[:limit] if limit else conversations

    def get_conversation_summary(self, email: str, days: int = 7, max_tokens: int = 500) -> str:
        """
        Generate a CONCISE summary (~20 words) of recent conversations for AI context.

        Focus on key facts: skin concerns, allergies, preferences mentioned in recent chats.

        Args:
            email: User's email
            days: Number of days to look back
            max_tokens: Maximum tokens to use (default: 500, ~2000 chars)

        Returns:
            Concise summary string for AI context (~20 words)
        """
        conversations = self.get_recent_conversations(email, days=days, limit=5)

        if not conversations:
            return "No recent conversation history."

        # Extract key information from recent conversations
        key_info = []

        for conv in conversations[:3]:  # Only last 3 conversations
            role = conv.get("role", "")
            message = conv.get("message", "").lower()

            # ONLY extract information from USER messages, not assistant responses
            # This prevents hallucinations where assistant mentions concerns that user never mentioned
            if role != "user":
                continue

            # Check for allergies mentioned
            if "allerg" in message or "sensitive" in message:
                # Extract the allergy context
                snippet = conv.get("message", "")[:60]
                key_info.append(f"mentioned: {snippet}")

            # Check for skin concerns
            concern_keywords = ["acne", "dry", "oily", "wrinkle", "aging", "dark spot", "redness"]
            for concern in concern_keywords:
                if concern in message:
                    key_info.append(f"concern: {concern}")
                    break

            # Check for image uploads
            if conv.get("image_uploaded"):
                key_info.append("uploaded skin image")

        if not key_info:
            # If no specific key info, just return empty (no need to mention vague "recent conversations")
            # This prevents potential hallucinations from generic snippets
            return "No recent conversation history."

        # Combine key info into concise summary (target ~20 words)
        summary = "CHAT HISTORY: " + "; ".join(key_info[:2])  # Max 2 key facts

        # Truncate to ~20 words if too long
        words = summary.split()
        if len(words) > 25:
            summary = " ".join(words[:25]) + "..."

        return summary


# Global instance
chat_logger = ChatLogger()
