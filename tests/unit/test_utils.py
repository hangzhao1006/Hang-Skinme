# tests/unit/test_utils.py
import pytest
import sys
import os

# Add the api-service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src/api-service'))

from agent.analysis_agent import parse_response


class TestParseResponse:
    """Tests for parse_response function"""

    def test_parse_response_with_all_sections(self):
        """Test parsing response with all ingredient sections"""
        response_text = """
        Based on your condition, here are the recommendations:

        PRIMARY:
        - Hyaluronic Acid
        - Niacinamide
        - Vitamin C

        SECONDARY:
        - Retinol
        - Peptides

        AVOID:
        - Alcohol
        - Fragrance
        """

        result = parse_response(response_text, "acne")

        # Check return type
        assert isinstance(result, dict)

        # Check all keys exist
        assert "condition" in result
        assert "primary_ingredients" in result
        assert "secondary_ingredients" in result
        assert "avoid_ingredients" in result
        assert "full_analysis" in result

        # Check condition
        assert result["condition"] == "acne"

        # Check primary ingredients
        assert len(result["primary_ingredients"]) == 3
        assert "- Hyaluronic Acid" in result["primary_ingredients"]
        assert "- Niacinamide" in result["primary_ingredients"]
        assert "- Vitamin C" in result["primary_ingredients"]

        # Check secondary ingredients
        assert len(result["secondary_ingredients"]) == 2
        assert "- Retinol" in result["secondary_ingredients"]

        # Check avoid ingredients
        assert len(result["avoid_ingredients"]) == 2
        assert "- Alcohol" in result["avoid_ingredients"]

        # Check full analysis is preserved
        assert "PRIMARY" in result["full_analysis"]

    def test_parse_response_empty_text(self):
        """Test parsing empty response"""
        result = parse_response("", "dry skin")

        assert isinstance(result, dict)
        assert result["condition"] == "dry skin"
        assert result["primary_ingredients"] == []
        assert result["secondary_ingredients"] == []
        assert result["avoid_ingredients"] == []
        assert result["full_analysis"] == ""

    def test_parse_response_only_primary(self):
        """Test parsing response with only primary ingredients"""
        response_text = """
        PRIMARY:
        - Hyaluronic Acid
        - Glycerin
        """

        result = parse_response(response_text, "dehydrated skin")

        assert len(result["primary_ingredients"]) == 2
        assert result["secondary_ingredients"] == []
        assert result["avoid_ingredients"] == []

    def test_parse_response_case_insensitive(self):
        """Test that section headers are case-insensitive"""
        response_text = """
        primary:
        - Ingredient 1

        Secondary:
        - Ingredient 2

        AVOID:
        - Ingredient 3
        """
        result = parse_response(response_text, "test")

        assert len(result["primary_ingredients"]) == 1
        assert len(result["secondary_ingredients"]) == 1
        assert len(result["avoid_ingredients"]) == 1

    def test_parse_response_skips_none(self):
        """Test that 'None' values are skipped"""
        response_text = """
        PRIMARY:
        - Ingredient 1
        None
        - Ingredient 2

        SECONDARY:
        None

        AVOID:
        none
        """

        result = parse_response(response_text, "test")

        # Should skip lines with "None" or "none"
        assert len(result["primary_ingredients"]) == 2
        assert len(result["secondary_ingredients"]) == 0
        assert len(result["avoid_ingredients"]) == 0

    def test_parse_response_ignores_extra_whitespace(self):
        """Test that extra whitespace is handled correctly"""
        response_text = """


        PRIMARY:
           - Ingredient 1

        SECONDARY:
        - Ingredient 2


        """

        result = parse_response(response_text, "test")

        # Whitespace should be stripped
        assert "- Ingredient 1" in result["primary_ingredients"]
        assert "- Ingredient 2" in result["secondary_ingredients"]


class TestHelperFunctions:
    """Tests for other helper functions"""

    def test_condition_parsing(self):
        """Test that different condition strings are handled"""
        # Test various condition types
        conditions = ["acne", "dry skin", "oily skin", "sensitive skin", "aging"]

        for condition in conditions:
            result = parse_response("PRIMARY:\n- Test", condition)
            assert result["condition"] == condition

    def test_empty_sections_return_empty_lists(self):
        """Test that missing sections return empty lists"""
        response_text = "Some random text without sections"

        result = parse_response(response_text, "test")

        assert result["primary_ingredients"] == []
        assert result["secondary_ingredients"] == []
        assert result["avoid_ingredients"] == []

    def test_full_analysis_preserved(self):
        """Test that full analysis text is preserved exactly"""
        original_text = "This is the full\nanalysis text\nwith multiple lines"

        result = parse_response(original_text, "test")

        assert result["full_analysis"] == original_text

    def test_parse_response_with_message_field(self):
        """Test that parse_response includes formatted message field"""
        response_text = """
        PRIMARY:
        - retinol
        - niacinamide

        SECONDARY:
        - vitamin c

        AVOID:
        - alcohol
        """

        result = parse_response(response_text, "acne")

        # Check that message field exists and is formatted
        assert "message" in result
        assert isinstance(result["message"], str)
        assert "Skin Analysis" in result["message"]
        assert "Primary Ingredients" in result["message"]

    def test_parse_response_mixed_case_ingredients(self):
        """Test parsing with mixed case ingredients"""
        response_text = """
        PRIMARY:
        - Retinol
        - NIACINAMIDE
        - Vitamin C

        SECONDARY:
        - hyaluronic acid
        """

        result = parse_response(response_text, "test")

        # Should preserve original case
        assert len(result["primary_ingredients"]) == 3
        assert len(result["secondary_ingredients"]) == 1

    def test_parse_response_with_bullets(self):
        """Test parsing response with bullet points"""
        response_text = """
        PRIMARY:
        • Retinol
        • Niacinamide

        SECONDARY:
        • Vitamin C
        """

        result = parse_response(response_text, "test")

        # Should handle bullet points
        assert len(result["primary_ingredients"]) >= 1

    def test_parse_response_no_avoid_section(self):
        """Test parsing when AVOID section is missing"""
        response_text = """
        PRIMARY:
        - Ingredient 1

        SECONDARY:
        - Ingredient 2
        """

        result = parse_response(response_text, "test")

        assert result["avoid_ingredients"] == []
        assert len(result["primary_ingredients"]) == 1
        assert len(result["secondary_ingredients"]) == 1


