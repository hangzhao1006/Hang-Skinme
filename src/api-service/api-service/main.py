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

# Configure logging
logger = logging.getLogger(__name__)

# Add agent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Get ROOT_PATH from environment for proxy/ingress path prefix support
ROOT_PATH = os.environ.get("ROOT_PATH", "")

app = FastAPI(title="Skincare RAG API", version="1.0.0", root_path=ROOT_PATH)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
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
    temperature: float  # Celsius
    humidity: int  # 0-100
    uv_index: int  # 0-11+
    weather_condition: str
    location: Optional[str] = None
    language: Optional[str] = "en"  # "en" or "zh"


class WeatherSkincareResponse(BaseModel):
    advice: str
    temperature: float
    humidity: int
    uv_index: int


# Authentication Models
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


# API Endpoints


# Routes
@app.get("/")
async def get_index():
    return {"message": "Welcome to AC215-Skincare RAG API Service"}


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(status="ok")


# Authentication Endpoints
@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user.

    Validates:
    - Email is not already registered
    - Password meets minimum requirements

    Returns user data and authentication token on success.
    """
    result = auth_manager.register_user(email=request.email, password=request.password, name=request.name)
    return AuthResponse(**result)


@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Authenticate user login.

    Validates email and password against stored credentials in GCS.
    Returns user data and authentication token on success.
    """
    result = auth_manager.login_user(email=request.email, password=request.password)
    return AuthResponse(**result)


@app.get("/auth/check-email/{email}")
async def check_email(email: str):
    """
    Check if email is already registered.

    Useful for frontend validation during registration.
    """
    exists = auth_manager.email_exists(email)
    return {"exists": exists, "message": "Email is already registered" if exists else "Email is available"}


@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    weather: Optional[str] = Form(None),  # JSON string of weather data
):
    """Non-streaming endpoint - returns complete response with conversation history"""
    # Convert uploaded image to base64 if provided
    user_image = None
    if image:
        image_bytes = await image.read()
        user_image = base64.b64encode(image_bytes).decode("utf-8")

    # Parse weather data if provided
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
    """
    Trigger image history analysis for a user. Downloads images from GCS once and summarizes day-over-day changes.
    """
    result = await runner.analyze_images(user=request.user, max_images=request.max_images)
    return result


# Calendar Endpoints
class CalendarSaveRequest(BaseModel):
    email: Optional[str] = None
    session_id: Optional[str] = None
    events: List[Dict]


@app.post("/calendar/save")
async def save_calendar_events(request: CalendarSaveRequest):
    """
    Save calendar events to GCS backend storage.
    Supports both logged-in users (email) and anonymous users (session_id).
    """
    from agent.personalization.calendar_manager import calendar_manager

    # Use email if provided, otherwise session_id
    identifier = request.email if request.email else request.session_id

    if not identifier:
        return {"success": False, "message": "Either email or session_id must be provided"}

    success = calendar_manager.save_events(identifier=identifier, events=request.events)
    return {"success": success, "message": "Events saved successfully" if success else "Failed to save events"}


@app.get("/calendar/load/{identifier}")
async def load_calendar_events(identifier: str):
    """
    Load calendar events from GCS backend storage.
    Identifier can be either email or session_id.
    """
    from agent.personalization.calendar_manager import calendar_manager

    events = calendar_manager.load_events(identifier=identifier)
    return {"events": events}


