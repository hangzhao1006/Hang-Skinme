"""
Ingredient Analysis Agent
Provides intelligent insights and recommendations based on ingredient usage patterns
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import google.auth

logger = logging.getLogger(__name__)

# Initialize Vertex AI
credentials, project_id = google.auth.default()
vertexai.init(project=project_id, location="us-east1")

# Gemini model for analysis
model = GenerativeModel("gemini-2.0-flash-exp")


class IngredientAnalyzer:
    """
    Analyzes skincare ingredient usage patterns and provides personalized insights
    """

    def __init__(self):
        logger.info("IngredientAnalyzer initialized")

    def calculate_ingredient_statistics(
        self,
        trends_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate structured statistics from raw ingredient trends data

        Args:
            trends_data: List of daily ingredient summaries

        Returns:
            Structured statistics for LLM analysis
        """
        if not trends_data:
            return {
                "total_days": 0,
                "total_products": 0,
                "unique_ingredients": 0,
                "top_ingredients": [],
                "usage_patterns": {},
                "date_range": {}
            }

        # Aggregate ingredient data
        ingredient_stats = {}
        total_products = 0
        dates = []

        for day_data in trends_data:
            dates.append(day_data.get("date", ""))
            total_products += day_data.get("total_products", 0)

            for ing in day_data.get("ingredients", []):
                name = ing.get("name", "").lower()
                count = ing.get("count", 0)
                products = ing.get("products", [])

                if name not in ingredient_stats:
                    ingredient_stats[name] = {
                        "name": name,
                        "total_count": 0,
                        "days_used": 0,
                        "products": set(),
                        "daily_usage": []
                    }

                ingredient_stats[name]["total_count"] += count
                ingredient_stats[name]["days_used"] += 1
                ingredient_stats[name]["products"].update(products)
                ingredient_stats[name]["daily_usage"].append({
                    "date": day_data.get("date"),
                    "count": count
                })

        # Convert to list and sort
        ingredients_list = []
        for ing_name, stats in ingredient_stats.items():
            ingredients_list.append({
                "name": ing_name,
                "total_count": stats["total_count"],
                "days_used": stats["days_used"],
                "product_count": len(stats["products"]),
                "products": list(stats["products"]),
                "avg_daily_count": stats["total_count"] / stats["days_used"],
                "usage_frequency": stats["days_used"] / len(trends_data)  # % of days used
            })

        # Sort by total count
        ingredients_list.sort(key=lambda x: x["total_count"], reverse=True)

        # Categorize ingredients by known patterns
        categorized = self._categorize_ingredients(ingredients_list)

        return {
            "total_days": len(trends_data),
            "total_products": total_products,
            "avg_products_per_day": total_products / len(trends_data) if trends_data else 0,
            "unique_ingredients": len(ingredients_list),
            "date_range": {
                "start": min(dates) if dates else "",
                "end": max(dates) if dates else ""
            },
            "top_ingredients": ingredients_list[:20],  # Top 20
            "categorized_ingredients": categorized,
            "usage_patterns": self._analyze_usage_patterns(ingredients_list, len(trends_data))
        }

    def _categorize_ingredients(self, ingredients: List[Dict]) -> Dict[str, List[str]]:
        """
        Categorize ingredients by type (basic heuristics)
        """
        categories = {
            "actives": [],
            "moisturizers": [],
            "preservatives": [],
            "solvents": [],
            "acids": [],
            "antioxidants": []
        }

        # Known ingredient patterns (simplified - in production use your BigQuery data)
        active_keywords = ["retinol", "niacinamide", "vitamin c", "ascorbic", "peptide"]
        moisturizer_keywords = ["hyaluronic", "glycerin", "ceramide", "squalane", "urea"]
        acid_keywords = ["acid", "aha", "bha", "salicylic", "glycolic", "lactic"]
        antioxidant_keywords = ["tocopherol", "vitamin e", "green tea", "resveratrol"]
        preservative_keywords = ["phenoxyethanol", "methylparaben", "ethylparaben"]
        solvent_keywords = ["water", "aqua", "alcohol", "butylene glycol"]

        for ing in ingredients[:30]:  # Top 30 ingredients
            name = ing["name"].lower()

            if any(kw in name for kw in active_keywords):
                categories["actives"].append(ing["name"])
            elif any(kw in name for kw in acid_keywords):
                categories["acids"].append(ing["name"])
            elif any(kw in name for kw in moisturizer_keywords):
                categories["moisturizers"].append(ing["name"])
            elif any(kw in name for kw in antioxidant_keywords):
                categories["antioxidants"].append(ing["name"])
            elif any(kw in name for kw in preservative_keywords):
                categories["preservatives"].append(ing["name"])
            elif any(kw in name for kw in solvent_keywords):
                categories["solvents"].append(ing["name"])

        return categories

    def _analyze_usage_patterns(self, ingredients: List[Dict], total_days: int) -> Dict[str, Any]:
        """
        Analyze ingredient usage patterns
        """
        high_frequency = [
            ing for ing in ingredients
            if ing["usage_frequency"] > 0.8  # Used in >80% of days
        ]

        occasional_use = [
            ing for ing in ingredients
            if 0.3 < ing["usage_frequency"] <= 0.5  # Used 30-50% of days
        ]

        multi_product_ingredients = [
            ing for ing in ingredients
            if ing["product_count"] >= 2  # Appears in 2+ products
        ]

        return {
            "high_frequency_ingredients": [ing["name"] for ing in high_frequency[:5]],
            "occasional_ingredients": [ing["name"] for ing in occasional_use[:5]],
            "overlapping_ingredients": [ing["name"] for ing in multi_product_ingredients[:5]],
            "high_frequency_count": len(high_frequency),
            "overlapping_count": len(multi_product_ingredients)
        }

    def generate_insights(
        self,
        statistics: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Generate AI-powered insights using Gemini

        Args:
            statistics: Structured ingredient statistics
            language: User language (en, zh, es, vi)

        Returns:
            Insights with summary, patterns, recommendations, and follow-up questions
        """
        try:
            # Build prompt
            prompt = self._build_analysis_prompt(statistics, language)

            # Call Gemini
            response = model.generate_content(prompt)

            # Parse response
            insights = self._parse_llm_response(response.text)

            # Add metadata
            insights["generated_at"] = datetime.now().isoformat()
            insights["language"] = language
            insights["statistics"] = statistics

            return insights

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return self._get_fallback_insights(statistics, language)

    def _build_analysis_prompt(self, stats: Dict[str, Any], language: str) -> str:
        """
        Build the LLM prompt for ingredient analysis
        """
        lang_instructions = {
            "en": "English",
            "zh": "Simplified Chinese (简体中文)",
            "es": "Spanish",
            "vi": "Vietnamese"
        }

        output_lang = lang_instructions.get(language, "English")

        prompt = f"""You are a gentle, knowledgeable skincare ingredient coach. Your role is to help users understand their skincare routine patterns without scaring them.

IMPORTANT: Respond ONLY in {output_lang}. All sections must be in {output_lang}.

Here's the user's skincare ingredient data for the past {stats['total_days']} days:

**Summary:**
- Total days tracked: {stats['total_days']}
- Average products per day: {stats['avg_products_per_day']:.1f}
- Unique ingredients used: {stats['unique_ingredients']}

**Top 10 Most Used Ingredients:**
{self._format_top_ingredients(stats['top_ingredients'][:10])}

**Ingredient Categories:**
- Active ingredients: {', '.join(stats['categorized_ingredients']['actives'][:5]) or 'None detected'}
- Acids: {', '.join(stats['categorized_ingredients']['acids'][:5]) or 'None detected'}
- Moisturizers: {', '.join(stats['categorized_ingredients']['moisturizers'][:5]) or 'None detected'}

**Usage Patterns:**
- High-frequency ingredients (used >80% of days): {', '.join(stats['usage_patterns']['high_frequency_ingredients']) or 'None'}
- Ingredients appearing in multiple products: {', '.join(stats['usage_patterns']['overlapping_ingredients'][:3]) or 'None'}

Please provide a JSON response with the following structure:
{{
  "tldr": "1-2 sentence summary of the routine (gentle, encouraging tone)",
  "patterns": [
    "Pattern observation 1 (what ingredients they're using most)",
    "Pattern observation 2 (what this suggests about their routine style)",
    "Pattern observation 3 (any notable overlaps or gaps)"
  ],
  "insights": [
    "Insight 1 (positive observation)",
    "Insight 2 (gentle note about potential concerns, if any)",
    "Insight 3 (opportunity for optimization)"
  ],
  "recommendations": [
    "Actionable suggestion 1 (specific and gentle)",
    "Actionable suggestion 2 (focused on routine structure)",
    "Actionable suggestion 3 (optional: about timing or layering)"
  ],
  "followup_questions": [
    "Question 1 that user might want to ask",
    "Question 2 that user might want to ask",
    "Question 3 that user might want to ask"
  ],
  "overall_assessment": "positive/balanced/needs_attention"
}}

Guidelines:
1. Be warm and encouraging, not clinical or scary
2. Use "you might consider" instead of "you must"
3. Focus on patterns, not individual ingredients (unless critical)
4. If high-risk ingredients are used frequently, mention gently
5. Acknowledge what they're doing well before suggesting improvements
6. Keep language simple and jargon-free
7. IMPORTANT: All text must be in {output_lang}

Return ONLY valid JSON, no markdown formatting.
"""

        return prompt

    def _format_top_ingredients(self, ingredients: List[Dict]) -> str:
        """Format top ingredients for prompt"""
        lines = []
        for i, ing in enumerate(ingredients, 1):
            lines.append(
                f"{i}. {ing['name']} - used {ing['days_used']}/{ing.get('days_used', 0)} days, "
                f"appears in {ing['product_count']} products"
            )
        return "\n".join(lines)

    def _parse_llm_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse LLM JSON response
        """
        try:
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]

            parsed = json.loads(cleaned)
            return parsed
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            logger.error(f"Response text: {response_text}")
            raise

    def _get_fallback_insights(self, stats: Dict[str, Any], language: str) -> Dict[str, Any]:
        """
        Fallback insights if LLM fails
        """
        fallback = {
            "en": {
                "tldr": f"You've been tracking {stats['total_days']} days with an average of {stats['avg_products_per_day']:.1f} products per day.",
                "patterns": [
                    f"You're using {stats['unique_ingredients']} different ingredients across your routine.",
                    "Your routine appears to be consistent across the tracked period."
                ],
                "insights": [
                    "You have good product variety in your routine.",
                    "Continue tracking to see longer-term patterns."
                ],
                "recommendations": [
                    "Keep tracking your routine for more personalized insights.",
                    "Consider noting any skin reactions alongside product usage."
                ],
                "followup_questions": [
                    "What ingredients should I look out for?",
                    "Is my routine too complicated?",
                    "How can I simplify my skincare?"
                ],
                "overall_assessment": "balanced"
            },
            "zh": {
                "tldr": f"你已经记录了 {stats['total_days']} 天，平均每天使用 {stats['avg_products_per_day']:.1f} 个产品。",
                "patterns": [
                    f"你的护肤流程中使用了 {stats['unique_ingredients']} 种不同的成分。",
                    "你的护肤习惯在追踪期间比较稳定。"
                ],
                "insights": [
                    "你的产品种类比较丰富。",
                    "继续追踪可以看到更长期的趋势。"
                ],
                "recommendations": [
                    "继续记录护肤流程以获得更个性化的建议。",
                    "可以考虑记录皮肤反应来配合产品使用。"
                ],
                "followup_questions": [
                    "我需要注意哪些成分？",
                    "我的护肤流程是不是太复杂了？",
                    "如何简化我的护肤步骤？"
                ],
                "overall_assessment": "balanced"
            }
        }

        return fallback.get(language, fallback["en"])


# Singleton instance
ingredient_analyzer = IngredientAnalyzer()
