"""
Weather Context Manager - Format weather data for AI personalization
"""

from typing import Optional, Dict, Any


def format_weather_context(weather_data: Optional[Dict[str, Any]]) -> str:
    """
    Format weather data into context string for AI.

    Args:
        weather_data: Dictionary with temperature, humidity, uv_index, weather_condition

    Returns:
        Formatted weather context string or empty string if no data
    """
    if not weather_data:
        return ""

    # Extract weather parameters
    temp = weather_data.get("temperature")
    if temp is None:
        temp = weather_data.get("temp_c")
    if temp is None:
        temp = weather_data.get("temp")

    humidity = weather_data.get("humidity")

    uv_index = weather_data.get("uv_index")
    if uv_index is None:
        uv_index = weather_data.get("uvIndex")

    condition = weather_data.get("weather_condition")
    if not condition:
        condition = weather_data.get("condition", "")

    location = weather_data.get("location")

    # Skip if essential data is missing
    if temp is None or humidity is None:
        return ""

    location_str = f"Location: {location}\n" if location else ""

    context = f"""
Current Weather:
{location_str}- Temperature: {temp}°C
- Humidity: {humidity}%
- UV Index: {uv_index if uv_index else 'N/A'}
- Condition: {condition if condition else 'N/A'}

Please consider these weather conditions when providing skincare advice.
"""

    return context.strip()
