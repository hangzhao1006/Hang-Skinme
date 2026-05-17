"""
Fast keyword-based routing for skincare agent system.
Agents return raw data, main chat model handles conversational formatting.
"""

import re
from typing import Optional

from .analysis_agent import analyze_skin
from .recommendation_agent import recommend_products
from .image_analysis_agent import analyze_user_image_history


def _extract_user_for_history(text: Optional[str]) -> Optional[str]:
    """Find user token after 'history' or 'image history'."""
    if not text:
        return None
    match = re.search(r"history\s+([\w-]+)", text, re.IGNORECASE)
    return match.group(1) if match else None


def classify_intent_fast(user_input: str, has_image: bool = False) -> str:
    """
    Fast keyword-based routing - no LLM call needed.

    Returns: 'analysis_only' | 'recommendation' | 'both' | 'image_history' | 'none'

    Logic:
    - 'recommendation': Explicit product request keywords
    - 'analysis_only': Skin concern description without product request
    - 'both': Context suggests user wants complete help (concern + solution)
    - 'image_history': Historical image comparison request
    - 'none': General chat, no agents needed
    """
    if not user_input:
        if has_image:
            return "both"  # Image without text -> analyze + recommend
        return "none"

    message_lower = user_input.lower()

    # Check for image history request
    if "history" in message_lower and any(word in message_lower for word in ["image", "photo", "picture", "progress"]):
        return "image_history"

    # Explicit product recommendation keywords
    # Note: Check for more specific phrases first (e.g., "recommend product" before "product")
    product_keywords = [
        "recommend product",
        "recommendation",
        "product for",
        "product link",
        "product links",
        "product",
        "products",
        "routine for",
        "routine",
        "what should i use",
        "what product",
        "which product",
        "show me product",
        "suggest product",
        "best product",
        "buy",
        "purchase",
        "shopping",
        "what to use",
        "help me find",
        "looking for product",
        "need product",
        "link",
        "links",
        "url",
        "where to buy",
        "where can i buy",
        "show me",
        "suggest",
        "give me",
        # Chinese keywords
        "推荐", "产品", "护肤品", "购买", "买", "哪里买", "链接",
        "日常护理", "护肤", "精华", "面霜", "防晒", "洁面", "爽肤水",
        "什么产品", "用什么", "哪款", "好用", "效果好",
    ]

    if any(keyword in message_lower for keyword in product_keywords):
        return "recommendation"  # Will do both analysis + recommendation

    # Skin concern keywords (might want analysis)
    concern_keywords = [
        "dry skin", "oily skin", "acne", "wrinkle", "aging", "dark spot",
        "redness", "irritation", "sensitive", "concern", "problem",
        "breakout", "blemish", "fine line", "texture", "pore",
        "hyperpigmentation", "uneven", "dull",
        # Chinese keywords
        "干皮", "油皮", "干燥", "出油", "痘痘", "粉刺", "闭口", "黑头",
        "皱纹", "抗老", "色斑", "暗沉", "敏感", "泛红", "毛孔", "肤质",
        "过敏", "刺激", "暗黄", "不均匀", "细纹",
    ]

    has_concern = any(keyword in message_lower for keyword in concern_keywords)

    # Follow-up affirmatives after agent provided analysis
    affirmative_keywords = ["yes", "sure", "please", "ok", "okay", "yeah", "yep"]
    is_short_affirmative = len(user_input.split()) <= 3 and any(
        keyword == message_lower or message_lower.startswith(keyword) for keyword in affirmative_keywords
    )

    if has_image:
        # Image upload always needs analysis, might need recommendations
        return "both" if has_concern else "analysis_only"

    if has_concern:
        # Mentioned concern but not explicitly asking for products
        # Return analysis only, let chat model offer to recommend products
        return "analysis_only"

    if is_short_affirmative:
        # Short "yes" responses - let chat history handle this, no agents
        return "none"

    # Default: general conversation, no agents needed
    return "none"


def route_and_process(user_input: str, user_image=None, intent: str = None) -> dict:
    """
    Fast keyword-based routing to appropriate agents.
    Returns raw structured data for chat model to format conversationally.

    Returns dict with:
    - 'agent_type': 'analysis' | 'recommendation' | 'image_history' | None
    - Raw agent data (condition, ingredients, products, etc.)
    """
    # Use pre-computed intent if provided (avoids re-classifying the contextualized message)
    if intent is None:
        intent = classify_intent_fast(user_input, has_image=bool(user_image))
    print(f"⚡ Fast routing decision: {intent}")

    # Image history - special case
    if intent == "image_history":
        user = _extract_user_for_history(user_input)
        if not user:
            return {"agent_type": None, "error": "Missing user identifier for history lookup"}
        result = analyze_user_image_history(user=user)
        result["agent_type"] = "image_history"
        return result

    if intent == "none":
        return {"agent_type": None}

    # Analysis only - return raw ingredient recommendations
    if intent == "analysis_only":
        analysis = analyze_skin(user_text=user_input, user_image=user_image)
        analysis["agent_type"] = "analysis"
        return analysis

    # Recommendation or Both - do full pipeline
    if intent == "recommendation" or intent == "both":
        analysis = analyze_skin(user_text=user_input, user_image=user_image)
        recommendations = recommend_products(analysis)
        # Combine both results
        recommendations["agent_type"] = "recommendation"
        recommendations["analysis"] = analysis  # Include analysis data
        return recommendations

    return {"agent_type": None}


# routing agent常见的实践方式，rule-based routing，semantic routing，embedding
