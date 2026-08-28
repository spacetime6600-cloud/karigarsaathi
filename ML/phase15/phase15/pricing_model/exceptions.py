class PricingValidationError(ValueError):
    pass


class InvalidQuantityError(PricingValidationError):
    pass


class InvalidCostError(PricingValidationError):
    pass


class InvalidHoursError(PricingValidationError):
    pass


class InvalidRateError(PricingValidationError):
    pass


class InvalidOverheadError(PricingValidationError):
    pass


class InvalidMarginError(PricingValidationError):
    pass


class InvalidPercentageError(PricingValidationError):
    pass


class UnsupportedCurrencyError(PricingValidationError):
    pass


class UnsupportedLocaleError(PricingValidationError):
    pass


class MissingInputsError(PricingValidationError):
    pass


class InvalidDateError(PricingValidationError):
    pass


class InvalidComparableStatusError(PricingValidationError):
    pass


class InvalidDecimalError(PricingValidationError):
    pass


class UnreasonableValueError(PricingValidationError):
    pass
