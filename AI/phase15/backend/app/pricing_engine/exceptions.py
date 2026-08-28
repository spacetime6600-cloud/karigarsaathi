"""Domain exceptions for Phase 15 Pricing Model."""


class PricingModelError(Exception):
    """Base error for all pricing engine failures."""
    pass


class InvalidDecimalError(PricingModelError):
    pass


class InvalidQuantityError(PricingModelError):
    pass


class InvalidCostError(PricingModelError):
    pass


class InvalidHoursError(PricingModelError):
    pass


class InvalidRateError(PricingModelError):
    pass


class InvalidOverheadError(PricingModelError):
    pass


class InvalidPackagingError(PricingModelError):
    pass


class InvalidMarginError(PricingModelError):
    pass


class InvalidPercentageError(PricingModelError):
    pass


class InvalidDateError(PricingModelError):
    pass


class InvalidComparableStatusError(PricingModelError):
    pass


class UnsupportedCurrencyError(PricingModelError):
    pass


class UnsupportedLocaleError(PricingModelError):
    pass


class UnreasonableValueError(PricingModelError):
    pass


class MissingInputsError(PricingModelError):
    pass


class InvalidScenarioOrderError(PricingModelError):
    pass


class InvalidBatchQuantityError(PricingModelError):
    pass
