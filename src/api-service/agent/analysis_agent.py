import os
from google import genai
from google.genai import types
from vertexai.preview import rag
import vertexai

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
CORPUS = os.getenv("RAG_CORPUS")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

vertexai.init(project=PROJECT_ID, location=LOCATION)
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


def analyze_skin(user_text=None, user_image=None, weather_context=None):
    """Detect skin condition and get ingredient recommendations from RAG.

    Args:
        user_text: User's description of their skin concern
        user_image: Optional base64 encoded image
        weather_context: Optional weather context string for personalized advice
    """

    if not CORPUS:
        raise ValueError("RAG_CORPUS environment variable not set")

    # Identify condition
    full_user_input = user_text  # Initialize for all cases

    if user_image:
        try:
            # Convert base64 string to bytes if needed
            import base64

            if isinstance(user_image, str) and user_image.startswith("data:image"):
                # Extract base64 data from data URI
                image_data = user_image.split(",")[1]
                # image_bytes = base64.b64decode(image_data)
            else:
                # User_image is already base64 string
                image_data = user_image if isinstance(user_image, str) else base64.b64encode(user_image).decode("utf-8")
                # image_bytes = base64.b64decode(image_data) if isinstance(user_image, str) else user_image

            # Create content parts: text + image
            # Ask for a detailed, empathetic skin analysis
            parts = [
                types.Part(
                    text=user_text
                    or """Analyze this skin image as a dermatologist. Provide:

1. Overall skin assessment (what you observe)
2. Specific concerns (texture, inflammation, discoloration)
3. Likely skin condition(s)

Be professional and empathetic. Keep it concise - 3-4 sentences total."""
                ),
                types.Part(
                    inline_data={"mime_type": "image/jpeg", "data": image_data}
                ),  # Use the original base64 string
            ]

            response = client.models.generate_content(model=GEMINI_MODEL, contents=parts)
            condition = response.text.strip()
        except Exception as e:
            print(f"Image processing error: {e}")
            condition = user_text or "general skincare"
    else:
        # Extract just the user query if context is prepended
        if user_text and "User query:" in user_text:
            # Save full context for conversational response
            full_user_input = user_text
            # Extract just the query for RAG
            condition = user_text.split("User query:")[-1].strip()
        else:
            full_user_input = user_text
            condition = user_text or "general skincare"

    print(f"Detected condition: {condition}")

    # Extract weather context if present
    weather_context_extracted = None
    if full_user_input and "Current Weather:" in full_user_input:
        # Extract weather section
        weather_start = full_user_input.find("Current Weather:")
        weather_end = (
            full_user_input.find("User query:", weather_start)
            if "User query:" in full_user_input
            else len(full_user_input)
        )
        weather_context_extracted = full_user_input[weather_start:weather_end].strip()
    elif weather_context:
        weather_context_extracted = weather_context

    # query RAG
    rag_results = rag.retrieval_query(
        rag_resources=[rag.RagResource(rag_corpus=CORPUS)],
        text=f"What are the most effective ingredients for treating {condition}?",
        similarity_top_k=10,
    )

    rag_context = "\n\n".join([ctx.text for ctx in rag_results.contexts.contexts])

    analysis_prompt = f"""Based on this cosmetic formulation knowledge:

{rag_context}

For condition: {condition}

Provide ingredient recommendations in EXACTLY this format:

PRIMARY:
retinol
ubiquinone
niacinamide

SECONDARY:
vitamin c
hyaluronic acid

AVOID:
alcohol
fragrance

CRITICAL: One ingredient per line, lowercase only, no bullets or formatting. If none to avoid, write "none".
Be specific about ingredient names and concentrations when available. Strictly use what is found from the search."""

    analysis_response = client.models.generate_content(model=GEMINI_MODEL, contents=analysis_prompt)

    return parse_response(analysis_response.text, condition, weather_context_extracted)


