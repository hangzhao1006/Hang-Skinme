import os
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from google.cloud import storage
from google import genai
from google.genai import types

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
GCS_IMAGE_PREFIX = os.getenv("GCS_IMAGE_PREFIX", "user_image")

_client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

FILENAME_RE = re.compile(
    r"^(?P<user>[^_]+)_(?P<date>\d{8})(?:_(?P<time>\d{6}))?\.(jpg|jpeg|png)$",
    re.IGNORECASE,
)


def _parse_date_from_filename(filename: str) -> Optional[Tuple[datetime, str]]:
    """Parse date/time from file naming convention: user_YYYYMMDD_HHMMSS.ext"""
    stem = os.path.basename(filename)
    match = FILENAME_RE.match(stem)
    if not match:
        return None
    date_part = match.group("date")
    time_part = match.group("time") or "000000"
    try:
        dt = datetime.strptime(date_part + time_part, "%Y%m%d%H%M%S")
        return dt, date_part
    except ValueError:
        return None


def _group_blobs_by_day(blobs: List) -> Dict[str, List]:
    """Group blob objects by their date token."""
    grouped: Dict[str, List] = {}
    for blob in blobs:
        parsed = _parse_date_from_filename(blob.name)
        if not parsed:
            continue
        _, date_str = parsed
        grouped.setdefault(date_str, []).append(blob)
    return dict(sorted(grouped.items()))


def _build_contents(grouped: Dict[str, List], user: str) -> List:
    """Create multimodal parts for Gemini by reading directly from blob objects."""
    parts = []
    intro = (
        "You are a skincare expert analyzing a user's photo history.\n"
        "For each date, review the provided images and summarize skin condition, \n"
        "noting acne/inflammation/dryness/texture.\n"
        "Then explain whether the skin improved, worsened, or stayed stable day-over-day, and why.\n"
        "Be concise but specific. Avoid hallucinations—only rely on what is visible."
    )
    parts.append(types.Part(text=intro))

    for date_str, blobs in grouped.items():
        parts.append(types.Part(text=f"Date {date_str} for user {user}:"))
        for blob in blobs:
            # Read directly from GCS to memory
            data = blob.download_as_bytes()
            blob_name = blob.name.lower()
            mime = "image/jpeg" if blob_name.endswith(("jpg", "jpeg")) else "image/png"
            parts.append(types.Part.from_bytes(data=data, mime_type=mime))
    return parts


def fetch_user_image_blobs(
    user: str,
    bucket_name: Optional[str] = None,
    prefix: Optional[str] = None,
    limit: Optional[int] = None,
) -> List:
    """
    Fetch blob objects for a user from GCS without downloading to disk.
    Returns list of blob objects.
    """
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(bucket_name or BUCKET_NAME)
    base_prefix = prefix or GCS_IMAGE_PREFIX
    path_prefix = f"{base_prefix}/{user}"

    blobs = [blob for blob in bucket.list_blobs(prefix=path_prefix) if not blob.name.endswith("/")]

    return blobs[:limit] if limit else blobs


def analyze_user_image_history(user: str, limit: Optional[int] = None) -> Dict:
    """
    Fetch user images from GCS and run a temporal analysis per day.
    Images are read directly to memory without downloading to disk.

    Returns:
        dict with grouped image info and Gemini summary.
    """
    blobs = fetch_user_image_blobs(user=user, limit=limit)
    if not blobs:
        return {
            "message": f"No images found for user '{user}'.",
            "image_count": 0,
            "days": [],
        }

    grouped = _group_blobs_by_day(blobs)
    if not grouped:
        return {
            "message": f"No images matched expected naming pattern for user '{user}'.",
            "image_count": len(blobs),
            "days": [],
        }

    contents = _build_contents(grouped, user=user)
    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config={"temperature": 0.3},
    )

    return {
        "message": response.text,
        "image_count": len(blobs),
        "days": list(grouped.keys()),
    }
