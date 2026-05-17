"""
Weather-related utility functions for skincare advice.
"""


def generate_weather_advice(
    temperature: float, humidity: int, uv_index: int, weather_condition: str, language: str = "en"
) -> str:
    """
    Generate simple rule-based skincare advice based on weather conditions.
    This is a simplified version that doesn't require Vertex AI.

    Args:
        temperature: Temperature in Celsius
        humidity: Humidity percentage (0-100)
        uv_index: UV index (0-11+)
        weather_condition: Current weather condition (e.g., "Sunny", "Cloudy")
        language: Language code ("en" or "zh")

    Returns:
        str: Weather-based skincare advice
    """
    advice_parts = []

    if language == "zh":
        # Chinese advice
        if temperature > 30:
            advice_parts.append("🌡️ 高温天气，加强保湿和防晒")
        elif temperature < 10:
            advice_parts.append("❄️ 寒冷天气，增强保湿防护")

        if humidity < 30:
            advice_parts.append("💧 低湿度环境，使用保湿精华")
        elif humidity > 70:
            advice_parts.append("💦 高湿度环境，使用清爽型产品")

        if uv_index >= 6:
            advice_parts.append("🌞 紫外线较强，务必涂抹防晒霜")
        elif uv_index >= 3:
            advice_parts.append("☀️ 紫外线中等，建议使用防晒产品")

        if not advice_parts:
            advice_parts.append("保持基础护肤routine")
    else:
        # English advice
        if temperature > 30:
            advice_parts.append("🌡️ Hot weather - boost moisturizing and sun protection")
        elif temperature < 10:
            advice_parts.append("❄️ Cold weather - enhance moisturizing protection")

        if humidity < 30:
            advice_parts.append("💧 Low humidity - use hydrating serum")
        elif humidity > 70:
            advice_parts.append("💦 High humidity - use lightweight products")

        if uv_index >= 6:
            advice_parts.append("🌞 Strong UV - apply sunscreen")
        elif uv_index >= 3:
            advice_parts.append("☀️ Moderate UV - sunscreen recommended")

        if not advice_parts:
            advice_parts.append("Maintain your basic skincare routine")

    return ". ".join(advice_parts) + "."