# Skin Progress Photos Endpoints
@app.get("/skin-photos/{identifier}")
async def get_skin_photos(identifier: str, request: Request):
    """
    Get all skin progress photos for a user.
    Identifier can be either email or session_id.
    Returns photos sorted by date (oldest first).
    """
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email

    photos = []
    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier

    prefix = f"user_image/{identifier_clean}/"

    # Load notes from GCS
    notes_data = {}
    try:
        notes_blob = image_upload_handler.bucket.blob(f"{prefix}notes.json")
        if notes_blob.exists():
            import json

            notes_data = json.loads(notes_blob.download_as_text())
    except Exception as e:
        print(f"Error loading notes for {identifier}: {e}")

    try:
        blobs = [
            blob
            for blob in image_upload_handler.bucket.list_blobs(prefix=prefix)
            if not blob.name.endswith("/") and not blob.name.endswith("notes.json")
        ]
        blobs.sort(key=lambda b: b.time_created)

        # Get the base URL for the API
        base_url = str(request.base_url).rstrip("/")

        for blob in blobs:
            filename = blob.name.split("/")[-1]

            # Use proxy endpoint instead of signed URL
            # This works without private key
            proxy_url = f"{base_url}/skin-photos/{identifier}/image/{filename}"

            # Extract date from filename: username_YYYYMMDD_HHMMSS.ext
            # Need to find the date part (8 digits)
            parts = filename.replace(".jpg", "").replace(".png", "").split("_")
            date_str = None
            for part in parts:
                if len(part) == 8 and part.isdigit():
                    date_str = part
                    break

            if date_str:
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            else:
                formatted_date = blob.time_created.strftime("%Y-%m-%d")

            photos.append({"date": formatted_date, "imageUrl": proxy_url, "note": notes_data.get(formatted_date, "")})
    except Exception as e:
        print(f"Error fetching photos for {identifier}: {e}")

    return {"photos": photos}


@app.get("/skin-photos/{identifier}/image/{filename}")
async def get_photo_image(identifier: str, filename: str):
    """Proxy endpoint to serve images directly without signed URLs"""
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email

    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier
    blob_path = f"user_image/{identifier_clean}/{filename}"

    try:
        blob = image_upload_handler.bucket.blob(blob_path)
        if not blob.exists():
            return Response(content="Image not found", status_code=404)

        # Download image data
        image_data = blob.download_as_bytes()

        # Set content type based on file extension
        if filename.lower().endswith(".png"):
            media_type = "image/png"
        elif filename.lower().endswith(".webp"):
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"

        return Response(content=image_data, media_type=media_type)
    except Exception as e:
        print(f"Error serving image {blob_path}: {e}")
        return Response(content="Error loading image", status_code=500)


@app.post("/skin-photos/{identifier}/note")
async def update_photo_note(identifier: str, date: str = Form(...), note: str = Form(...)):
    """
    Update a note for a specific photo.
    Stores notes in GCS as JSON: user_image/{identifier}/notes.json
    """
    from agent.personalization.image_upload_handler import image_upload_handler
    from agent.personalization.user_profile_manager import sanitize_email
    import json

    identifier_clean = sanitize_email(identifier) if "@" in identifier else identifier
    notes_path = f"user_image/{identifier_clean}/notes.json"

    try:
        # Load existing notes
        blob = image_upload_handler.bucket.blob(notes_path)
        if blob.exists():
            notes_data = json.loads(blob.download_as_text())
        else:
            notes_data = {}

        # Update note for this date
        notes_data[date] = note

        # Save back to GCS
        blob.upload_from_string(json.dumps(notes_data), content_type="application/json")

        return {"success": True, "message": "Note saved"}
    except Exception as e:
        print(f"Error saving note for {identifier}: {e}")
        return {"success": False, "message": str(e)}


# Chat History Endpoints
@app.get("/chat-history/{email}")
async def get_chat_history(email: str, days: int = 7, limit: int = 100):
    """
    Get recent chat history for a logged-in user.
    Returns conversation logs from the past N days.
    """
    from agent.personalization.chat_logger import chat_logger

    conversations = chat_logger.get_recent_conversations(email=email, days=days, limit=limit)
    return {"conversations": conversations}


