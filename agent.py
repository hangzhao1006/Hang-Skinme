# =============================================================================
# SkinMe AI — API Service 完整代码合并文件
# 目录结构：src/api-service/
# 包含：api-service/main.py, api-service/runner.py,
#       agent/routing_agent.py, agent/analysis_agent.py,
#       agent/recommendation_agent.py, agent/image_analysis_agent.py,
#       agent/bigquery_service.py, agent/daily_routine_manager.py,
#       agent/ingredient_analyzer.py, agent/ingredient_risk_classifier.py,
#       agent/auth/auth_manager.py,
#       agent/personalization/cache.py,
#       agent/personalization/weather_context_manager.py,
#       agent/personalization/weather_utils.py,
#       agent/personalization/user_profile_manager.py,
#       agent/personalization/chat_logger.py,
#       agent/personalization/image_upload_handler.py,
#       agent/personalization/calendar_manager.py,
#       agent/personalization/user_context_retriever.py,
#       agent/personalization/profile_extractor.py
# =============================================================================


# =============================================================================
# FILE: src/api-service/api-service/main.py
# 作用：FastAPI 入口，定义所有 HTTP 路由
# =============================================================================

"""
FastAPI Application for Skincare RAG Pipeline
"""

import json
import os
import logging
import uvicorn
from typing import Optional, List, Dict
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from runner import runner
from fastapi import FastAPI, Form, File, UploadFile, Request, Response
from fastapi.responses import StreamingResponse
import base64
import sys
from agent.auth import auth_manager
from agent.personalization.weather_utils import generate_weather_advice
from agent.bigquery_service import bigquery_service
from agent.daily_routine_manager import daily_routine_manager
from agent.ingredient_analyzer import ingredient_analyzer
from agent.ingredient_risk_classifier import ingredient_risk_classifier

logger = logging.getLogger(__name__)

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

ROOT_PATH = os.environ.get("ROOT_PATH", "")

app = FastAPI(title="Skincare RAG API", version="1.0.0", root_path=ROOT_PATH)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatResponse(BaseModel):
    response: str
    session_id: str

class HealthResponse(BaseModel):
    status: str

class SessionHistoryResponse(BaseModel):
    session_id: str
    history: List[Dict]

class ImageAnalysisRequest(BaseModel):
    user: str
    max_images: Optional[int] = None

class WeatherSkincareRequest(BaseModel):
    temperature: float
    humidity: int
    uv_index: int
    weather_condition: str
    location: Optional[str] = None
    language: Optional[str] = "en"

class WeatherSkincareResponse(BaseModel):
    advice: str
    temperature: float
    humidity: int
    uv_index: int

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    user: Optional[Dict] = None
    token: Optional[str] = None
    error: Optional[str] = None


@app.get("/")
async def get_index():
    return {"message": "Welcome to AC215-Skincare RAG API Service"}

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")

@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    result = auth_manager.register_user(email=request.email, password=request.password, name=request.name)
    return AuthResponse(**result)

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    result = auth_manager.login_user(email=request.email, password=request.password)
    return AuthResponse(**result)

@app.get("/auth/check-email/{email}")
async def check_email(email: str):
    exists = auth_manager.email_exists(email)
    return {"exists": exists, "message": "Email is already registered" if exists else "Email is available"}

@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    weather: Optional[str] = Form(None),
):
    """Non-streaming endpoint"""
    user_image = None
    if image:
        image_bytes = await image.read()
        user_image = base64.b64encode(image_bytes).decode("utf-8")
    weather_data = None
    if weather:
        weather_data = json.loads(weather)
    result = await runner.run(message, session_id, user_image, email, weather_data)
    return ChatResponse(response=result["response"], session_id=result["session_id"])

@app.post("/chat/stream")
async def chat_stream(
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    weather: Optional[str] = Form(None),
):
    """SSE streaming endpoint — streams tokens in real-time"""
    user_image = None
    if image:
        image_bytes = await image.read()
        user_image = base64.b64encode(image_bytes).decode("utf-8")
    weather_data = None
    if weather:
        weather_data = json.loads(weather)
    return StreamingResponse(
        runner.run_stream(message, session_id, user_image, email, weather_data),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/analyze-images")
async def analyze_images(request: ImageAnalysisRequest):
    result = await runner.analyze_images(user=request.user, max_images=request.max_images)
    return result

class CalendarSaveRequest(BaseModel):
    email: Optional[str] = None
    session_id: Optional[str] = None
    events: List[Dict]

@app.post("/calendar/save")
async def save_calendar_events(request: CalendarSaveRequest):
    from agent.personalization.calendar_manager import calendar_manager
    identifier = request.email if request.email else request.session_id
    if not identifier:
        return {"success": False, "message": "Either email or session_id must be provided"}
    success = calendar_manager.save_events(identifier=identifier, events=request.events)
    return {"success": success, "message": "Events saved successfully" if success else "Failed to save events"}

@app.get("/calendar/load/{identifier}")
async def load_calendar_events(identifier: str):
    from agent.personalization.calendar_manager import calendar_manager
    events = calendar_manager.load_events(identifier=identifier)
    return {"events": events}

@app.get("/skin-photos/{identifier}")
async def get_skin_photos(identifier: str, request: Request):
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email
    photos = []
    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier
    prefix = f"user_image/{identifier_clean}/"
    notes_data = {}
    try:
        notes_blob = image_upload_handler.bucket.blob(f"{prefix}notes.json")
        if notes_blob.exists():
            notes_data = json.loads(notes_blob.download_as_text())
    except Exception as e:
        print(f"Error loading notes for {identifier}: {e}")
    try:
        blobs = [b for b in image_upload_handler.bucket.list_blobs(prefix=prefix)
                 if not b.name.endswith("/") and not b.name.endswith("notes.json")]
        blobs.sort(key=lambda b: b.time_created)
        base_url = str(request.base_url).rstrip("/")
        for blob in blobs:
            filename = blob.name.split("/")[-1]
            proxy_url = f"{base_url}/skin-photos/{identifier}/image/{filename}"
            parts = filename.replace(".jpg", "").replace(".png", "").split("_")
            date_str = next((p for p in parts if len(p) == 8 and p.isdigit()), None)
            formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}" if date_str else blob.time_created.strftime("%Y-%m-%d")
            photos.append({"date": formatted_date, "imageUrl": proxy_url, "note": notes_data.get(formatted_date, "")})
    except Exception as e:
        print(f"Error fetching photos for {identifier}: {e}")
    return {"photos": photos}

@app.get("/skin-photos/{identifier}/image/{filename}")
async def get_photo_image(identifier: str, filename: str):
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email
    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier
    blob_path = f"user_image/{identifier_clean}/{filename}"
    try:
        blob = image_upload_handler.bucket.blob(blob_path)
        if not blob.exists():
            return Response(content="Image not found", status_code=404)
        image_data = blob.download_as_bytes()
        media_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
        return Response(content=image_data, media_type=media_type)
    except Exception as e:
        return Response(content="Error loading image", status_code=500)

@app.post("/skin-photos/{identifier}/note")
async def update_photo_note(identifier: str, date: str = Form(...), note: str = Form(...)):
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email
    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier
    notes_path = f"user_image/{identifier_clean}/notes.json"
    try:
        blob = image_upload_handler.bucket.blob(notes_path)
        notes_data = json.loads(blob.download_as_text()) if blob.exists() else {}
        notes_data[date] = note
        blob.upload_from_string(json.dumps(notes_data), content_type="application/json")
        return {"success": True, "message": "Note saved"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/chat-history/{email}")
async def get_chat_history(email: str, days: int = 7, limit: int = 100):
    from agent.personalization.chat_logger import chat_logger
    conversations = chat_logger.get_recent_conversations(email=email, days=days, limit=limit)
    return {"conversations": conversations}

@app.get("/session/{session_id}/history", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str):
    history = await runner.get_session_history(session_id)
    return SessionHistoryResponse(session_id=session_id, history=history)

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    runner.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}

@app.get("/weather/fetch")
async def fetch_weather(lat: Optional[float] = None, lon: Optional[float] = None):
    import httpx
    url = (f"https://wttr.in/{lat},{lon}?format=j1" if lat is not None and lon is not None
           else "https://wttr.in/?format=j1")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

@app.post("/weather/skincare-advice", response_model=WeatherSkincareResponse)
async def weather_skincare_advice(request: WeatherSkincareRequest):
    advice_text = generate_weather_advice(
        temperature=request.temperature, humidity=request.humidity,
        uv_index=request.uv_index, weather_condition=request.weather_condition,
        language=request.language,
    )
    return WeatherSkincareResponse(advice=advice_text, temperature=request.temperature,
                                    humidity=request.humidity, uv_index=request.uv_index)

class ProductSearchResponse(BaseModel):
    products: List[Dict]
    count: int

@app.get("/api/products/search")
async def search_products(q: Optional[str] = None, limit: int = 10):
    if not q or not q.strip():
        return {"products": [], "count": 0, "message": "Search query is required"}
    try:
        results = bigquery_service.search_products(query=q.strip(), limit=limit)
        return {"products": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Product search error: {e}")
        return Response(content=json.dumps({"error": "Failed to search products"}), status_code=500)

@app.get("/api/products/{product_id}/ingredients")
async def get_product_ingredients_by_id(product_id: str):
    try:
        result = bigquery_service.get_product_ingredients_by_id(product_id)
        if not result:
            return Response(content=json.dumps({"error": "Product not found"}), status_code=404)
        return result
    except Exception as e:
        return Response(content=json.dumps({"error": "Failed to fetch product ingredients"}), status_code=500, media_type="application/json")

@app.get("/api/products/ingredients")
async def get_product_ingredients_by_url(url: Optional[str] = None):
    if not url or not url.strip():
        return Response(content=json.dumps({"error": "URL parameter is required"}), status_code=400, media_type="application/json")
    try:
        result = bigquery_service.get_product_ingredients_by_url(url.strip())
        if not result:
            return Response(content=json.dumps({"error": "Product not found"}), status_code=404, media_type="application/json")
        return result
    except Exception as e:
        return Response(content=json.dumps({"error": "Failed to fetch product ingredients"}), status_code=500, media_type="application/json")

class RoutineProduct(BaseModel):
    product_id: str
    product_name: str
    brand: str
    amount: str
    time: str
    order: int

class SaveRoutineRequest(BaseModel):
    user_identifier: str
    date: str
    products: List[RoutineProduct]

class RoutineResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict] = None

