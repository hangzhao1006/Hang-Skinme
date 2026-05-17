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
        """
        Format agent data into a prompt for the chat model to present conversationally with Markdown.

        Args:
            agent_result: Raw data from agents (analysis or recommendations)
            user_message: Original user message for context

        Returns:
            Formatted prompt for chat model
        """
        agent_type = agent_result.get("agent_type")

        if agent_type == "analysis":
            # Skin analysis data
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
3. Use Markdown to format the ingredient lists nicely (**bold** for headings,
bullet lists with - for items, *italics* for ingredient names)
4. If weather context exists, incorporate it naturally
5. End with a soft statement: "Let me know if you'd like me to recommend
specific products with these ingredients."

Be conversational and informative (2-3 paragraphs). Use Markdown for structure
but keep it natural."""

        elif agent_type == "recommendation":
            # Product recommendations
            # analysis = agent_result.get("analysis", {})
            condition = agent_result.get("condition", "your skin concern")
            primary = agent_result.get("primary_ingredients", [])
            products = agent_result.get("products", [])
            stats = agent_result.get("search_stats", {})

            # Check if we're using fallback products (no exact ingredient matches found)
            is_fallback = stats.get("total_scored", 0) == 0 and len(products) > 0

            products_info = []
            for p in products[:3]:  # Top 3 products
                products_info.append(
                    {
                        "title": p.get("title"),
                        "brand": p.get("brand"),
                        "category": p.get("category"),
                        "ingredients_snippet": p.get("ingredients", "")[:200],
                        "buy_links": p.get("buy_links", []),
                    }
                )

            if is_fallback:
                prompt = f"""The user asked: "{user_message}"

I've found general skincare product recommendations:

CONDITION: {condition}
KEY INGREDIENTS NEEDED: {', '.join(primary) if primary else 'None'}
NOTE: No exact ingredient matches found, so I'm recommending gentle, general skincare basics (cleanser, moisturizer, sunscreen)

PRODUCTS FOUND: {len(products)} general products

TOP PRODUCTS:
{chr(10).join([f"- {p['title']} by {p['brand']} | Links: {', '.join(p['buy_links'][:1])}" for p in products_info])}

Please create a conversational response with Markdown formatting:
1. Acknowledge that while specific ingredient matches weren't found, these
general products are good basics
2. Present 2-3 recommended products using numbered lists (1., 2., 3.) with:
   - Product name and brand in **bold**
   - Category (cleanser/moisturizer/sunscreen)
   - Include buy link
3. Explain that for {condition}, they should look for products
with {', '.join(primary[:2]) if primary else 'appropriate ingredients'}
4. Suggest they can try these basics while looking for more specialized products
5. Keep it warm and conversational (2-3 paragraphs total)

Use Markdown for clean formatting but maintain a friendly, expert tone."""
            else:
                prompt = f"""The user asked: "{user_message}"

I've found product recommendations based on their skin analysis:

CONDITION: {condition}
KEY INGREDIENTS NEEDED: {', '.join(primary) if primary else 'None'}
PRODUCTS FOUND: {len(products)} products (searched {stats.get('total_scored', 0)} total)

TOP PRODUCTS:
{chr(10).join([f"- {p['title']} by {p['brand']} | Links: {', '.join(p['buy_links'][:1])}" for p in products_info])}

Please create a conversational response with Markdown formatting:
1. Briefly explain what makes these products good for their condition
2. Present 2-3 recommended products using numbered lists (1., 2., 3.) with:
   - Product name and brand in **bold**
   - Why it's helpful (which key ingredients it contains)
   - Include buy link
3. Suggest a simple routine (morning/evening)
4. Keep it warm and conversational (2-3 paragraphs total)

Use Markdown for clean formatting but maintain a friendly, expert tone."""

        elif agent_type == "image_history":
            # Image history analysis (already has formatted message)
            message = agent_result.get("message", "")
            prompt = f"""The user asked: "{user_message}"

Image history analysis results:
{message}

Please present this information conversationally with Markdown formatting
where appropriate. Keep it warm and professional."""

        else:
            # Fallback
            prompt = f"""The user asked: "{user_message}"

Agent returned data: {str(agent_result)}

