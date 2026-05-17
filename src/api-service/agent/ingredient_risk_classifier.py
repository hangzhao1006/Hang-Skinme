"""
Ingredient Risk Classification
Classifies ingredients by risk level and functional category
"""

from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class IngredientRiskClassifier:
    """Classify ingredients by risk level and category"""

    # High-risk ingredients (需要谨慎使用)
    HIGH_RISK_PATTERNS = {
        # 强效活性成分
        "retinol", "tretinoin", "adapalene", "tazarotene",
        "hydroquinone", "kojic acid",
        # 强酸
        "glycolic acid", "lactic acid", "salicylic acid",
        "mandelic acid", "azelaic acid",
        # 香精和致敏原
        "fragrance", "parfum", "perfume",
        "essential oil", "citrus oil", "lemon oil",
        "limonene", "linalool", "citronellol", "geraniol",
        # 酒精
        "alcohol denat", "sd alcohol", "isopropyl alcohol",
        # 防腐剂
        "methylisothiazolinone", "methylchloroisothiazolinone",
        "formaldehyde", "dmdm hydantoin", "quaternium-15",
        # 硫酸盐表活
        "sodium lauryl sulfate", "sls", "sodium laureth sulfate", "sles",
    }

    # 中等风险 (适度使用)
    MEDIUM_RISK_PATTERNS = {
        # 温和酸类
        "pha", "gluconolactone", "lactobionic acid",
        # 美白成分
        "arbutin", "alpha arbutin", "tranexamic acid",
        # 抗氧化剂高浓度
        "vitamin c", "ascorbic acid", "l-ascorbic acid",
        "ferulic acid",
        # 某些防腐剂
        "phenoxyethanol", "parabens", "methylparaben", "propylparaben",
        # 某些表活
        "cocamidopropyl betaine", "decyl glucoside",
    }

    # 低风险 (generally safe)
    LOW_RISK_PATTERNS = {
        # 保湿剂
        "hyaluronic acid", "sodium hyaluronate", "glycerin", "glycerine",
        "panthenol", "allantoin", "urea", "ceramide",
        "squalane", "squalene",
        # 舒缓成分
        "centella asiatica", "cica", "madecassoside",
        "niacinamide", "nicotinamide",
        "bisabolol", "aloe vera", "aloe barbadensis",
        # 温和抗氧化
        "tocopherol", "vitamin e",
        "green tea", "camellia sinensis",
        # 基础成分
        "water", "aqua", "butylene glycol", "propylene glycol",
        "caprylic/capric triglyceride",
    }

    # 功能分类
    FUNCTIONAL_CATEGORIES = {
        "active": [
            "retinol", "tretinoin", "niacinamide", "peptide",
            "vitamin c", "ascorbic acid", "ferulic acid",
            "hydroquinone", "arbutin", "kojic acid",
        ],
        "exfoliant": [
            "glycolic acid", "lactic acid", "salicylic acid",
            "mandelic acid", "pha", "gluconolactone",
            "azelaic acid", "lactobionic acid",
        ],
        "moisturizer": [
            "hyaluronic acid", "glycerin", "ceramide",
            "squalane", "panthenol", "urea", "allantoin",
            "sodium hyaluronate",
        ],
        "antioxidant": [
            "vitamin e", "tocopherol", "green tea",
            "resveratrol", "coenzyme q10", "ubiquinone",
            "ferulic acid",
        ],
        "soothing": [
            "centella asiatica", "cica", "madecassoside",
            "bisabolol", "aloe vera", "chamomile",
            "colloidal oatmeal",
        ],
        "surfactant": [
            "sodium lauryl sulfate", "sodium laureth sulfate",
            "cocamidopropyl betaine", "decyl glucoside",
            "coco glucoside",
        ],
        "preservative": [
            "phenoxyethanol", "methylparaben", "propylparaben",
            "methylisothiazolinone", "formaldehyde",
        ],
        "fragrance": [
            "fragrance", "parfum", "essential oil",
            "limonene", "linalool", "citronellol",
        ],
        "solvent": [
            "water", "aqua", "alcohol", "butylene glycol",
            "propylene glycol", "glycerin",
        ],
    }

    @classmethod
    def classify_risk(cls, ingredient_name: str) -> str:
        """
        Classify ingredient risk level

        Args:
            ingredient_name: Ingredient name (normalized)

        Returns:
            "high", "medium", or "low"
        """
        name_lower = ingredient_name.lower()

        # Check high risk first
        for pattern in cls.HIGH_RISK_PATTERNS:
            if pattern in name_lower:
                return "high"

        # Check medium risk
        for pattern in cls.MEDIUM_RISK_PATTERNS:
            if pattern in name_lower:
                return "medium"

        # Check if it's a known low-risk ingredient
        for pattern in cls.LOW_RISK_PATTERNS:
            if pattern in name_lower:
                return "low"

        # Default to medium if unknown
        return "medium"

    @classmethod
    def get_functional_category(cls, ingredient_name: str) -> str:
        """
        Get functional category of ingredient

        Args:
            ingredient_name: Ingredient name (normalized)

        Returns:
            Category name or "other"
        """
        name_lower = ingredient_name.lower()

        for category, patterns in cls.FUNCTIONAL_CATEGORIES.items():
            for pattern in patterns:
                if pattern in name_lower:
                    return category

        return "other"

    @classmethod
    def get_risk_info(cls, ingredient_name: str) -> Dict[str, str]:
        """
        Get comprehensive risk info for an ingredient

        Args:
            ingredient_name: Ingredient name

        Returns:
            Dict with risk_level, category, and description
        """
        risk_level = cls.classify_risk(ingredient_name)
        category = cls.get_functional_category(ingredient_name)

        # Risk descriptions
        risk_descriptions = {
            "high": {
                "zh": "需谨慎使用，建议从低浓度开始或咨询专业人士",
                "en": "Use with caution, start with low concentration or consult professional",
            },
            "medium": {
                "zh": "适度使用，注意皮肤反应",
                "en": "Moderate use, monitor skin reaction",
            },
            "low": {
                "zh": "一般安全，适合日常使用",
                "en": "Generally safe for daily use",
            },
        }

        return {
            "risk_level": risk_level,
            "category": category,
            "description_zh": risk_descriptions[risk_level]["zh"],
            "description_en": risk_descriptions[risk_level]["en"],
        }

    @classmethod
    def sort_by_risk(cls, ingredients: List[Dict]) -> List[Dict]:
        """
        Sort ingredients by risk level (high -> medium -> low)

        Args:
            ingredients: List of ingredient dicts with 'name' field

        Returns:
            Sorted list with added 'risk_level' and 'category' fields
        """
        risk_order = {"high": 0, "medium": 1, "low": 2}

        enriched = []
        for ing in ingredients:
            risk_info = cls.get_risk_info(ing["name"])
            enriched.append({
                **ing,
                "risk_level": risk_info["risk_level"],
                "category": risk_info["category"],
                "risk_description_zh": risk_info["description_zh"],
                "risk_description_en": risk_info["description_en"],
            })

        # Sort by risk (high first), then by count (high first)
        enriched.sort(
            key=lambda x: (risk_order.get(x["risk_level"], 3), -x.get("count", 0))
        )

        return enriched


# Singleton instance
ingredient_risk_classifier = IngredientRiskClassifier()