@app.post("/api/routines/save", response_model=RoutineResponse)
async def save_daily_routine(request: SaveRoutineRequest):
    try:
        products_data = [p.model_dump() for p in request.products]
        success = daily_routine_manager.save_routine(
            user_identifier=request.user_identifier, date=request.date, products=products_data)
        return RoutineResponse(success=success, message="Routine saved successfully" if success else "Failed to save routine")
    except Exception as e:
        return RoutineResponse(success=False, message=f"Error: {str(e)}")

@app.get("/api/routines/{user_identifier}/range")
async def get_routines_range(user_identifier: str, start_date: str, end_date: str):
    try:
        routines = daily_routine_manager.get_routines_range(
            user_identifier=user_identifier, start_date=start_date, end_date=end_date)
        return {"routines": routines, "count": len(routines)}
    except Exception as e:
        return Response(content=json.dumps({"error": str(e)}), status_code=500, media_type="application/json")

@app.get("/api/routines/{user_identifier}/{date}")
async def get_daily_routine(user_identifier: str, date: str):
    try:
        routine = daily_routine_manager.get_routine(user_identifier, date)
        if routine:
            return routine
        return Response(content=json.dumps({"error": "Routine not found"}), status_code=404, media_type="application/json")
    except Exception as e:
        return Response(content=json.dumps({"error": str(e)}), status_code=500, media_type="application/json")

@app.delete("/api/routines/{user_identifier}/{date}")
async def delete_daily_routine(user_identifier: str, date: str):
    try:
        success = daily_routine_manager.delete_routine(user_identifier, date)
        if success:
            return {"success": True, "message": "Routine deleted successfully"}
        return Response(content=json.dumps({"error": "Routine not found"}), status_code=404, media_type="application/json")
    except Exception as e:
        return Response(content=json.dumps({"error": str(e)}), status_code=500, media_type="application/json")

@app.get("/api/routines/{user_identifier}/{date}/ingredients")
async def get_routine_ingredients_summary(user_identifier: str, date: str):
    try:
        routine = daily_routine_manager.get_routine(user_identifier, date)
        if not routine:
            return Response(content=json.dumps({"error": "Routine not found"}), status_code=404, media_type="application/json")
        products = routine.get("products", [])
        product_ingredients_map = {}
        for product in products:
            product_id = product.get("product_id")
            if product_id:
                product_data = bigquery_service.get_product_ingredients_by_id(product_id)
                if product_data:
                    product_ingredients_map[product_id] = product_data.get("ingredients", [])
        summary = daily_routine_manager.get_ingredient_summary(
            user_identifier=user_identifier, date=date, product_ingredients_map=product_ingredients_map)
        if "ingredients" in summary:
            summary["ingredients"] = ingredient_risk_classifier.sort_by_risk(summary["ingredients"])
        return summary
    except Exception as e:
        return Response(content=json.dumps({"error": str(e)}), status_code=500, media_type="application/json")

@app.get("/api/ingredient-insights/{user_identifier}")
async def get_ingredient_insights(user_identifier: str, days: int = 7, language: str = "en"):
    try:
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)
        routines = daily_routine_manager.get_routines_range(
            user_identifier=user_identifier,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"))
        if not routines:
            return Response(content=json.dumps({"error": "No routine data found"}), status_code=404, media_type="application/json")
        trends_data = []
        for routine in routines:
            product_ingredients_map = {}
            for product in routine.get("products", []):
                product_id = product.get("product_id")
                if product_id:
                    try:
                        ingredients = bigquery_service.get_product_ingredients_by_id(product_id)
                        if ingredients:
                            product_ingredients_map[product_id] = ingredients.get("ingredients", [])
                    except Exception:
                        pass
            summary = daily_routine_manager.get_ingredient_summary(
                user_identifier=user_identifier, date=routine["date"],
                product_ingredients_map=product_ingredients_map)
            trends_data.append(summary)
        statistics = ingredient_analyzer.calculate_ingredient_statistics(trends_data)
        insights = ingredient_analyzer.generate_insights(statistics, language)
        return insights
    except Exception as e:
        return Response(content=json.dumps({"error": str(e)}), status_code=500, media_type="application/json")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)


# =============================================================================
# FILE: src/api-service/api-service/runner.py
# 作用：AgentRunner — 管理 Gemini chat session，协调 agent 调用与 SSE 流式输出
# =============================================================================

import os
import uuid
import json
import asyncio
from typing import Optional
from google import genai
from google.genai import types

from agent.routing_agent import route_and_process
from agent.image_analysis_agent import analyze_user_image_history
from agent.personalization.user_context_retriever import user_context_retriever
from agent.personalization.chat_logger import chat_logger
from agent.routing_agent import classify_intent_fast
from agent.personalization.image_upload_handler import image_upload_handler
from agent.personalization.profile_extractor import profile_extractor

PROJECT_ID = os.getenv("GCP_PROJECT", "hang-herm")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


class AgentRunner:
    """Runner for handling agent execution with session management."""

    def __init__(self):
        self.chat_sessions = {}

    def _format_agent_data_for_chat(self, agent_result: dict, user_message: str) -> str:
        """Format raw agent data into a prompt for the chat model to present conversationally."""
        agent_type = agent_result.get("agent_type")

        if agent_type == "analysis":
            condition = agent_result.get("condition", "your skin concern")
            primary = agent_result.get("primary_ingredients", [])
            secondary = agent_result.get("secondary_ingredients", [])
            avoid = agent_result.get("avoid_ingredients", [])
            weather = agent_result.get("weather_context", "")
            prompt = f"""The user asked: "{user_message}"

I've analyzed their skin concern and found ingredient recommendations:

CONDITION: {condition}
PRIMARY INGREDIENTS: {', '.join(primary) if primary else 'None found'}
SECONDARY INGREDIENTS: {', '.join(secondary) if secondary else 'None found'}
AVOID INGREDIENTS: {', '.join(avoid) if avoid else 'None found'}
{f'WEATHER CONTEXT: {weather}' if weather else ''}

Please respond conversationally using Markdown formatting:
1. Acknowledge their concern warmly
2. Explain what these ingredients do and why they help
3. Use Markdown to format the ingredient lists nicely
4. If weather context exists, incorporate it naturally
5. End with: "Let me know if you'd like me to recommend specific products with these ingredients."
"""

        elif agent_type == "recommendation":
            condition = agent_result.get("condition", "your skin concern")
            primary = agent_result.get("primary_ingredients", [])
            products = agent_result.get("products", [])
            stats = agent_result.get("search_stats", {})
            is_fallback = stats.get("total_scored", 0) == 0 and len(products) > 0
            products_info = []
            for p in products[:3]:
                products_info.append({
                    "title": p.get("title"), "brand": p.get("brand"),
                    "category": p.get("category"),
                    "buy_links": p.get("buy_links", []),
                })
            product_lines = "\n".join([
                f"- {p['title']} by {p['brand']} | Links: {', '.join(p['buy_links'][:1])}"
                for p in products_info])
            prompt = f"""The user asked: "{user_message}"

CONDITION: {condition}
KEY INGREDIENTS NEEDED: {', '.join(primary) if primary else 'None'}
PRODUCTS FOUND: {len(products)} products (searched {stats.get('total_scored', 0)} total)

TOP PRODUCTS:
{product_lines}

Please create a conversational Markdown response with numbered product list, buy links, and routine suggestion.
"""

        elif agent_type == "image_history":
            message = agent_result.get("message", "")
            prompt = f"""The user asked: "{user_message}"

Image history analysis results:
{message}

Please present this information conversationally with Markdown formatting.
"""
        else:
            prompt = f'The user asked: "{user_message}"\n\nAgent data: {str(agent_result)}\n\nPlease respond conversationally.'

        return prompt

    def _get_chat(self, session_id: str):
        """Get or create chat session."""
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = client.chats.create(
                model=GEMINI_MODEL,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are a helpful skincare expert assistant.\n\n"
                        "LANGUAGE RULE (highest priority):\n"
                        "- ALWAYS reply in the SAME language the user wrote in.\n"
                        "- If the user writes in Chinese (中文), reply entirely in Chinese.\n"
                        "- If the user writes in English, reply in English.\n"
                        "- Never switch languages mid-conversation unless the user does first.\n\n"
                        "CRITICAL CONTEXT USAGE:\n"
                        "- ONLY use information explicitly provided in '=== SYSTEM CONTEXT ===' sections.\n"
                        "- NEVER make up or assume previous conversations, user preferences, or concerns "
                        "that aren't in the context.\n\n"
                        "SAFETY RULES:\n"
                        "- Retinoids/AHAs/BHAs increase sun sensitivity - always recommend SPF 30+.\n"
                        "- Respect all allergies and sensitivities in context.\n\n"
                        "FORMATTING WITH MARKDOWN:\n"
                        "- Use **bold** for headings, bullet lists for ingredients, numbered lists for products.\n\n"
                        "IMAGE RULES:\n"
                        "- NEVER say you received or analyzed an image unless the prompt explicitly contains "
                        "'IMAGE ANALYSIS RESULT' data.\n"
                        "- If no image data is present, treat the conversation as text-only."
                    ),
                    temperature=0.3,
                ),
            )
        return self.chat_sessions[session_id]

    async def run(self, user_message: str, session_id: str = None, user_image: str = None,
                  email: Optional[str] = None, weather_data: Optional[dict] = None) -> dict:
        """Run agent and return complete response."""
        if not session_id:
            session_id = str(uuid.uuid4())
        try:
            if user_image and email:
                try:
                    image_upload_handler.upload_image(email, user_image, "jpg")
                except Exception as e:
                    print(f"⚠️ Failed to upload image to GCS: {e}")

            user_context = ""
            if email or session_id:
                user_context = user_context_retriever.get_smart_context(
                    email=email, user_message=user_message, has_image=bool(user_image),
                    weather_data=weather_data, session_id=session_id if not email else None)

            chat = self._get_chat(session_id)
            contextualized_message = user_message
            if user_context:
                contextualized_message = user_context + "\n\nUser query: " + user_message

            intent = classify_intent_fast(user_message, has_image=bool(user_image))
            needs_agents = intent != "none"

            if needs_agents:
                result = route_and_process(contextualized_message, user_image, intent)
                agent_type = result.get("agent_type")
                if agent_type is None:
                    response = chat.send_message(contextualized_message)
                else:
                    response = chat.send_message(self._format_agent_data_for_chat(result, user_message))
                response_text = response.text
                if email:
                    chat_logger.log_conversation_turn(email=email, user_message=user_message,
                        assistant_response=response_text, image_uploaded=bool(user_image),
                        analysis_result=result if user_image else None)
                    profile_extractor.extract_from_conversation(email=email, user_message=user_message,
                        assistant_response=response_text, analysis_result=result if user_image else None)
                return {"response": response_text, "session_id": session_id, "result": result}

            response = chat.send_message(contextualized_message)
            response_text = response.text
            if email:
                chat_logger.log_conversation_turn(email=email, user_message=user_message, assistant_response=response_text)
                profile_extractor.extract_from_conversation(email=email, user_message=user_message,
                    assistant_response=response_text, analysis_result=None)
            return {"response": response_text, "session_id": session_id}

        except Exception as e:
            return {"response": f"Error processing request: {str(e)}", "session_id": session_id, "error": str(e)}

    async def run_stream(self, user_message: str, session_id: str = None, user_image: str = None,
                         email: Optional[str] = None, weather_data: Optional[dict] = None):
        """SSE async generator — streams tokens like DeepSeek/ChatGPT."""
        if not session_id:
            session_id = str(uuid.uuid4())
        try:
            if user_image and email:
                try:
                    image_upload_handler.upload_image(email, user_image, "jpg")
                except Exception as e:
                    print(f"⚠️ Image upload failed: {e}")

            user_context = ""
            if email or session_id:
                user_context = user_context_retriever.get_smart_context(
                    email=email, user_message=user_message, has_image=bool(user_image),
                    weather_data=weather_data, session_id=session_id if not email else None)

            chat = self._get_chat(session_id)
            contextualized_message = user_message
            if user_context:
                contextualized_message = user_context + "\n\nUser query: " + user_message

            intent = classify_intent_fast(user_message, has_image=bool(user_image))
            needs_agents = intent != "none"
            result = None
            send_message_text = contextualized_message

            if needs_agents:
                if bool(user_image):
                    yield f"data: {json.dumps({'status': '🔍 Analyzing your skin image...'})}\n\n"
                elif intent == "recommendation":
                    yield f"data: {json.dumps({'status': '💡 Finding recommendations...'})}\n\n"
                else:
                    yield f"data: {json.dumps({'status': '🧬 Analyzing your concern...'})}\n\n"

                result = await asyncio.to_thread(route_and_process, contextualized_message, user_image, intent)

                if bool(user_image):
                    yield f"data: {json.dumps({'status': '✨ Personalizing results...'})}\n\n"

                agent_type = result.get("agent_type")
                if agent_type:
                    send_message_text = self._format_agent_data_for_chat(result, user_message)

            # Bridge sync Gemini stream → async generator via Queue
            full_text = ""
            queue: asyncio.Queue = asyncio.Queue()
            loop = asyncio.get_running_loop()

            def _stream_worker():
                try:
                    for chunk in chat.send_message_stream(send_message_text):
                        token = chunk.text or ""
                        if token:
                            asyncio.run_coroutine_threadsafe(queue.put(token), loop).result()
                finally:
                    asyncio.run_coroutine_threadsafe(queue.put(None), loop).result()

            worker = loop.run_in_executor(None, _stream_worker)

            while True:
                token = await queue.get()
                if token is None:
                    break
                full_text += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            await worker
            products = result.get("products", []) if result else []
            yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'products': products})}\n\n"

            if email:
                chat_logger.log_conversation_turn(email=email, user_message=user_message,
                    assistant_response=full_text, image_uploaded=bool(user_image),
                    analysis_result=result if user_image else None)
                profile_extractor.extract_from_conversation(email=email, user_message=user_message,
                    assistant_response=full_text, analysis_result=result if user_image else None)

        except Exception as e:
            print(f"❌ Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    async def get_session_history(self, session_id: str) -> list:
        if session_id not in self.chat_sessions:
            return []
        chat = self.chat_sessions[session_id]
        history = chat.get_history()
        return [{"role": msg.role, "text": msg.parts[0].text if msg.parts else ""} for msg in history]

    def clear_session(self, session_id: str):
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]

    async def analyze_images(self, user: str, max_images: int | None = None) -> dict:
        return analyze_user_image_history(user=user, limit=max_images)