Please respond to the user conversationally."""

        return prompt

    def _get_chat(self, session_id: str):
        """Get or create chat session with auto-managed history."""
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = client.chats.create(
                model=GEMINI_MODEL,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are a helpful skincare expert assistant. "
                        "Help with skin analysis, product recommendations, and answer questions about "
                        "skincare and related topics.\n\n"
                        "LANGUAGE RULE (highest priority):\n"
                        "- ALWAYS reply in the SAME language the user wrote in.\n"
                        "- If the user writes in Chinese (中文), reply entirely in Chinese.\n"
                        "- If the user writes in English, reply in English.\n"
                        "- Never switch languages mid-conversation unless the user does first.\n\n"
                        "CRITICAL CONTEXT USAGE:\n"
                        "- ONLY use information explicitly provided in '=== SYSTEM CONTEXT ===' sections.\n"
                        "- If you see '=== SYSTEM CONTEXT ===' sections, that information is FACTUAL "
                        "and CURRENT.\n"
                        "- ONLY reference calendar events, allergies, or previous conversations if they "
                        "are EXPLICITLY provided in the context.\n"
                        "- NEVER make up or assume previous conversations, user preferences, or concerns "
                        "that aren't in the context.\n"
                        "- If no context is provided, treat the user as a first-time visitor.\n"
                        "- Examples: outdoor events→sun protection, makeup events→primer/setting, "
                        "spa→minimal products, etc.\n"
                        "- Use weather data, user allergies, and profile info ONLY if provided in "
                        "context.\n\n"
                        "SAFETY RULES:\n"
                        "- CRITICAL: Retinoids/AHAs/BHAs increase sun sensitivity - always recommend "
                        "SPF 30+.\n"
                        "- Respect all allergies and sensitivities in context.\n\n"
                        "RESPONSE STYLE:\n"
                        "- Be conversational, warm, and informative. Write 2-3 paragraphs with useful "
                        "details.\n"
                        "- When giving advice, explain WHY ingredients work (e.g., 'hyaluronic acid "
                        "attracts moisture').\n"
                        "- Include relevant context about how products work and their benefits.\n"
                        "- End with soft suggestions rather than direct questions (e.g., 'Let me know "
                        "if...' instead of 'Would you like...').\n"
                        "- Use simple language, avoid excessive medical jargon.\n\n"
                        "FORMATTING WITH MARKDOWN:\n"
                        "- Use Markdown for clean, professional formatting when presenting structured "
                        "information.\n"
                        "- Use **bold** for headings and emphasis.\n"
                        "- Use bullet lists with - or * for ingredient lists.\n"
                        "- Use numbered lists (1., 2., 3.) for product recommendations or step-by-step "
                        "routines.\n"
                        "- Use *italics* for ingredient names or product categories.\n"
                        "- Keep formatting clean and readable - don't overuse it.\n"
                        "- Example: '**Key Ingredients:**\\n- *niacinamide* - reduces inflammation\\n- "
                        "*hyaluronic acid* - hydrates skin'\n\n"
                        "IMPORTANT: When you receive agent data (skin analysis or product "
                        "recommendations), format it conversationally with Markdown, explaining the "
                        "reasoning naturally.\n\n"
                        "IMAGE RULES:\n"
                        "- NEVER say you received, saw, or analyzed an image unless the prompt explicitly "
                        "contains 'IMAGE ANALYSIS RESULT' or 'image_analysis' data.\n"
                        "- If no image data is present, treat the conversation as text-only.\n"
                        "- Do NOT reference photos, pictures, or skin images the user hasn't uploaded."
                    ),
                    temperature=0.3,
                ),
            )
        return self.chat_sessions[session_id]

    async def run(
        self,
        user_message: str,
        session_id: str = None,
        user_image: str = None,
        email: Optional[str] = None,
        weather_data: Optional[dict] = None,
    ) -> dict:
        """
        Run agent and return complete response.
        Chat history is automatically maintained by Gemini.

        Args:
            user_message: User's text message
            session_id: Optional session ID for conversation history
            user_image: Optional base64 encoded image for skin analysis
            email: Optional user email for personalization
            weather_data: Optional weather data for context (temperature, humidity, uv_index, etc.)
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        try:
            # Upload image to GCS if provided
            if user_image and email:
                try:
                    image_format = "jpg"
                    image_upload_handler.upload_image(email, user_image, image_format)
                    print(f"✅ Image uploaded to GCS for user: {email}")
                except Exception as e:
                    print(f"⚠️ Failed to upload image to GCS: {e}")

            # Get smart context (includes weather and calendar for both logged-in and anonymous users)
            user_context = ""
            if email or session_id:
                # Get smart context for logged-in users (with email) or anonymous users (with session_id)
                user_context = user_context_retriever.get_smart_context(
                    email=email,
                    user_message=user_message,
                    has_image=bool(user_image),
                    weather_data=weather_data,
                    session_id=session_id if not email else None,
                )

            chat = self._get_chat(session_id)

            # Prepend context to message for personalization
            contextualized_message = user_message
            if user_context:
                contextualized_message = user_context + "\n\nUser query: " + user_message
                print(f"Contextualized message length: {len(contextualized_message)}")
                print(f"Context preview: {user_context[:200]}...")  # Debug: show first 200 chars of context
            else:
                print("No context provided for this message (treating as first-time user)")

            intent = classify_intent_fast(user_message, has_image=bool(user_image))

            # Determine if we need agents based on intent
            needs_agents = intent != "none"
            print(f"⚡ Routing decision: intent={intent}, needs_agents={needs_agents}")

            if needs_agents:
                result = route_and_process(contextualized_message, user_image, intent)
                agent_type = result.get("agent_type")

                if agent_type is None:
                    response = chat.send_message(contextualized_message)
                    response_text = response.text
                else:
                    agent_data_prompt = self._format_agent_data_for_chat(result, user_message)
                    response = chat.send_message(agent_data_prompt)
                    response_text = response.text

                # Log conversation to GCS if email provided
                if email:
                    chat_logger.log_conversation_turn(
                        email=email,
                        user_message=user_message,
                        assistant_response=response_text,
                        image_uploaded=bool(user_image),
                        analysis_result=result if user_image else None,
                    )

                    # Extract and update profile information from conversation
                    profile_extractor.extract_from_conversation(
                        email=email,
                        user_message=user_message,
                        assistant_response=response_text,
                        analysis_result=result if user_image else None,
                    )

                return {"response": response_text, "session_id": session_id, "result": result}

            response = chat.send_message(contextualized_message)
            response_text = response.text

            # Log conversation to GCS if email provided
            if email:
                chat_logger.log_conversation_turn(
                    email=email, user_message=user_message, assistant_response=response_text
                )

                # Extract and update profile information from conversation
                profile_extractor.extract_from_conversation(
                    email=email, user_message=user_message, assistant_response=response_text, analysis_result=None
                )

            return {
                "response": response_text,
                "session_id": session_id,
            }

        except Exception as e:
            return {"response": f"Error processing request: {str(e)}", "session_id": session_id, "error": str(e)}

    async def run_stream(
        self,
        user_message: str,
        session_id: str = None,
        user_image: str = None,
        email: Optional[str] = None,
        weather_data: Optional[dict] = None,
    ):
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
                    email=email,
                    user_message=user_message,
                    has_image=bool(user_image),
                    weather_data=weather_data,
                    session_id=session_id if not email else None,
                )

            chat = self._get_chat(session_id)

            contextualized_message = user_message
            if user_context:
                contextualized_message = user_context + "\n\nUser query: " + user_message

            intent = classify_intent_fast(user_message, has_image=bool(user_image))
            needs_agents = intent != "none"
            print(f"⚡ Stream routing: intent={intent}")

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
                chat_logger.log_conversation_turn(
                    email=email,
                    user_message=user_message,
                    assistant_response=full_text,
                    image_uploaded=bool(user_image),
                    analysis_result=result if user_image else None,
                )
                profile_extractor.extract_from_conversation(
                    email=email,
                    user_message=user_message,
                    assistant_response=full_text,
                    analysis_result=result if user_image else None,
                )

        except Exception as e:
            print(f"❌ Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    async def get_session_history(self, session_id: str) -> list:
        """Retrieve conversation history for a session"""
        if session_id not in self.chat_sessions:
            return []

        chat = self.chat_sessions[session_id]
        history = chat.get_history()
        return [{"role": msg.role, "text": msg.parts[0].text if msg.parts else ""} for msg in history]

    def clear_session(self, session_id: str):
        """Clear a specific session"""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]

    async def analyze_images(self, user: str, max_images: int | None = None) -> dict:
        """
        Download and analyze a user's image history from GCS.
        """
        result = analyze_user_image_history(user=user, limit=max_images)
        return result


# Global runner instance
runner = AgentRunner()