@app.get("/session/{session_id}/history", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str):
    """Retrieve conversation history for a session"""
    history = await runner.get_session_history(session_id)
    return SessionHistoryResponse(session_id=session_id, history=history)


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a specific session"""
    runner.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@app.get("/weather/fetch")
async def fetch_weather(lat: Optional[float] = None, lon: Optional[float] = None):
    """Proxy endpoint to fetch weather data from wttr.in API to avoid CORS issues."""
    import httpx

    url = (
        f"https://wttr.in/{lat},{lon}?format=j1"
        if lat is not None and lon is not None
        else "https://wttr.in/?format=j1"
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        print(f"Timeout fetching weather from {url}")
        raise
    except Exception as e:
        print(f"Error fetching weather: {e}")
        raise


@app.post("/weather/skincare-advice", response_model=WeatherSkincareResponse)
async def weather_skincare_advice(request: WeatherSkincareRequest):
    """
    Generate skincare advice based on weather conditions.

    This endpoint provides personalized skincare recommendations considering:
    - Temperature and humidity levels
    - UV index
    - Current weather conditions
    - User's location (optional)
    - Preferred language (en/zh)
    """
    # Generate weather-based skincare advice
    advice_text = generate_weather_advice(
        temperature=request.temperature,
        humidity=request.humidity,
        uv_index=request.uv_index,
        weather_condition=request.weather_condition,
        language=request.language,
    )

    return WeatherSkincareResponse(
        advice=advice_text, temperature=request.temperature, humidity=request.humidity, uv_index=request.uv_index
    )


# ========================================
# BigQuery Product & Ingredient Endpoints
# ========================================


class ProductSearchResponse(BaseModel):
    """Response model for product search"""

    products: List[Dict]
    count: int


class ProductIngredientsResponse(BaseModel):
    """Response model for product ingredients"""

    product: Dict
    ingredients: List[Dict]


@app.get("/api/products/search")
async def search_products(q: Optional[str] = None, limit: int = 10):
    """
    Search products by keyword (title or brand)

    Args:
        q: Search keyword (e.g., "niacinamide", "The Ordinary")
        limit: Maximum number of results (default: 10, max: 100)

    Returns:
        JSON with list of matching products

    Example:
        GET /api/products/search?q=niacinamide&limit=5

        Response:
        {
            "products": [
                {
                    "product_id": "12345",
                    "title": "Niacinamide 10% + Zinc 1%",
                    "brand": "The Ordinary",
                    "url": "https://www.ewg.org/...",
                    "category": "Facial Serum"
                }
            ],
            "count": 1
        }
    """
    # Validate search query
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
    """
    Get product details and all ingredients by product_id

    Args:
        product_id: Unique product identifier

    Returns:
        JSON with product info and ingredients list

    Example:
        GET /api/products/12345/ingredients

        Response:
        {
            "product": {
                "product_id": "12345",
                "title": "Peptide Serum",
                "brand": "Brand Name",
                "url": "https://...",
                "category": "Serum"
            },
            "ingredients": [
                {
                    "ingredient_id": "ing_001",
                    "name_original": "Water",
                    "name_normalized": "water",
                    "function": "solvent",
                    "risk_level": "low"
                }
            ]
        }
    """
    try:
        result = bigquery_service.get_product_ingredients_by_id(product_id)

        if not result:
            return Response(content=json.dumps({"error": "Product not found"}), status_code=404)

        return result
    except Exception as e:
        logger.error(f"Error fetching product ingredients: {e}")
        return Response(
            content=json.dumps({"error": "Failed to fetch product ingredients"}), status_code=500, media_type="application/json"
        )


@app.get("/api/products/ingredients")
async def get_product_ingredients_by_url(url: Optional[str] = None):
    """
    Get product details and all ingredients by product URL

    Args:
        url: Product URL from EWG database

    Returns:
        JSON with product info and ingredients list (same format as by ID)

    Example:
        GET /api/products/ingredients?url=https://www.ewg.org/skindeep/products/...
    """
    if not url or not url.strip():
        return Response(content=json.dumps({"error": "URL parameter is required"}), status_code=400, media_type="application/json")

    try:
        result = bigquery_service.get_product_ingredients_by_url(url.strip())

        if not result:
            return Response(content=json.dumps({"error": "Product not found"}), status_code=404, media_type="application/json")

        return result
    except Exception as e:
        logger.error(f"Error fetching product by URL: {e}")
        return Response(
            content=json.dumps({"error": "Failed to fetch product ingredients"}), status_code=500, media_type="application/json"
        )


@app.post("/api/ingredients/summary")
async def get_ingredients_summary(product_ids: List[str]):
    """
    TODO: Get ingredient summary across multiple products

    This endpoint will analyze multiple products used together
    (e.g., morning skincare routine with 3 products)

    Args:
        product_ids: List of product IDs to analyze

    Returns:
        Aggregated ingredient statistics

    Status: Coming soon
    """
    return Response(
        content=json.dumps({"error": "This endpoint is not yet implemented. Coming soon!"}),
        status_code=501,
        media_type="application/json",
    )


# ========================================
# Daily Skincare Routine Endpoints
# ========================================


class RoutineProduct(BaseModel):
    """Product in daily routine"""
    product_id: str
    product_name: str
    brand: str
    amount: str  # e.g., "2 drops", "1 pump"
    time: str  # "morning" or "evening"
    order: int  # Order of application


class SaveRoutineRequest(BaseModel):
    """Request to save daily routine"""
    user_identifier: str  # email or session_id
    date: str  # YYYY-MM-DD
    products: List[RoutineProduct]


class RoutineResponse(BaseModel):
    """Response with routine data"""
    success: bool
    message: Optional[str] = None
    data: Optional[Dict] = None


@app.post("/api/routines/save", response_model=RoutineResponse)
async def save_daily_routine(request: SaveRoutineRequest):
    """
    Save daily skincare routine

    Args:
        request: Routine data including user, date, and products

    Returns:
        Success status

    Example:
        POST /api/routines/save
        {
            "user_identifier": "user@example.com",
            "date": "2025-12-11",
            "products": [
                {
                    "product_id": "uuid",
                    "product_name": "Vitamin C Serum",
                    "brand": "The Ordinary",
                    "amount": "3 drops",
                    "time": "morning",
                    "order": 1
                }
            ]
        }
    """
    try:
        products_data = [p.model_dump() for p in request.products]
        success = daily_routine_manager.save_routine(
            user_identifier=request.user_identifier,
            date=request.date,
            products=products_data
        )

        if success:
            return RoutineResponse(
                success=True,
                message="Routine saved successfully"
            )
        else:
            return RoutineResponse(
                success=False,
                message="Failed to save routine"
            )

    except Exception as e:
        logger.error(f"Error saving routine: {e}")
        return RoutineResponse(
            success=False,
            message=f"Error: {str(e)}"
        )


@app.get("/api/routines/{user_identifier}/range")
async def get_routines_range(
    user_identifier: str,
    start_date: str,
    end_date: str
):
    """
    Get routines for a date range

    Args:
        user_identifier: Email or session_id
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format

    Returns:
        List of routines

    Example:
        GET /api/routines/user@example.com/range?start_date=2025-12-01&end_date=2025-12-11
    """
    try:
        routines = daily_routine_manager.get_routines_range(
            user_identifier=user_identifier,
            start_date=start_date,
            end_date=end_date
        )

        return {"routines": routines, "count": len(routines)}

    except Exception as e:
        logger.error(f"Error getting routines range: {e}")
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=500,
            media_type="application/json"
        )
@app.get("/api/routines/{user_identifier}/{date}")
async def get_daily_routine(user_identifier: str, date: str):
    """
    Get routine for a specific date

    Args:
        user_identifier: Email or session_id
        date: Date in YYYY-MM-DD format

    Returns:
        Routine data or 404 if not found

    Example:
        GET /api/routines/user@example.com/2025-12-11
    """
    try:
        routine = daily_routine_manager.get_routine(user_identifier, date)

        if routine:
            return routine
        else:
            return Response(
                content=json.dumps({"error": "Routine not found"}),
                status_code=404,
                media_type="application/json"
            )

    except Exception as e:
        logger.error(f"Error getting routine: {e}")
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=500,
            media_type="application/json"
        )




@app.delete("/api/routines/{user_identifier}/{date}")
async def delete_daily_routine(user_identifier: str, date: str):
    """
    Delete routine for a specific date

    Args:
        user_identifier: Email or session_id
        date: Date in YYYY-MM-DD format

    Returns:
        Success status
    """
    try:
        success = daily_routine_manager.delete_routine(user_identifier, date)

        if success:
            return {"success": True, "message": "Routine deleted successfully"}
        else:
            return Response(
                content=json.dumps({"error": "Routine not found"}),
                status_code=404,
                media_type="application/json"
            )

    except Exception as e:
        logger.error(f"Error deleting routine: {e}")
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=500,
            media_type="application/json"
        )


@app.get("/api/routines/{user_identifier}/{date}/ingredients")
async def get_routine_ingredients_summary(user_identifier: str, date: str):
    """
    Get ingredient summary for a specific day's routine

    This endpoint:
    1. Gets the routine for the specified date
    2. Fetches ingredient data for each product from BigQuery
    3. Aggregates ingredients across all products

    Args:
        user_identifier: Email or session_id
        date: Date in YYYY-MM-DD format

    Returns:
        Ingredient summary with counts and product names

    Example:
        GET /api/routines/user@example.com/2025-12-11/ingredients

        Response:
        {
            "date": "2025-12-11",
            "total_products": 3,
            "ingredients": [
                {
                    "name": "hyaluronic acid",
                    "count": 2,
                    "products": ["Serum A", "Moisturizer B"]
                }
            ]
        }
    """
    try:
        # Get routine
        routine = daily_routine_manager.get_routine(user_identifier, date)

        if not routine:
            return Response(
                content=json.dumps({"error": "Routine not found"}),
                status_code=404,
                media_type="application/json"
            )

        products = routine.get("products", [])

        # Fetch ingredients for each product from BigQuery
        product_ingredients_map = {}

        for product in products:
            product_id = product.get("product_id")
            if product_id:
                product_data = bigquery_service.get_product_ingredients_by_id(product_id)
                if product_data:
                    product_ingredients_map[product_id] = product_data.get("ingredients", [])

        # Get ingredient summary
        summary = daily_routine_manager.get_ingredient_summary(
            user_identifier=user_identifier,
            date=date,
            product_ingredients_map=product_ingredients_map
        )

        # Add risk classification to ingredients
        if "ingredients" in summary:
            summary["ingredients"] = ingredient_risk_classifier.sort_by_risk(summary["ingredients"])

        return summary

    except Exception as e:
        logger.error(f"Error getting routine ingredients: {e}")
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=500,
            media_type="application/json"
        )


@app.get("/api/ingredient-insights/{user_identifier}")
async def get_ingredient_insights(
    user_identifier: str,
    days: int = 7,
    language: str = "en"
):
    """
    Get AI-powered ingredient insights based on usage patterns

    Args:
        user_identifier: Email or session_id
        days: Number of days to analyze (7, 14, or 30)
        language: Response language (en, zh, es, vi)

    Returns:
        AI-generated insights with recommendations

    Example:
        GET /api/ingredient-insights/user@example.com?days=7&language=en
    """
    try:
        from datetime import datetime, timedelta

        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)

        # Get routines for the range
        routines = daily_routine_manager.get_routines_range(
            user_identifier=user_identifier,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        if not routines:
            return Response(
                content=json.dumps({"error": "No routine data found"}),
                status_code=404,
                media_type="application/json"
            )

        # Get ingredient summaries for each day
        trends_data = []
        for routine in routines:
            # Get product ingredients
            product_ingredients_map = {}
            for product in routine.get("products", []):
                product_id = product.get("product_id")
                if product_id:
                    try:
                        ingredients = bigquery_service.get_product_ingredients_by_id(product_id)
                        if ingredients:
                            product_ingredients_map[product_id] = ingredients.get("ingredients", [])
                    except Exception as e:
                        logger.warning(f"Could not get ingredients for product {product_id}: {e}")

            # Get summary
            summary = daily_routine_manager.get_ingredient_summary(
                user_identifier=user_identifier,
                date=routine["date"],
                product_ingredients_map=product_ingredients_map
            )
            trends_data.append(summary)

        # Calculate statistics
        statistics = ingredient_analyzer.calculate_ingredient_statistics(trends_data)

        # Generate insights
        insights = ingredient_analyzer.generate_insights(statistics, language)

        return insights

    except Exception as e:
        logger.error(f"Error generating ingredient insights: {e}", exc_info=True)
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=500,
            media_type="application/json"
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