runner = AgentRunner()


# =============================================================================
# FILE: src/api-service/agent/routing_agent.py
# 作用：关键词路由 — classify_intent_fast() 决定调哪个 agent，无需 LLM
# 路由结果：'analysis_only' | 'recommendation' | 'both' | 'image_history' | 'none'
# =============================================================================

import re
from typing import Optional

from agent.analysis_agent import analyze_skin
from agent.recommendation_agent import recommend_products
from agent.image_analysis_agent import analyze_user_image_history


def _extract_user_for_history(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"history\s+([\w-]+)", text, re.IGNORECASE)
    return match.group(1) if match else None


def classify_intent_fast(user_input: str, has_image: bool = False) -> str:
    if not user_input:
        return "both" if has_image else "none"

    message_lower = user_input.lower()

    if "history" in message_lower and any(w in message_lower for w in ["image", "photo", "picture", "progress"]):
        return "image_history"

    product_keywords = [
        "recommend product", "recommendation", "product for", "product link", "product links",
        "product", "products", "routine for", "routine", "what should i use", "what product",
        "which product", "show me product", "suggest product", "best product", "buy", "purchase",
        "shopping", "what to use", "help me find", "looking for product", "need product",
        "link", "links", "url", "where to buy", "where can i buy", "show me", "suggest", "give me",
        # Chinese
        "推荐", "产品", "护肤品", "购买", "买", "哪里买", "链接",
        "日常护理", "护肤", "精华", "面霜", "防晒", "洁面", "爽肤水",
        "什么产品", "用什么", "哪款", "好用", "效果好",
    ]

    if any(keyword in message_lower for keyword in product_keywords):
        return "recommendation"

    concern_keywords = [
        "dry skin", "oily skin", "acne", "wrinkle", "aging", "dark spot",
        "redness", "irritation", "sensitive", "concern", "problem",
        "breakout", "blemish", "fine line", "texture", "pore",
        "hyperpigmentation", "uneven", "dull",
        # Chinese
        "干皮", "油皮", "干燥", "出油", "痘痘", "粉刺", "闭口", "黑头",
        "皱纹", "抗老", "色斑", "暗沉", "敏感", "泛红", "毛孔", "肤质",
        "过敏", "刺激", "暗黄", "不均匀", "细纹",
    ]

    has_concern = any(keyword in message_lower for keyword in concern_keywords)
    affirmative_keywords = ["yes", "sure", "please", "ok", "okay", "yeah", "yep"]
    is_short_affirmative = (len(user_input.split()) <= 3 and
        any(keyword == message_lower or message_lower.startswith(keyword) for keyword in affirmative_keywords))

    if has_image:
        return "both" if has_concern else "analysis_only"
    if has_concern:
        return "analysis_only"
    if is_short_affirmative:
        return "none"
    return "none"


def route_and_process(user_input: str, user_image=None, intent: str = None) -> dict:
    """Route to appropriate agents. Returns raw structured data for chat model to format."""
    if intent is None:
        intent = classify_intent_fast(user_input, has_image=bool(user_image))
    print(f"⚡ Fast routing decision: {intent}")

    if intent == "image_history":
        user = _extract_user_for_history(user_input)
        if not user:
            return {"agent_type": None, "error": "Missing user identifier for history lookup"}
        result = analyze_user_image_history(user=user)
        result["agent_type"] = "image_history"
        return result

    if intent == "none":
        return {"agent_type": None}

    if intent == "analysis_only":
        analysis = analyze_skin(user_text=user_input, user_image=user_image)
        analysis["agent_type"] = "analysis"
        return analysis

    if intent in ("recommendation", "both"):
        analysis = analyze_skin(user_text=user_input, user_image=user_image)
        recommendations = recommend_products(analysis)
        recommendations["agent_type"] = "recommendation"
        recommendations["analysis"] = analysis
        return recommendations

    return {"agent_type": None}


# =============================================================================
# FILE: src/api-service/agent/analysis_agent.py
# 作用：皮肤分析 Agent — 调用 Gemini Vision 分析图像/文字，
#       通过 Vertex AI RAG 检索成分知识库，返回结构化成分推荐
# =============================================================================

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
    """
    Detect skin condition and get ingredient recommendations from RAG.
    1. If image provided: send to Gemini Vision → get condition description
    2. Query RAG corpus: "What ingredients treat {condition}?"
    3. Parse response into PRIMARY / SECONDARY / AVOID lists
    """
    if not CORPUS:
        raise ValueError("RAG_CORPUS environment variable not set")

    full_user_input = user_text

    if user_image:
        try:
            import base64
            if isinstance(user_image, str) and user_image.startswith("data:image"):
                image_data = user_image.split(",")[1]
            else:
                image_data = user_image if isinstance(user_image, str) else base64.b64encode(user_image).decode("utf-8")

            parts = [
                types.Part(text=user_text or """Analyze this skin image as a dermatologist. Provide:
1. Overall skin assessment
2. Specific concerns (texture, inflammation, discoloration)
3. Likely skin condition(s)
Be professional and empathetic. Keep it concise - 3-4 sentences."""),
                types.Part(inline_data={"mime_type": "image/jpeg", "data": image_data}),
            ]
            response = client.models.generate_content(model=GEMINI_MODEL, contents=parts)
            condition = response.text.strip()
        except Exception as e:
            print(f"Image processing error: {e}")
            condition = user_text or "general skincare"
    else:
        if user_text and "User query:" in user_text:
            full_user_input = user_text
            condition = user_text.split("User query:")[-1].strip()
        else:
            full_user_input = user_text
            condition = user_text or "general skincare"

    print(f"Detected condition: {condition}")

    weather_context_extracted = None
    if full_user_input and "Current Weather:" in full_user_input:
        weather_start = full_user_input.find("Current Weather:")
        weather_end = (full_user_input.find("User query:", weather_start)
                       if "User query:" in full_user_input else len(full_user_input))
        weather_context_extracted = full_user_input[weather_start:weather_end].strip()
    elif weather_context:
        weather_context_extracted = weather_context

    # Query RAG corpus for ingredient knowledge
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
niacinamide

SECONDARY:
vitamin c
hyaluronic acid

AVOID:
alcohol
fragrance