def parse_response(text, condition, weather_context_extracted=None):
    """
    Parse ingredient lists from response.
    Returns RAW structured data - no formatting, let chat model handle presentation.
    """
    primary = []
    secondary = []
    avoid = []
    current_section = None

    for line in text.split("\n"):
        line = line.strip()
        line_lower = line.lower()

        if line_lower.startswith("primary"):
            current_section = "primary"
        elif line_lower.startswith("secondary"):
            current_section = "secondary"
        elif line_lower.startswith("avoid"):
            current_section = "avoid"
        elif line and current_section and line_lower != "none":
            if current_section == "primary":
                primary.append(line)
            elif current_section == "secondary":
                secondary.append(line)
            elif current_section == "avoid":
                avoid.append(line)

    # Return raw data only - chat model will format conversationally
    return {
        "condition": condition,
        "primary_ingredients": primary,
        "secondary_ingredients": secondary,
        "avoid_ingredients": avoid,
        "weather_context": weather_context_extracted,
        "full_analysis": text,
    }


# def get_weather_skincare_advice(
#     temperature: float,
#     humidity: int,
#     uv_index: int,
#     weather_condition: str,
#     location: Optional[str] = None,
#     language: str = "en",
# ) -> str:
#     """
#     Generate concise skincare advice based on weather conditions using Vertex AI.

#     This function wraps Vertex AI calls and attempts a fallback model when the
#     preferred model is not available. The preferred model can be overridden via
#     the `MODEL_NAME` environment variable.

#     Returns the advice text (str) or raises the original exception if all
#     attempts fail.
#     """
#     # Lazy import so module can be imported in environments without Vertex AI

#     project_id = os.environ.get("GCP_PROJECT", None)
#     location = os.environ.get("GCP_LOCATION", "us-central1")
#     if project_id:
#         vertexai.init(project=project_id, location=location)
#     else:
#         # Allow Vertex to use ADC if project not explicitly set
#         vertexai.init(location=location)

#     # Build prompt
#     if language == "zh":
#         prompt = f"""你是一个专业的护肤顾问。根据以下天气条件，提供简洁的护肤建议（1-2句话）：

# 天气条件：
# - 温度：{temperature}°C
# - 湿度：{humidity}%
# - 紫外线指数：{uv_index}
# - 天气状况：{weather_condition}
# {f'- 位置：{location}' if location else ''}

# 请给出实用的护肤建议，包括：
# 1. 需要注意的皮肤问题
# 2. 推荐使用的护肤品类型（如保湿霜、防晒霜等）

# 要求：
# - 语言简洁专业
# - 1-2句话
# - 使用emoji使建议更生动
# """
#     else:
#         prompt = f"""You are a professional skincare advisor.
# Based on the following weather conditions, provide concise skincare advice (1-2 sentences)::

# Weather Conditions:
# - Temperature: {temperature}°C
# - Humidity: {humidity}%
# - UV Index: {uv_index}
# - Weather: {weather_condition}
# {f'- Location: {location}' if location else ''}

# Provide practical skincare advice including:
# 1. Skin concerns to watch for
# 2. Recommended product types (e.g., moisturizer, sunscreen)

# Requirements:
# - Professional and concise language
# - 1-2 sentences
# - Use emojis to make it engaging
# """

#     # Model selection with optional fallback
#     preferred = os.environ.get("MODEL_NAME", "gemini-2.5-flash")
#     fallbacks = ["text-bison@001"]
#     tried = []

#     last_exc = None

#     def _first_sentence(text: str) -> str:
#         import re

#         if not text:
#             return ""
#         # Normalize and pick the first non-empty line
#         first_line = next((ln.strip() for ln in text.splitlines() if ln.strip()), text.strip())
#         # Split by common sentence enders (Chinese and English punctuation)
#         parts = re.split(r"(?<=[。！？.!?])\s*", first_line)
#         if parts:
#             return parts[0].strip()
#         return first_line.strip()

