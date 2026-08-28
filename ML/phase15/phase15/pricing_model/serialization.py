import json
from datetime import date
from decimal import Decimal
from typing import Any

from pricing_model.models import ArtisanDecisionResult, ConfidenceResult, PricingResult


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, date):
            return obj.isoformat()
        if hasattr(obj, "__dataclass_fields__"):
            return dict(obj.__dict__.items())
        if isinstance(obj, set):
            return list(obj)
        return super().default(obj)


def to_json(obj: Any) -> str:
    return json.dumps(obj, cls=DecimalEncoder, indent=2)


def to_dict(obj: Any) -> dict[str, Any]:
    result = json.loads(to_json(obj))
    assert isinstance(result, dict)
    return result


def serialize_pricing_result(result: PricingResult) -> str:
    return to_json(result)


def serialize_confidence_result(result: ConfidenceResult) -> str:
    return to_json(result)


def serialize_artisan_decision(result: ArtisanDecisionResult) -> str:
    return to_json(result)


def deserialize_decimal(value: str | Decimal) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))