CRITICAL: One ingredient per line, lowercase only, no bullets. If none to avoid, write "none"."""

    analysis_response = client.models.generate_content(model=GEMINI_MODEL, contents=analysis_prompt)
    return parse_response(analysis_response.text, condition, weather_context_extracted)


def parse_response(text, condition, weather_context_extracted=None):
    """Parse PRIMARY/SECONDARY/AVOID sections from Gemini response."""
    primary, secondary, avoid = [], [], []
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

    return {
        "condition": condition,
        "primary_ingredients": primary,
        "secondary_ingredients": secondary,
        "avoid_ingredients": avoid,
        "weather_context": weather_context_extracted,
        "full_analysis": text,
    }


# =============================================================================
# FILE: src/api-service/agent/recommendation_agent.py
# 作用：产品推荐 Agent — 根据分析结果从 GCS JSONL / PostgreSQL 中匹配产品
#       支持 DATA_SOURCE=jsonl（默认）或 DATA_SOURCE=sql
# =============================================================================

import os
import json
from google.cloud import storage
from google import genai
import vertexai

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
GEMINI_MODEL = "gemini-2.5-flash"
DATA_SOURCE = os.getenv("DATA_SOURCE", "jsonl")

if DATA_SOURCE == "sql":
    import psycopg2
    from psycopg2.extras import RealDictCursor

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")

vertexai.init(project=PROJECT_ID, location=LOCATION)
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


def load_products_from_jsonl():
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob("EWG_face_product/ewg_product_structured.jsonl")
    return [json.loads(line) for line in blob.download_as_text().splitlines()]


def load_products_from_sql():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME,
                            user=DB_USER, password=DB_PASSWORD, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ewg_product")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


def load_products():
    if DATA_SOURCE.lower() == "sql":
        return load_products_from_sql()
    return load_products_from_jsonl()


def recommend_products(analysis):
    """
    Score products by ingredient match:
    - Primary ingredient match: +10 points
    - Secondary ingredient match: +5 points
    - Skip products containing avoid_ingredients
    - Fallback: return generic cleanser/moisturizer/sunscreen if no matches
    """
    condition = analysis["condition"]
    primary_ingredients = analysis["primary_ingredients"]
    secondary_ingredients = analysis["secondary_ingredients"]
    avoid_ingredients = analysis["avoid_ingredients"]

    ingredient_variations = {
        "ubiquinone": ["ubiquinone", "coenzyme q10", "coq10"],
        "retinol": ["retinol", "retinyl palmitate", "retinyl acetate", "retinoid"],
        "niacinamide": ["niacinamide", "vitamin b3"],
        "vitamin c": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "hyaluronic acid": ["hyaluronic acid", "sodium hyaluronate"],
        "salicylic acid": ["salicylic acid"],
        "glycolic acid": ["glycolic acid"],
    }

    def get_variations(ingredient):
        ing_lower = ingredient.lower()
        return ingredient_variations.get(ing_lower, [ing_lower])

    primary_expanded = [v for ing in primary_ingredients for v in get_variations(ing)]
    secondary_expanded = [v for ing in secondary_ingredients for v in get_variations(ing)]

    data = load_products()
    scored_products = []
    fallback_products = []

    for p in data:
        label_sections = p.get("label_sections", {})
        if isinstance(label_sections, str):
            label_sections = json.loads(label_sections)
        product_ingredients = label_sections.get("ingredients", {}).get("text", "").lower()
        category = p.get("category", "").lower()
        title = p.get("title", "").lower()

        if any(avoid.lower() in product_ingredients for avoid in avoid_ingredients):
            continue

        score = 0
        for ing in primary_expanded:
            if ing in product_ingredients:
                score += 10
                break
        for ing in secondary_expanded:
            if ing in product_ingredients:
                score += 5
                break

        if score > 0:
            scored_products.append({"product": p, "score": score})

        is_cleanser = "cleanser" in category or "cleanser" in title or "cleansing" in title
        is_moisturizer = "moisturizer" in category or "moisturizer" in title or "lotion" in category
        is_sunscreen = "sunscreen" in category or "sunscreen" in title or "spf" in title
        if is_cleanser or is_moisturizer or is_sunscreen:
            fb_score = 5 if ("gentle" in title or "sensitive" in title) else 0
            cat_type = "cleanser" if is_cleanser else "moisturizer" if is_moisturizer else "sunscreen"
            fallback_products.append({"product": p, "score": fb_score, "category_type": cat_type})

    scored_products.sort(key=lambda x: x["score"], reverse=True)
    top_products = [sp["product"] for sp in scored_products[:15]]

    if not top_products:
        fallback_products.sort(key=lambda x: x["score"], reverse=True)
        selected = []
        categories_covered = set()
        for fp in fallback_products:
            cat = fp["category_type"]
            if cat not in categories_covered:
                selected.append(fp["product"])
                categories_covered.add(cat)
            if len(selected) >= 5:
                break
        top_products = selected

    products_data = []
    for p in top_products[:5]:
        label_sections = p.get("label_sections", {})
        if isinstance(label_sections, str):
            label_sections = json.loads(label_sections)
        buy_button_urls = p.get("buy_button_urls", [])
        if isinstance(buy_button_urls, str):
            buy_button_urls = json.loads(buy_button_urls)
        products_data.append({
            "title": p.get("title", "Unknown"),
            "brand": p.get("brand", "Unknown"),
            "category": p.get("category", "Unknown"),
            "ingredients": label_sections.get("ingredients", {}).get("text", "Not listed")[:400],
            "directions": label_sections.get("directions", {}).get("text", "Not provided")[:200],
            "buy_links": buy_button_urls[:2],
        })

    return {
        "condition": condition,
        "primary_ingredients": primary_ingredients,
        "secondary_ingredients": secondary_ingredients,
        "avoid_ingredients": avoid_ingredients,
        "products": products_data,
        "search_stats": {"total_scored": len(scored_products), "top_products": len(top_products)},
    }


# =============================================================================
# FILE: src/api-service/agent/image_analysis_agent.py
# 作用：历史图像分析 Agent — 从 GCS 拉取用户上传的所有皮肤照片，
#       按日期分组，发送给 Gemini Vision 做时序对比分析
# =============================================================================

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
    grouped: Dict[str, List] = {}
    for blob in blobs:
        parsed = _parse_date_from_filename(blob.name)
        if not parsed:
            continue
        _, date_str = parsed
        grouped.setdefault(date_str, []).append(blob)
    return dict(sorted(grouped.items()))


def _build_contents(grouped: Dict[str, List], user: str) -> List:
    parts = []
    intro = (
        "You are a skincare expert analyzing a user's photo history.\n"
        "For each date, review the provided images and summarize skin condition,\n"
        "noting acne/inflammation/dryness/texture.\n"
        "Then explain whether the skin improved, worsened, or stayed stable day-over-day, and why.\n"
        "Be concise but specific. Avoid hallucinations—only rely on what is visible."
    )
    parts.append(types.Part(text=intro))
    for date_str, blobs in grouped.items():
        parts.append(types.Part(text=f"Date {date_str} for user {user}:"))
        for blob in blobs:
            data = blob.download_as_bytes()
            blob_name = blob.name.lower()
            mime = "image/jpeg" if blob_name.endswith(("jpg", "jpeg")) else "image/png"
            parts.append(types.Part.from_bytes(data=data, mime_type=mime))
    return parts


def fetch_user_image_blobs(user: str, bucket_name: Optional[str] = None,
                            prefix: Optional[str] = None, limit: Optional[int] = None) -> List:
    storage_client = storage.Client(project=PROJECT_ID)
    bucket = storage_client.bucket(bucket_name or BUCKET_NAME)
    base_prefix = prefix or GCS_IMAGE_PREFIX
    path_prefix = f"{base_prefix}/{user}"
    blobs = [b for b in bucket.list_blobs(prefix=path_prefix) if not b.name.endswith("/")]
    return blobs[:limit] if limit else blobs


def analyze_user_image_history(user: str, limit: Optional[int] = None) -> Dict:
    """
    Fetch user images from GCS, group by day, run Gemini temporal analysis.
    No files written to disk — images streamed directly to memory.
    """
    blobs = fetch_user_image_blobs(user=user, limit=limit)
    if not blobs:
        return {"message": f"No images found for user '{user}'.", "image_count": 0, "days": []}

    grouped = _group_blobs_by_day(blobs)
    if not grouped:
        return {"message": f"No images matched expected naming pattern for user '{user}'.",
                "image_count": len(blobs), "days": []}

    contents = _build_contents(grouped, user=user)
    response = _client.models.generate_content(model=GEMINI_MODEL, contents=contents,
                                                config={"temperature": 0.3})
    return {"message": response.text, "image_count": len(blobs), "days": list(grouped.keys())}


# =============================================================================
# FILE: src/api-service/agent/bigquery_service.py
# 作用：BigQuery 产品数据库查询服务
#       表结构：products(id, url, title, brand, ingredients_raw, buy_button_urls)
#               ingredients(ingredient_id, name_normalized, example_name)
#               product_ingredients(product_id, ingredient_id)
# =============================================================================

import os
import logging
from typing import List, Dict, Any, Optional
from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resonant-time-480901-n6")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "skinme")
DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 200


def get_dataset_table(table_name: str) -> str:
    return f"{GCP_PROJECT_ID}.{BIGQUERY_DATASET}.{table_name}"


class BigQueryService:
    def __init__(self):
        self.client = bigquery.Client(project=GCP_PROJECT_ID)

    def _run_query(self, sql: str, params=None) -> List[Dict[str, Any]]:
        job_config = bigquery.QueryJobConfig()
        if params:
            job_config.query_parameters = params
        query_job = self.client.query(sql, job_config=job_config)
        return [dict(row.items()) for row in query_job.result()]

    def search_products(self, query: str, limit: int = DEFAULT_SEARCH_LIMIT) -> List[Dict[str, Any]]:
        limit = min(max(1, limit), MAX_SEARCH_LIMIT)
        sql = f"""
        SELECT id, title, brand, url
        FROM `{get_dataset_table('products')}`
        WHERE (LOWER(title) LIKE CONCAT('%', LOWER(@query), '%')
               OR LOWER(brand) LIKE CONCAT('%', LOWER(@query), '%'))
        ORDER BY title LIMIT @limit
        """
        params = [bigquery.ScalarQueryParameter("query", "STRING", query),
                  bigquery.ScalarQueryParameter("limit", "INT64", limit)]
        return self._run_query(sql, params)

    def get_product_ingredients_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        sql = f"""
        SELECT p.id, p.title, p.brand, p.url,
               ing.ingredient_id, ing.name_normalized, ing.example_name
        FROM `{get_dataset_table('products')}` AS p
        JOIN `{get_dataset_table('product_ingredients')}` AS pi ON p.id = pi.product_id
        JOIN `{get_dataset_table('ingredients')}` AS ing ON pi.ingredient_id = ing.ingredient_id
        WHERE p.id = @product_id
        """
        params = [bigquery.ScalarQueryParameter("product_id", "STRING", product_id)]
        results = self._run_query(sql, params)
        if not results:
            return None
        first = results[0]
        return {
            "product": {"id": first.get("id"), "title": first.get("title"),
                        "brand": first.get("brand"), "url": first.get("url")},
            "ingredients": [{"ingredient_id": r.get("ingredient_id"),
                              "name_normalized": r.get("name_normalized"),
                              "example_name": r.get("example_name")} for r in results]
        }

    def get_product_ingredients_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        sql = f"""
        SELECT p.id, p.title, p.brand, p.url,
               ing.ingredient_id, ing.name_normalized, ing.example_name
        FROM `{get_dataset_table('products')}` AS p
        JOIN `{get_dataset_table('product_ingredients')}` AS pi ON p.id = pi.product_id
        JOIN `{get_dataset_table('ingredients')}` AS ing ON pi.ingredient_id = ing.ingredient_id
        WHERE p.url = @url
        """
        params = [bigquery.ScalarQueryParameter("url", "STRING", url)]
        results = self._run_query(sql, params)
        if not results:
            return None
        first = results[0]
        return {
            "product": {"id": first.get("id"), "title": first.get("title"),
                        "brand": first.get("brand"), "url": first.get("url")},
            "ingredients": [{"ingredient_id": r.get("ingredient_id"),
                              "name_normalized": r.get("name_normalized"),
                              "example_name": r.get("example_name")} for r in results]
        }

    def test_connection(self) -> bool:
        try:
            self._run_query(f"SELECT 1 FROM `{get_dataset_table('products')}` LIMIT 1")
            return True
        except Exception:
            return False


bigquery_service = BigQueryService()


# =============================================================================
# FILE: src/api-service/agent/auth/auth_manager.py
# 作用：用户认证管理 — 注册/登录，密码 SHA-256 + salt 哈希，凭证存 GCS
# =============================================================================

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
    return email.lower().replace("@", "_at_").replace(".", "_").replace("+", "_plus_")


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(32)
    hashed = hashlib.sha256(f"{password}{salt}".encode()).hexdigest()
    return hashed, salt


def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    test_hash, _ = hash_password(password, salt)
    return test_hash == hashed_password


def generate_token() -> str:
    return secrets.token_urlsafe(32)


class AuthManager:
    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.auth_prefix = "user_auth"
        self.index_path = f"{self.auth_prefix}/email_index.json"

    def _get_user_auth_path(self, username: str) -> str:
        return f"{self.auth_prefix}/{username}/credentials.json"

    def _load_email_index(self) -> Dict[str, str]:
        blob = self.bucket.blob(self.index_path)
        if blob.exists():
            try:
                return json.loads(blob.download_as_text())
            except Exception:
                return {}
        return {}

    def _save_email_index(self, index: Dict[str, str]) -> bool:
        blob = self.bucket.blob(self.index_path)
        try:
            blob.upload_from_string(json.dumps(index, indent=2), content_type="application/json")
            return True
        except Exception:
            return False

    def email_exists(self, email: str) -> bool:
        return email.lower() in self._load_email_index()

    def register_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        email_lower = email.lower()
        if self.email_exists(email_lower):
            return {"success": False, "error": "Email already registered."}
        if len(password) < 6:
            return {"success": False, "error": "Password must be at least 6 characters."}
        username = sanitize_email(email_lower)
        hashed_password, salt = hash_password(password)
        auth_data = {"email": email_lower, "name": name, "username": username,
                     "hashed_password": hashed_password, "salt": salt,
                     "created_at": datetime.utcnow().isoformat() + "Z", "last_login": None, "active": True}
        try:
            auth_blob = self.bucket.blob(self._get_user_auth_path(username))
            auth_blob.upload_from_string(json.dumps(auth_data, indent=2), content_type="application/json")
            index = self._load_email_index()
            index[email_lower] = username
            self._save_email_index(index)
            return {"success": True,
                    "user": {"id": username, "email": email_lower, "name": name,
                             "createdAt": auth_data["created_at"]},
                    "token": generate_token()}
        except Exception as e:
            return {"success": False, "error": f"Registration failed: {str(e)}"}

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        email_lower = email.lower()
        if not self.email_exists(email_lower):
            return {"success": False, "error": "Invalid email or password."}
        index = self._load_email_index()
        username = index.get(email_lower)
        auth_blob = self.bucket.blob(self._get_user_auth_path(username))
        if not auth_blob.exists():
            return {"success": False, "error": "Invalid email or password."}
        try:
            auth_data = json.loads(auth_blob.download_as_text())
            if not auth_data.get("active", True):
                return {"success": False, "error": "Account is disabled."}
            if not verify_password(password, auth_data["hashed_password"], auth_data["salt"]):
                return {"success": False, "error": "Invalid email or password."}
            auth_data["last_login"] = datetime.utcnow().isoformat() + "Z"
            auth_blob.upload_from_string(json.dumps(auth_data, indent=2), content_type="application/json")
            return {"success": True,
                    "user": {"id": username, "email": auth_data["email"], "name": auth_data["name"],
                             "createdAt": auth_data["created_at"]},
                    "token": generate_token()}
        except Exception as e:
            return {"success": False, "error": "Login failed. Please try again."}


auth_manager = AuthManager()


# =============================================================================
# FILE: src/api-service/agent/personalization/cache.py
# 作用：线程安全的内存 TTL 缓存 — 缓存用户 context 减少 GCS 请求
# =============================================================================

import time
from typing import Optional, Any, Dict
from threading import Lock


class SimpleCache:
    def __init__(self, default_ttl: int = 300):
        self.cache: Dict[str, tuple[Any, float]] = {}
        self.lock = Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        with self.lock:
            if key not in self.cache:
                return None
            value, expiry = self.cache[key]
            if time.time() > expiry:
                del self.cache[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)
        with self.lock:
            self.cache[key] = (value, expiry)

    def invalidate(self, key: str):
        with self.lock:
            if key in self.cache:
                del self.cache[key]

    def clear(self):
        with self.lock:
            self.cache.clear()


user_context_cache = SimpleCache(default_ttl=300)   # 5 min
profile_cache = SimpleCache(default_ttl=600)         # 10 min


# =============================================================================
# FILE: src/api-service/agent/personalization/weather_context_manager.py
# 作用：将天气 dict 格式化为 AI system context 字符串
# =============================================================================

from typing import Optional, Dict, Any


def format_weather_context(weather_data: Optional[Dict[str, Any]]) -> str:
    if not weather_data:
        return ""
    temp = weather_data.get("temperature") or weather_data.get("temp_c") or weather_data.get("temp")
    humidity = weather_data.get("humidity")
    uv_index = weather_data.get("uv_index") or weather_data.get("uvIndex")
    condition = weather_data.get("weather_condition") or weather_data.get("condition", "")
    location = weather_data.get("location")
    if temp is None or humidity is None:
        return ""
    location_str = f"Location: {location}\n" if location else ""
    return f"""Current Weather:
{location_str}- Temperature: {temp}°C
- Humidity: {humidity}%
- UV Index: {uv_index if uv_index else 'N/A'}
- Condition: {condition if condition else 'N/A'}