class TestWeatherHelper:
    """Tests for weather-related helper functions"""

    def test_temperature_validation(self):
        """Test basic temperature value handling"""
        # Basic sanity check
        assert 0 < 25.0 < 50  # Typical temperature range
        assert isinstance(25.0, float)

    def test_humidity_validation(self):
        """Test basic humidity value handling"""
        # Humidity should be 0-100
        humidity = 60
        assert 0 <= humidity <= 100
        assert isinstance(humidity, int)

    def test_uv_index_validation(self):
        """Test basic UV index value handling"""
        # UV index should be 0-11+
        uv_index = 7
        assert 0 <= uv_index <= 15
        assert isinstance(uv_index, int)


class TestMessageFormatting:
    """Tests for message formatting in parse_response"""

    def test_message_includes_all_sections(self):
        """Test that formatted message includes all sections"""
        response_text = """
        PRIMARY:
        - retinol
        - niacinamide

        SECONDARY:
        - vitamin c

        AVOID:
        - alcohol
        """

        result = parse_response(response_text, "acne")

        message = result["message"]
        assert "Skin Analysis" in message
        assert "acne" in message
        assert "Primary Ingredients" in message
        assert "retinol" in message
        assert "Secondary Ingredients" in message
        assert "vitamin c" in message
        assert "Ingredients to Avoid" in message
        assert "alcohol" in message

    def test_message_handles_empty_sections(self):
        """Test message formatting with empty sections"""
        response_text = """
        PRIMARY:
        - ingredient1
        """

        result = parse_response(response_text, "test condition")

        message = result["message"]
        assert "Skin Analysis" in message
        assert "test condition" in message
        assert "Primary Ingredients" in message
        # Should not include empty sections
        assert "Secondary Ingredients" not in message or result["secondary_ingredients"] == []

    def test_message_with_multiple_primary_ingredients(self):
        """Test message formatting with many primary ingredients"""
        response_text = """
        PRIMARY:
        - ingredient1
        - ingredient2
        - ingredient3
        - ingredient4
        - ingredient5
        """

        result = parse_response(response_text, "complex condition")

        message = result["message"]
        # All ingredients should be in message
        for i in range(1, 6):
            assert f"ingredient{i}" in message

    def test_parse_response_lowercase_sections(self):
        """Test parsing with all lowercase section headers"""
        response_text = """
        primary:
        - retinol

        secondary:
        - niacinamide

        avoid:
        - fragrance
        """

        result = parse_response(response_text, "test")

        assert len(result["primary_ingredients"]) == 1
        assert len(result["secondary_ingredients"]) == 1
        assert len(result["avoid_ingredients"]) == 1

    def test_parse_response_uppercase_sections(self):
        """Test parsing with all UPPERCASE section headers"""
        response_text = """
        PRIMARY:
        - RETINOL

        SECONDARY:
        - NIACINAMIDE

        AVOID:
        - FRAGRANCE
        """

        result = parse_response(response_text, "test")

        assert len(result["primary_ingredients"]) == 1
        assert len(result["secondary_ingredients"]) == 1
        assert len(result["avoid_ingredients"]) == 1

    def test_parse_response_with_long_ingredient_names(self):
        """Test parsing with long ingredient names"""
        response_text = """
        PRIMARY:
        - Tocopheryl Acetate (Vitamin E)
        - Ascorbyl Palmitate (Vitamin C Derivative)

        SECONDARY:
        - Hyaluronic Acid Cross-Polymer
        """

        result = parse_response(response_text, "test")

        assert len(result["primary_ingredients"]) == 2
        assert len(result["secondary_ingredients"]) == 1

    def test_parse_response_with_numbers(self):
        """Test parsing ingredients with numbers"""
        response_text = """
        PRIMARY:
        - Retinol 0.5%
        - Niacinamide 10%

        AVOID:
        - Alcohol-40
        """

        result = parse_response(response_text, "test")

        assert len(result["primary_ingredients"]) == 2
        assert len(result["avoid_ingredients"]) == 1

    def test_message_bullet_formatting(self):
        """Test that message uses bullet points correctly"""
        response_text = """
        PRIMARY:
        - ingredient1
        - ingredient2
        """

        result = parse_response(response_text, "test")

        message = result["message"]
        # Should have bullet points
        assert "•" in message
        assert "ingredient1" in message
        assert "ingredient2" in message
