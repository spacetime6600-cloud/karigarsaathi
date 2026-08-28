from enum import Enum


class MarginMode(str, Enum):
    PERCENTAGE_MARKUP = "percentage_markup"
    FIXED_INR = "fixed_inr"


class ComparableStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ValueStatus(str, Enum):
    EXACT = "exact"
    ESTIMATED = "estimated"


class RateType(str, Enum):
    PRESET = "preset"
    CUSTOM = "custom"


class ConfidenceLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SelectionType(str, Enum):
    LOW = "low"
    BASE = "base"
    HIGH = "high"
    CUSTOM = "custom"