Please consider these weather conditions when providing skincare advice.""".strip()


# =============================================================================
# FILE: src/api-service/agent/personalization/weather_utils.py
# 作用：基于规则的天气护肤建议生成（不调用 LLM，纯 if/else）
# =============================================================================

def generate_weather_advice(temperature: float, humidity: int, uv_index: int,
                             weather_condition: str, language: str = "en") -> str:
    advice_parts = []
    if language == "zh":
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


# =============================================================================
# FILE: src/api-service/agent/personalization/user_profile_manager.py
# 作用：用户画像管理 — 存储/读取 GCS 中的 profile.json（肤质、过敏、目标等）
# =============================================================================

import os
import json
from datetime import datetime
from typing import Dict, Any
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


def sanitize_email(email: str) -> str:
    return email.lower().replace("@", "_at_").replace(".", "_").replace("+", "_plus_")


class UserProfileManager:
    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.profile_prefix = "user_profiles"

    def _get_profile_path(self, username: str) -> str:
        return f"{self.profile_prefix}/{username}/profile.json"

    def load_profile(self, email: str) -> Dict[str, Any]:
        username = sanitize_email(email)
        blob = self.bucket.blob(self._get_profile_path(username))
        if blob.exists():
            try:
                return json.loads(blob.download_as_text())
            except Exception:
                return self._create_default_profile(email, username)
        return self._create_default_profile(email, username)

    def _create_default_profile(self, email: str, username: str) -> Dict[str, Any]:
        return {
            "email": email, "username": username,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "skin_type": None, "allergies": [], "sensitivities": [],
            "current_products": [], "goals": [],
            "preferences": {"avoid_ingredients": [], "prefer_cruelty_free": False,
                            "prefer_vegan": False, "price_range": None},
            "metadata": {"total_chats": 0, "total_images_uploaded": 0, "last_chat_date": None},
        }

    def save_profile(self, email: str, profile_data: Dict[str, Any]) -> bool:
        username = sanitize_email(email)
        blob = self.bucket.blob(self._get_profile_path(username))
        profile_data["updated_at"] = datetime.utcnow().isoformat() + "Z"
        try:
            blob.upload_from_string(json.dumps(profile_data, indent=2), content_type="application/json")
            return True
        except Exception:
            return False

    def add_product_feedback(self, email: str, product_name: str, feedback: str, still_using: bool = True) -> bool:
        profile = self.load_profile(email)
        product_entry = {"product_name": product_name,
                         "started_date": datetime.utcnow().isoformat() + "Z",
                         "feedback": feedback, "still_using": still_using,
                         "updated_at": datetime.utcnow().isoformat() + "Z"}
        found = False
        for i, prod in enumerate(profile.get("current_products", [])):
            if prod.get("product_name", "").lower() == product_name.lower():
                profile["current_products"][i] = {**prod, "feedback": feedback,
                                                   "still_using": still_using,
                                                   "updated_at": datetime.utcnow().isoformat() + "Z"}
                found = True
                break
        if not found:
            profile.setdefault("current_products", []).append(product_entry)
        return self.save_profile(email, profile)

    def get_user_context_summary(self, email: str) -> str:
        profile = self.load_profile(email)
        parts = []
        if profile.get("skin_type"):
            parts.append(f"Skin type: {profile['skin_type']}")
        if profile.get("allergies"):
            parts.append(f"Allergies: {', '.join(profile['allergies'])}")
        if profile.get("sensitivities"):
            parts.append(f"Sensitivities: {', '.join(profile['sensitivities'])}")
        if profile.get("goals"):
            parts.append(f"Goals: {', '.join(profile['goals'])}")
        avoid = profile.get("preferences", {}).get("avoid_ingredients", [])
        if avoid:
            parts.append(f"Avoid ingredients: {', '.join(avoid)}")
        return "USER PROFILE: " + " | ".join(parts) if parts else "New user - no previous profile data."


profile_manager = UserProfileManager()


# =============================================================================
# FILE: src/api-service/agent/personalization/chat_logger.py
# 作用：对话历史记录 — 以 JSONL 格式写入 GCS，供个性化 context 检索
# =============================================================================

import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from google.cloud import storage
# sanitize_email imported from user_profile_manager in real code

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class ChatLogger:
    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.chat_log_prefix = "user_chat_history"

    def _get_log_path(self, username: str, date: datetime) -> str:
        return f"{self.chat_log_prefix}/{username}/{date.strftime('%Y%m')}/chat_log_{date.strftime('%Y%m%d')}.jsonl"

    def log_message(self, email: str, role: str, message: str,
                    image_uploaded: bool = False, analysis_result=None, metadata=None) -> bool:
        username = email.lower().replace("@", "_at_").replace(".", "_")
        now = datetime.utcnow()
        blob = self.bucket.blob(self._get_log_path(username, now))
        log_entry = {"timestamp": now.isoformat() + "Z", "role": role,
                     "message": message, "image_uploaded": image_uploaded}
        if analysis_result:
            log_entry["analysis"] = analysis_result
        if metadata:
            log_entry["metadata"] = metadata
        try:
            existing = blob.download_as_text() if blob.exists() else ""
            blob.upload_from_string(existing + json.dumps(log_entry) + "\n",
                                    content_type="application/x-ndjson")
            return True
        except Exception as e:
            print(f"Error logging message: {e}")
            return False

    def log_conversation_turn(self, email: str, user_message: str, assistant_response: str,
                               image_uploaded: bool = False, analysis_result=None) -> bool:
        self.log_message(email=email, role="user", message=user_message, image_uploaded=image_uploaded)
        return self.log_message(email=email, role="assistant", message=assistant_response,
                                analysis_result=analysis_result)

    def get_recent_conversations(self, email: str, days: int = 7, limit=50) -> List[Dict[str, Any]]:
        username = email.lower().replace("@", "_at_").replace(".", "_")
        now = datetime.utcnow()
        conversations = []
        for day_offset in range(days):
            check_date = datetime(now.year, now.month, now.day) - timedelta(days=day_offset)
            blob = self.bucket.blob(self._get_log_path(username, check_date))
            if blob.exists():
                try:
                    for line in blob.download_as_text().strip().split("\n"):
                        if line:
                            conversations.append(json.loads(line))
                except Exception:
                    pass
        conversations.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return conversations[:limit] if limit else conversations

    def get_conversation_summary(self, email: str, days: int = 7, max_tokens: int = 500) -> str:
        """Generate ~20-word summary of key facts from recent user messages."""
        conversations = self.get_recent_conversations(email, days=days, limit=5)
        if not conversations:
            return "No recent conversation history."
        key_info = []
        for conv in conversations[:3]:
            if conv.get("role") != "user":
                continue
            message = conv.get("message", "").lower()
            if "allerg" in message or "sensitive" in message:
                key_info.append(f"mentioned: {conv.get('message', '')[:60]}")
            for concern in ["acne", "dry", "oily", "wrinkle", "aging", "dark spot", "redness"]:
                if concern in message:
                    key_info.append(f"concern: {concern}")
                    break
            if conv.get("image_uploaded"):
                key_info.append("uploaded skin image")
        if not key_info:
            return "No recent conversation history."
        summary = "CHAT HISTORY: " + "; ".join(key_info[:2])
        words = summary.split()
        return " ".join(words[:25]) + ("..." if len(words) > 25 else "")


chat_logger = ChatLogger()


# =============================================================================
# FILE: src/api-service/agent/personalization/image_upload_handler.py
# 作用：用户图片上传到 GCS，命名规范：{username}_{YYYYMMDD}_{HHMMSS}.jpg
# =============================================================================

import os
import base64
from datetime import datetime
from typing import Optional
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
GCS_IMAGE_PREFIX = os.getenv("GCS_IMAGE_PREFIX", "user_image")


class ImageUploadHandler:
    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(bucket_name)
        self.image_prefix = GCS_IMAGE_PREFIX

    def upload_image(self, email: str, image_data: str, image_format: str = "jpg") -> Optional[str]:
        username = email.lower().replace("@", "_at_").replace(".", "_")
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{username}_{timestamp}.{image_format.lower()}"
        blob_path = f"{self.image_prefix}/{username}/{filename}"
        blob = self.bucket.blob(blob_path)
        try:
            image_bytes = base64.b64decode(image_data)
            content_type = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                            "png": "image/png"}.get(image_format.lower(), "image/jpeg")
            blob.upload_from_string(image_bytes, content_type=content_type)
            return blob_path
        except Exception as e:
            print(f"Error uploading image: {e}")
            return None

    def get_user_image_count(self, email: str) -> int:
        username = email.lower().replace("@", "_at_").replace(".", "_")
        prefix = f"{self.image_prefix}/{username}/"
        return len([b for b in self.bucket.list_blobs(prefix=prefix) if not b.name.endswith("/")])

    def get_recent_images(self, email: str, limit: int = 5) -> list:
        username = email.lower().replace("@", "_at_").replace(".", "_")
        prefix = f"{self.image_prefix}/{username}/"
        blobs = [b for b in self.bucket.list_blobs(prefix=prefix) if not b.name.endswith("/")]
        blobs.sort(key=lambda b: b.time_created, reverse=True)
        return [b.name for b in blobs[:limit]]


image_upload_handler = ImageUploadHandler()


# =============================================================================
# FILE: src/api-service/agent/personalization/calendar_manager.py
# 作用：日历事件管理 — 存 GCS，检测户外活动，为 AI context 生成摘要
# =============================================================================

import os
import json
from typing import List, Dict, Any
from datetime import datetime
from google.cloud import storage

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class CalendarManager:
    def __init__(self):
        self.bucket_name = BUCKET_NAME
        self.storage_client = storage.Client()

    def _get_calendar_path(self, identifier: str) -> str:
        if "@" in identifier:
            return f"users/{identifier}/calendar_events.json"
        return f"anonymous/{identifier}/calendar_events.json"

    def save_events(self, identifier: str, events: List[Dict[str, Any]]) -> bool:
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            bucket.blob(self._get_calendar_path(identifier)).upload_from_string(json.dumps(events, indent=2))
            return True
        except Exception as e:
            print(f"Error saving calendar events: {e}")
            return False

    def load_events(self, identifier: str) -> List[Dict[str, Any]]:
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(self._get_calendar_path(identifier))
            if not blob.exists():
                return []
            return json.loads(blob.download_as_text())
        except Exception:
            return []

    def get_calendar_context_summary(self, identifier: str) -> str:
        events = self.load_events(identifier)
        today = datetime.now().date()
        today_events, tomorrow_events, upcoming_events = [], [], []
        for event in events:
            event_date = datetime.strptime(event["date"], "%Y-%m-%d").date()
            days_until = (event_date - today).days
            if days_until == 0:
                today_events.append(event)
            elif days_until == 1:
                tomorrow_events.append(event)
            elif 0 < days_until <= 7:
                upcoming_events.append((event, event_date, days_until))

        parts = []
        if today_events:
            parts.append("📅 TODAY's Events:")
            parts.extend(self._format_event(e, "TODAY") for e in today_events)
        if tomorrow_events:
            parts.append("\n📅 TOMORROW's Events:")
            parts.extend(self._format_event(e, "TOMORROW") for e in tomorrow_events)
        if upcoming_events:
            parts.append("\n📅 Upcoming Events (next 7 days):")
            for event, event_date, days_until in sorted(upcoming_events, key=lambda x: x[2])[:3]:
                parts.append(self._format_event(event, f"in {days_until} days ({event_date.strftime('%a, %b %d')})"))
        return "📅 USER CALENDAR:\n" + "\n".join(parts) if parts else ""

    def _format_event(self, event: Dict[str, Any], timing: str) -> str:
        title = event.get("title", "Untitled")
        description = event.get("description", "")
        outdoor_keywords = ["outdoor", "tennis", "hiking", "beach", "pool", "swim",
                            "run", "jog", "bike", "sport", "park", "garden", "golf", "ski", "surf"]
        is_outdoor = any(kw in title.lower() or kw in description.lower() for kw in outdoor_keywords)
        event_str = f"  • {timing}: {title}"
        if is_outdoor:
            event_str += " [⚠️ OUTDOOR ACTIVITY - Sun protection needed!]"
        if description:
            event_str += f" - {description[:100]}"
        return event_str


calendar_manager = CalendarManager()


# =============================================================================
# FILE: src/api-service/agent/personalization/user_context_retriever.py
# 作用：智能 context 组装 — 根据消息类型决定是否包含画像/天气/日历/历史
#       get_smart_context() 是核心方法，被 runner.py 调用
# =============================================================================

import os
from typing import Dict, Any, Optional
# In real code, imports from relative modules; shown inline here

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")


class UserContextRetriever:
    def __init__(self):
        self.profile_manager = profile_manager          # from user_profile_manager
        self.chat_logger = chat_logger                  # from chat_logger
        self.image_handler = image_upload_handler       # from image_upload_handler
        self.calendar_manager = calendar_manager        # from calendar_manager
        self.cache = user_context_cache                 # from cache

    def get_smart_context(self, email: Optional[str], user_message: str,
                          has_image: bool = False, weather_data=None, session_id=None) -> str:
        """
        Smart context retrieval:
        - Skips short greetings (hello/hi/thanks ≤3 words)
        - Always includes weather if provided
        - Includes profile/allergies for product-related queries
        - Includes calendar events for all users
        - Includes chat history summary for logged-in users (~20 words)
        """
        message_lower = user_message.lower()

        if has_image:
            return self._get_full_context(email, weather_data=weather_data, session_id=session_id)

        skip_keywords = ["hello", "hi", "hey", "thanks", "thank you", "bye", "goodbye"]
        if any(kw in message_lower for kw in skip_keywords) and len(user_message.split()) <= 3:
            return ""

        context_parts = []

        # 1. User Profile (for product queries)
        if email:
            product_keywords = ["product", "ingredient", "cream", "serum", "cleanser",
                                 "moisturizer", "recommend", "allergic", "sensitive", "buy",
                                 "routine", "treatment", "suggest", "need", "what should", "help me"]
            if any(kw in message_lower for kw in product_keywords):
                profile = self.profile_manager.load_profile(email)
                profile_parts = []
                if profile.get("skin_type"):
                    profile_parts.append(f"Skin type: {profile['skin_type']}")
                if profile.get("allergies"):
                    profile_parts.append(f"⚠️ ALLERGIES: {', '.join(profile['allergies'])}")
                if profile.get("sensitivities"):
                    profile_parts.append(f"⚠️ SENSITIVITIES: {', '.join(profile['sensitivities'])}")
                if profile_parts:
                    context_parts.append("USER PROFILE:\n" + "\n".join(profile_parts))

        # 2. Calendar Events
        identifier = email if email else session_id
        if identifier:
            calendar_summary = self.calendar_manager.get_calendar_context_summary(identifier)
            if calendar_summary:
                context_parts.append(calendar_summary)

        # 3. Weather Context
        if weather_data:
            weather_context = format_weather_context(weather_data)
            if weather_context:
                context_parts.append(f"\n{weather_context}")

        # 4. Chat History (logged-in users only)
        if email:
            chat_summary = self.chat_logger.get_conversation_summary(email, days=7)
            if chat_summary != "No recent conversation history.":
                context_parts.append(f"\n{chat_summary}")

        if not context_parts:
            return ""

        full_context = "\n".join(context_parts)
        return f"""
