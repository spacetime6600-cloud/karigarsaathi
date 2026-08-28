"""Enums for Phase 15 Pricing Model."""
from enum import Enum


class MarginMode(str, Enum):
    PERCENTAGE_MARKUP = "percentage_markup"  # Profit markup (%) on cost floor
    FIXED_AMOUNT = "fixed_amount"            # Fixed INR profit amount
    FIXED_INR = "fixed_inr"                  # Alias for fixed INR amount


class ComparableStatus(str, Enum):
    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    STALE = "stale"
    PENDING = "pending"
    REJECTED = "rejected"
    EXPIRED = "expired"
    FLAGGED = "flagged"


class ValueStatus(str, Enum):
    EXACT = "exact"          # Measured/quoted precisely
    ESTIMATED = "estimated"  # Approximate / flagged in assumptions


class RateType(str, Enum):
    PRESET = "preset"  # Guild / standardized rate
    CUSTOM = "custom"  # Artisan-selected / negotiated rate


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"      # All cost inputs exact, rate sources present, verified comparables
    MEDIUM = "MEDIUM"  # Complete required costs, but some estimates or 0-2 comparables
    LOW = "LOW"        # Missing rate sources, multiple weak estimates, or weak inputs


class SelectionType(str, Enum):
    LOW = "low"        # Low scenario selected
    BASE = "base"      # Base scenario selected
    HIGH = "high"      # High scenario selected
    CUSTOM = "custom"  # Artisan custom price entered
