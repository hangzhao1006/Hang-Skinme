"""
Calendar Manager - Manage user calendar events with GCS storage and AI-based activity detection
"""

import os
import json
from typing import List, Dict, Any
from datetime import datetime
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class CalendarManager:
    """Manage calendar events with GCS storage and outdoor activity detection."""

    def __init__(self):
        self.bucket_name = BUCKET_NAME
        self.storage_client = storage.Client()

    def _get_calendar_path(self, identifier: str) -> str:
        """Get GCS path for user's calendar events.

        Args:
            identifier: Either email (for logged-in users) or session_id (for anonymous users)
        """
        # If identifier looks like an email, use the user path
        if "@" in identifier:
            return f"users/{identifier}/calendar_events.json"
        # Otherwise it's a session_id, use anonymous path
        else:
            return f"anonymous/{identifier}/calendar_events.json"

    def save_events(self, identifier: str, events: List[Dict[str, Any]]) -> bool:
        """Save calendar events to GCS.

        Args:
            identifier: Either email or session_id
        """
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(self._get_calendar_path(identifier))
            blob.upload_from_string(json.dumps(events, indent=2))
            return True
        except Exception as e:
            print(f"Error saving calendar events: {e}")
            return False

    def load_events(self, identifier: str) -> List[Dict[str, Any]]:
        """Load calendar events from GCS.

        Args:
            identifier: Either email or session_id
        """
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(self._get_calendar_path(identifier))

            if not blob.exists():
                return []

            data = blob.download_as_text()
            return json.loads(data)
        except Exception as e:
            print(f"Error loading calendar events: {e}")
            return []

    def get_calendar_context_summary(self, identifier: str) -> str:
        """Generate a text summary of upcoming calendar events for AI context with skincare recommendations.

        Args:
            identifier: Either email or session_id
        """
        events = self.load_events(identifier)

        # Get current date
        today = datetime.now().date()

        # Filter upcoming events (next 7 days)
        upcoming_events = []
        today_events = []
        tomorrow_events = []

        for event in events:
            event_date = datetime.strptime(event["date"], "%Y-%m-%d").date()
            days_until = (event_date - today).days

            if days_until == 0:
                today_events.append(event)
            elif days_until == 1:
                tomorrow_events.append(event)
            elif 0 <= days_until <= 7:
                upcoming_events.append((event, event_date, days_until))

        # Build summary
        summary_parts = []

        if today_events:
            summary_parts.append("📅 TODAY's Events:")
            for event in today_events:
                summary_parts.append(self._format_event_with_recommendations(event, "TODAY"))

        if tomorrow_events:
            summary_parts.append("\n📅 TOMORROW's Events:")
            for event in tomorrow_events:
                summary_parts.append(self._format_event_with_recommendations(event, "TOMORROW"))

        if upcoming_events:
            summary_parts.append("\n📅 Upcoming Events (next 7 days):")
            for event, event_date, days_until in sorted(upcoming_events, key=lambda x: x[2])[:3]:
                date_str = event_date.strftime("%a, %b %d")
                summary_parts.append(
                    self._format_event_with_recommendations(event, f"in {days_until} days ({date_str})")
                )

        if summary_parts:
            return "📅 USER CALENDAR:\n" + "\n".join(summary_parts)
        return ""

    def _format_event_with_recommendations(self, event: Dict[str, Any], timing: str) -> str:
        """Format a single event with contextual details for AI recommendations."""
        title = event.get("title", "Untitled")
        description = event.get("description", "")
        event_type = event.get("type", "event")

        # Detect outdoor activities from title/description
        outdoor_keywords = [
            "outdoor",
            "tennis",
            "hiking",
            "beach",
            "pool",
            "swim",
            "run",
            "jog",
            "bike",
            "sport",
            "park",
            "garden",
            "golf",
            "ski",
            "surf",
        ]
        is_outdoor = any(keyword in title.lower() or keyword in description.lower() for keyword in outdoor_keywords)

        event_str = f"  • {timing}: {title}"

        if is_outdoor:
            event_str += " [⚠️ OUTDOOR ACTIVITY - Sun protection needed!]"

        if event_type == "product_delivery":
            delivery_status = event.get("deliveryStatus", "unknown")
            event_str += f" [📦 Delivery: {delivery_status}]"

        if description:
            event_str += f" - {description[:100]}"

        return event_str


# Global instance
calendar_manager = CalendarManager()