=== SYSTEM CONTEXT - IMPORTANT: Use this factual information to answer user questions ===
{full_context}
=== END CONTEXT ===

"""

    def _get_full_context(self, email, weather_data=None, session_id=None) -> str:
        """Full context for image uploads or logged-in users."""
        context_parts = []
        if email:
            context_parts.append(self.profile_manager.get_user_context_summary(email))
            image_count = self.image_handler.get_user_image_count(email)
            if image_count > 0:
                context_parts.append(f"Total images uploaded: {image_count}")
        if weather_data:
            wc = format_weather_context(weather_data)
            if wc:
                context_parts.append(f"\n{wc}")
        identifier = email if email else session_id
        if identifier:
            cal = self.calendar_manager.get_calendar_context_summary(identifier)
            if cal:
                context_parts.append(cal)
        if email:
            chat_summary = self.chat_logger.get_conversation_summary(email, days=7)
            if chat_summary != "No recent conversation history.":
                context_parts.append(f"\n{chat_summary}")
        if not context_parts:
            return ""
        return f"""
=== SYSTEM CONTEXT - IMPORTANT: Use this factual information to answer user questions ===
{chr(10).join(context_parts)}
=== END CONTEXT ===

"""


user_context_retriever = UserContextRetriever()


# =============================================================================
# FILE: src/api-service/agent/personalization/profile_extractor.py
# 作用：对话信息提取 — 调用 Gemini structured output 提取用户肤质/过敏/目标等，
#       自动更新 user profile，清除相关缓存
# =============================================================================

import os
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


class ProfileExtractor:
    def __init__(self):
        self.profile_manager = profile_manager

    def extract_from_conversation(self, email: str, user_message: str,
                                   assistant_response: str, analysis_result=None) -> bool:
        prompt = f"""Extract user profile information from this skincare conversation.