#     for model_name in [preferred] + fallbacks:
#         try:
#             tried.append(model_name)
#             model = GenerativeModel(model_name)
#             response = model.generate_content(prompt)
#             return _first_sentence(response.text.strip())
#         except Exception as e:
#             last_exc = e
#             # try next fallback
#             continue

#     # If we reach here, all attempts failed
#     raise RuntimeError(f"All model attempts failed ({tried}): {last_exc}") from last_exc


# another way to analyze skin(more structured output)

# def analyze_skin(user_text=None, user_image=None):
#     if not CORPUS:
#         raise ValueError("RAG_CORPUS environment variable not set")

#     # 1) 条件识别（可复用你现有的做法）
#     if user_image:
#         cond_resp = client.models.generate_content(
#             model=GEMINI_MODEL,
#             contents=[types.Part.from_image(user_image)]
#         )
#         condition = (cond_resp.text or "").strip() or "general skincare"
#     else:
#         condition = user_text or "general skincare"
#     print(f"Detected condition: {condition}")

#     # 2) RAG 检索
#     rag_results = rag.retrieval_query(
#         rag_resources=[rag.RagResource(rag_corpus=CORPUS)],
#         text=f"What are the most effective ingredients for treating {condition}?",
#         similarity_top_k=10,
#     )
#     rag_context = "\n\n".join([ctx.text for ctx in rag_results.contexts.contexts])

#     # 3) 结构化输出（一次性产出四个字段）
#     cfg = types.GenerateContentConfig(
#         response_mime_type="application/json",
#         response_schema=types.Schema(
#             type=types.Type.OBJECT,
#             properties={
#                 "condition": types.Schema(type=types.Type.STRING),
#                 "primary_ingredients": types.Schema(
#                     type=types.Type.ARRAY,
#                     items=types.Schema(type=types.Type.STRING),
#                 ),
#                 "secondary_ingredients": types.Schema(
#                     type=types.Type.ARRAY,
#                     items=types.Schema(type=types.Type.STRING),
#                 ),
#                 "avoid_ingredients": types.Schema(
#                     type=types.Type.ARRAY,
#                     items=types.Schema(type=types.Type.STRING),
#                 ),
#                 "full_analysis": types.Schema(type=types.Type.STRING),
#             },
#             required=[
#                 "condition",
#                 "primary_ingredients",
#                 "secondary_ingredients",
#                 "avoid_ingredients",
#             ],
#         ),
#         temperature=0.2,
#     )

#     prompt = f"""
# You are a cosmetic formulator. Use ONLY the knowledge below.

# KNOWLEDGE:
# {rag_context}

# TASK:
# For condition: {condition}
# Return JSON with fields:
# - condition
# - primary_ingredients  (lowercase; one ingredient per array item)
# - secondary_ingredients (lowercase)
# - avoid_ingredients (lowercase; "none" => empty array)
# - full_analysis (a short rationale based only on knowledge)

# No hallucinations. Be specific when knowledge contains concentrations.
# """

#     resp = client.models.generate_content(
#         model=GEMINI_MODEL,
#         contents=prompt,
#         config=cfg,
#     )
#     data = resp.parsed or {}
#     # 兜底与清洗（确保统一小写、去重）
#     def _norm_list(xs):
#         seen, out = set(), []
#         for x in (xs or []):
#             y = (x or "").strip().lower()
#             if y and y not in seen and y != "none":
#                 seen.add(y)
#                 out.append(y)
#         return out

#     return {
#         "condition": (data.get("condition") or condition).strip(),
#         "primary_ingredients": _norm_list(data.get("primary_ingredients")),
#         "secondary_ingredients": _norm_list(data.get("secondary_ingredients")),
#         "avoid_ingredients": _norm_list(data.get("avoid_ingredients")),
#         "full_analysis": data.get("full_analysis") or "",
#     }
