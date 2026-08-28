"""Constants for Phase 15 Explainable Fair-Price Assistant."""
from decimal import Decimal

CURRENCY = "INR"
FORMULA_VERSION = "fair-price-rules-v1"

# Default configuration parameters
DEFAULT_FRESHNESS_DAYS = 180
DEFAULT_COMPARABLE_INFLUENCE = Decimal("20")  # 20% influence on raw gap
DEFAULT_MAX_ADJUSTMENT = Decimal("10")        # Capped at +/- 10% of cost-based price
DEFAULT_LOW_BUFFER = Decimal("5")             # 5% buffer below base
DEFAULT_HIGH_BUFFER = Decimal("10")           # 10% buffer above base

# Input sanity bounds
MAX_REASONABLE_HOURS = Decimal("1000")
MAX_REASONABLE_RATE = Decimal("50000")
MAX_REASONABLE_QUANTITY = Decimal("100000")
MAX_REASONABLE_VALUE = Decimal("10000000")  # ₹1 crore

SUPPORTED_LOCALES = ("en", "hi", "or", "bn", "te")