USER MESSAGE: {user_message}
ASSISTANT RESPONSE: {assistant_response[:500]}

Extract ONLY information explicitly mentioned by the user. Return JSON:
- skin_type: one of ["oily", "dry", "combination", "normal", "sensitive"] or null
- allergies: list of ingredients user is allergic to
- sensitivities: list of ingredients that irritate their skin
- goals: list of skincare goals
- current_products: list of products they mentioned using
- avoid_preferences: list of ingredients they want to avoid

Only extract what the user EXPLICITLY stated. Return empty lists [] if not mentioned.
"""
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "skin_type": types.Schema(type=types.Type.STRING),
                        "allergies": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "sensitivities": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "goals": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "current_products": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "avoid_preferences": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                    },
                ),
                temperature=0.1,
            )
            response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt, config=config)
            extracted = response.parsed or {}

            if analysis_result and "condition" in analysis_result:
                concerns = self._extract_concerns_from_condition(analysis_result["condition"].lower())
                if concerns:
                    extracted["goals"] = list(set(extracted.get("goals", []) + concerns))

            return self._update_profile(email, extracted)
        except Exception as e:
            print(f"Error extracting profile info: {e}")
            return False

    def _extract_concerns_from_condition(self, condition: str) -> list:
        concern_map = {
            "acne": "treat acne", "breakout": "treat acne", "pimple": "treat acne",
            "wrinkle": "anti-aging", "fine line": "anti-aging", "aging": "anti-aging",
            "dark spot": "reduce hyperpigmentation", "hyperpigmentation": "reduce hyperpigmentation",
            "dry": "hydration", "dehydrat": "hydration", "oily": "oil control",
            "redness": "reduce redness", "inflammation": "reduce inflammation",
        }
        concerns = []
        for keyword, concern in concern_map.items():
            if keyword in condition and concern not in concerns:
                concerns.append(concern)
        return concerns[:3]

    def _update_profile(self, email: str, extracted: Dict[str, Any]) -> bool:
        profile = self.profile_manager.load_profile(email)
        updated = False

        if extracted.get("skin_type") and not profile.get("skin_type"):
            skin_type = extracted["skin_type"].lower()
            if skin_type in ["oily", "dry", "combination", "normal", "sensitive"]:
                profile["skin_type"] = skin_type
                updated = True

        for allergy in extracted.get("allergies", []):
            if allergy and allergy.lower() not in [a.lower() for a in profile.get("allergies", [])]:
                profile.setdefault("allergies", []).append(allergy.lower())
                updated = True

        for sensitivity in extracted.get("sensitivities", []):
            if sensitivity and sensitivity.lower() not in [s.lower() for s in profile.get("sensitivities", [])]:
                profile.setdefault("sensitivities", []).append(sensitivity.lower())
                updated = True

        for goal in extracted.get("goals", []):
            if goal and goal.lower() not in [g.lower() for g in profile.get("goals", [])]:
                profile.setdefault("goals", []).append(goal.lower())
                updated = True

        for product in extracted.get("current_products", []):
            if product:
                existing = [p.get("product_name", "").lower() for p in profile.get("current_products", [])]
                if product.lower() not in existing:
                    self.profile_manager.add_product_feedback(email, product, "User mentioned using this product", True)
                    updated = True

        for avoid in extracted.get("avoid_preferences", []):
            avoid_list = profile.get("preferences", {}).get("avoid_ingredients", [])
            if avoid and avoid.lower() not in [a.lower() for a in avoid_list]:
                profile.setdefault("preferences", {}).setdefault("avoid_ingredients", []).append(avoid.lower())
                updated = True

        if updated:
            success = self.profile_manager.save_profile(email, profile)
            if success:
                for key in list(user_context_cache.cache.keys()):
                    if key.startswith(f"context:{email}:"):
                        user_context_cache.invalidate(key)
            return success
        return False


profile_extractor = ProfileExtractor()


# =============================================================================
# FILE: src/api-service/agent/daily_routine_manager.py
# 作用：每日护肤流程管理 — 记录用户每天使用的产品，存 GCS，
#       支持按日期查询/范围查询/成分汇总
# =============================================================================

import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from google.cloud import storage

logger = logging.getLogger(__name__)
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resonant-time-480901-n6")
BUCKET_NAME = os.getenv("BUCKET_NAME", "hang-skincare")
ROUTINES_PREFIX = "daily_routines"


class DailyRoutineManager:
    def __init__(self):
        self.storage_client = storage.Client(project=GCP_PROJECT_ID)
        self.bucket = self.storage_client.bucket(BUCKET_NAME)

    def _get_routine_path(self, user_identifier: str, date: str) -> str:
        safe = user_identifier.replace("@", "_at_").replace(".", "_")
        return f"{ROUTINES_PREFIX}/{safe}/{date}.json"

    def save_routine(self, user_identifier: str, date: str, products: List[Dict[str, Any]]) -> bool:
        try:
            data = {"user_identifier": user_identifier, "date": date,
                    "products": products, "updated_at": datetime.utcnow().isoformat()}
            blob = self.bucket.blob(self._get_routine_path(user_identifier, date))
            blob.upload_from_string(json.dumps(data, ensure_ascii=False), content_type="application/json")
            return True
        except Exception as e:
            logger.error(f"Error saving routine: {e}")
            return False

    def get_routine(self, user_identifier: str, date: str) -> Optional[Dict[str, Any]]:
        try:
            blob = self.bucket.blob(self._get_routine_path(user_identifier, date))
            return json.loads(blob.download_as_text()) if blob.exists() else None
        except Exception:
            return None

    def get_routines_range(self, user_identifier: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        try:
            safe = user_identifier.replace("@", "_at_").replace(".", "_")
            routines = []
            for blob in self.bucket.list_blobs(prefix=f"{ROUTINES_PREFIX}/{safe}/"):
                filename = blob.name.split("/")[-1]
                if not filename.endswith(".json"):
                    continue
                date_str = filename.replace(".json", "")
                if start_date <= date_str <= end_date:
                    routines.append(json.loads(blob.download_as_text()))
            routines.sort(key=lambda x: x["date"])
            return routines
        except Exception:
            return []

    def delete_routine(self, user_identifier: str, date: str) -> bool:
        try:
            blob = self.bucket.blob(self._get_routine_path(user_identifier, date))
            if blob.exists():
                blob.delete()
                return True
            return False
        except Exception:
            return False

    def get_ingredient_summary(self, user_identifier: str, date: str,
                                product_ingredients_map: Dict[str, List[Dict]]) -> Dict[str, Any]:
        try:
            routine = self.get_routine(user_identifier, date)
            if not routine:
                return {"date": date, "total_products": 0, "ingredients": []}
            ingredient_map = {}
            for product in routine.get("products", []):
                product_id = product.get("product_id")
                product_name = product.get("product_name", "Unknown")
                for ing in product_ingredients_map.get(product_id, []):
                    ing_name = ing.get("name_normalized", "Unknown")
                    if ing_name not in ingredient_map:
                        ingredient_map[ing_name] = {"name": ing_name, "count": 0, "products": []}
                    ingredient_map[ing_name]["count"] += 1
                    if product_name not in ingredient_map[ing_name]["products"]:
                        ingredient_map[ing_name]["products"].append(product_name)
            ingredients_list = sorted(ingredient_map.values(), key=lambda x: x["count"], reverse=True)
            return {"date": date, "total_products": len(routine.get("products", [])),
                    "ingredients": ingredients_list}
        except Exception:
            return {"date": date, "total_products": 0, "ingredients": []}


daily_routine_manager = DailyRoutineManager()


# =============================================================================
# FILE: src/api-service/agent/ingredient_risk_classifier.py
# 作用：成分风险分类 — 按高/中/低风险和功能类别（活性/酸/保湿/抗氧化）分类
# =============================================================================

from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class IngredientRiskClassifier:
    HIGH_RISK_PATTERNS = {
        "retinol", "tretinoin", "adapalene", "tazarotene", "hydroquinone", "kojic acid",
        "glycolic acid", "lactic acid", "salicylic acid", "mandelic acid", "azelaic acid",
        "fragrance", "parfum", "perfume", "essential oil", "limonene", "linalool",
        "alcohol denat", "sd alcohol", "isopropyl alcohol",
        "methylisothiazolinone", "formaldehyde", "dmdm hydantoin",
        "sodium lauryl sulfate", "sls", "sodium laureth sulfate", "sles",
    }
    MEDIUM_RISK_PATTERNS = {
        "pha", "gluconolactone", "arbutin", "tranexamic acid",
        "vitamin c", "ascorbic acid", "l-ascorbic acid", "ferulic acid",
        "phenoxyethanol", "parabens", "methylparaben", "propylparaben",
        "cocamidopropyl betaine", "decyl glucoside",
    }
    LOW_RISK_PATTERNS = {
        "hyaluronic acid", "sodium hyaluronate", "glycerin", "glycerine",
        "panthenol", "allantoin", "urea", "ceramide", "squalane",
        "centella asiatica", "cica", "niacinamide", "bisabolol", "aloe vera",
        "tocopherol", "vitamin e", "water", "aqua", "butylene glycol",
    }
    FUNCTIONAL_CATEGORIES = {
        "active": ["retinol", "tretinoin", "niacinamide", "peptide", "vitamin c", "ascorbic acid",
                   "hydroquinone", "arbutin", "kojic acid"],
        "exfoliant": ["glycolic acid", "lactic acid", "salicylic acid", "mandelic acid",
                      "pha", "gluconolactone", "azelaic acid"],
        "moisturizer": ["hyaluronic acid", "glycerin", "ceramide", "squalane",
                        "panthenol", "urea", "allantoin", "sodium hyaluronate"],
        "antioxidant": ["vitamin e", "tocopherol", "green tea", "resveratrol",
                        "coenzyme q10", "ubiquinone", "ferulic acid"],
        "soothing": ["centella asiatica", "cica", "madecassoside", "bisabolol",
                     "aloe vera", "chamomile"],
        "preservative": ["phenoxyethanol", "methylparaben", "propylparaben", "methylisothiazolinone"],
        "fragrance": ["fragrance", "parfum", "essential oil", "limonene", "linalool"],
        "surfactant": ["sodium lauryl sulfate", "sodium laureth sulfate",
                       "cocamidopropyl betaine", "decyl glucoside"],
    }

    @classmethod
    def classify_risk(cls, ingredient_name: str) -> str:
        name_lower = ingredient_name.lower()
        for p in cls.HIGH_RISK_PATTERNS:
            if p in name_lower:
                return "high"
        for p in cls.MEDIUM_RISK_PATTERNS:
            if p in name_lower:
                return "medium"
        for p in cls.LOW_RISK_PATTERNS:
            if p in name_lower:
                return "low"
        return "medium"

    @classmethod
    def get_functional_category(cls, ingredient_name: str) -> str:
        name_lower = ingredient_name.lower()
        for category, patterns in cls.FUNCTIONAL_CATEGORIES.items():
            if any(p in name_lower for p in patterns):
                return category
        return "other"

    @classmethod
    def sort_by_risk(cls, ingredients: List[Dict]) -> List[Dict]:
        risk_order = {"high": 0, "medium": 1, "low": 2}
        enriched = []
        for ing in ingredients:
            risk_level = cls.classify_risk(ing["name"])
            category = cls.get_functional_category(ing["name"])
            enriched.append({
                **ing, "risk_level": risk_level, "category": category,
                "risk_description_zh": {"high": "需谨慎使用", "medium": "适度使用", "low": "一般安全"}[risk_level],
                "risk_description_en": {"high": "Use with caution", "medium": "Moderate use",
                                         "low": "Generally safe for daily use"}[risk_level],
            })
        enriched.sort(key=lambda x: (risk_order.get(x["risk_level"], 3), -x.get("count", 0)))
        return enriched


ingredient_risk_classifier = IngredientRiskClassifier()


# =============================================================================
# FILE: src/api-service/agent/ingredient_analyzer.py
# 作用：成分使用趋势分析 — 统计多日 routine 数据，调用 Gemini 生成个性化洞察
# =============================================================================

import json
import logging
from typing import Dict, List, Any
from datetime import datetime
import vertexai
from vertexai.generative_models import GenerativeModel
import google.auth

logger = logging.getLogger(__name__)
credentials, project_id = google.auth.default()
vertexai.init(project=project_id, location="us-east1")
model = GenerativeModel("gemini-2.0-flash-exp")


class IngredientAnalyzer:
    def calculate_ingredient_statistics(self, trends_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not trends_data:
            return {"total_days": 0, "total_products": 0, "unique_ingredients": 0,
                    "top_ingredients": [], "usage_patterns": {}, "date_range": {}}
        ingredient_stats = {}
        total_products = 0
        dates = []
        for day_data in trends_data:
            dates.append(day_data.get("date", ""))
            total_products += day_data.get("total_products", 0)
            for ing in day_data.get("ingredients", []):
                name = ing.get("name", "").lower()
                if name not in ingredient_stats:
                    ingredient_stats[name] = {"name": name, "total_count": 0,
                                               "days_used": 0, "products": set(), "daily_usage": []}
                ingredient_stats[name]["total_count"] += ing.get("count", 0)
                ingredient_stats[name]["days_used"] += 1
                ingredient_stats[name]["products"].update(ing.get("products", []))
        ingredients_list = [{
            "name": n, "total_count": s["total_count"], "days_used": s["days_used"],
            "product_count": len(s["products"]), "products": list(s["products"]),
            "avg_daily_count": s["total_count"] / s["days_used"],
            "usage_frequency": s["days_used"] / len(trends_data),
        } for n, s in ingredient_stats.items()]
        ingredients_list.sort(key=lambda x: x["total_count"], reverse=True)
        return {
            "total_days": len(trends_data), "total_products": total_products,
            "avg_products_per_day": total_products / len(trends_data),
            "unique_ingredients": len(ingredients_list),
            "date_range": {"start": min(dates) if dates else "", "end": max(dates) if dates else ""},
            "top_ingredients": ingredients_list[:20],
            "categorized_ingredients": self._categorize_ingredients(ingredients_list),
            "usage_patterns": self._analyze_usage_patterns(ingredients_list, len(trends_data)),
        }

    def _categorize_ingredients(self, ingredients: List[Dict]) -> Dict[str, List[str]]:
        categories = {"actives": [], "moisturizers": [], "preservatives": [],
                      "solvents": [], "acids": [], "antioxidants": []}
        for ing in ingredients[:30]:
            name = ing["name"].lower()
            if any(kw in name for kw in ["retinol", "niacinamide", "vitamin c", "peptide"]):
                categories["actives"].append(ing["name"])
            elif any(kw in name for kw in ["acid", "aha", "bha", "salicylic", "glycolic"]):
                categories["acids"].append(ing["name"])
            elif any(kw in name for kw in ["hyaluronic", "glycerin", "ceramide", "squalane"]):
                categories["moisturizers"].append(ing["name"])
            elif any(kw in name for kw in ["tocopherol", "vitamin e", "green tea"]):
                categories["antioxidants"].append(ing["name"])
            elif any(kw in name for kw in ["phenoxyethanol", "methylparaben"]):
                categories["preservatives"].append(ing["name"])
            elif any(kw in name for kw in ["water", "aqua", "alcohol", "butylene glycol"]):
                categories["solvents"].append(ing["name"])
        return categories

    def _analyze_usage_patterns(self, ingredients: List[Dict], total_days: int) -> Dict[str, Any]:
        high_freq = [i for i in ingredients if i["usage_frequency"] > 0.8]
        occasional = [i for i in ingredients if 0.3 < i["usage_frequency"] <= 0.5]
        multi_product = [i for i in ingredients if i["product_count"] >= 2]
        return {
            "high_frequency_ingredients": [i["name"] for i in high_freq[:5]],
            "occasional_ingredients": [i["name"] for i in occasional[:5]],
            "overlapping_ingredients": [i["name"] for i in multi_product[:5]],
            "high_frequency_count": len(high_freq),
            "overlapping_count": len(multi_product),
        }

    def generate_insights(self, statistics: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        try:
            prompt = self._build_analysis_prompt(statistics, language)
            response = model.generate_content(prompt)
            insights = json.loads(response.text.strip().lstrip("```json").rstrip("```"))
            insights["generated_at"] = datetime.now().isoformat()
            insights["language"] = language
            insights["statistics"] = statistics
            return insights
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {"tldr": f"Tracked {statistics['total_days']} days.",
                    "patterns": [], "insights": [], "recommendations": [],
                    "followup_questions": [], "overall_assessment": "balanced",
                    "statistics": statistics}

    def _build_analysis_prompt(self, stats: Dict[str, Any], language: str) -> str:
        lang_map = {"en": "English", "zh": "Simplified Chinese (简体中文)", "es": "Spanish", "vi": "Vietnamese"}
        output_lang = lang_map.get(language, "English")
        top_ings = "\n".join([f"{i+1}. {ing['name']} - {ing['days_used']} days, {ing['product_count']} products"
                               for i, ing in enumerate(stats["top_ingredients"][:10])])
        return f"""You are a gentle skincare ingredient coach. Respond ONLY in {output_lang}.

User's skincare data ({stats['total_days']} days, avg {stats['avg_products_per_day']:.1f} products/day):

Top 10 Ingredients:
{top_ings}

Active ingredients: {', '.join(stats['categorized_ingredients']['actives'][:5]) or 'None'}
Moisturizers: {', '.join(stats['categorized_ingredients']['moisturizers'][:5]) or 'None'}
High-frequency (>80% days): {', '.join(stats['usage_patterns']['high_frequency_ingredients']) or 'None'}

Return JSON only (no markdown):
{{"tldr": "...", "patterns": ["..."], "insights": ["..."], "recommendations": ["..."],
"followup_questions": ["..."], "overall_assessment": "positive/balanced/needs_attention"}}"""


ingredient_analyzer = IngredientAnalyzer()
