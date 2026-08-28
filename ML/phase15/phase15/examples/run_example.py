import json
import os
from datetime import date
from decimal import Decimal

from pricing_model import calculate_price, serialize_pricing_result
from pricing_model.models import (
    ComparableInput,
    ComparableStatus,
    LabourInput,
    MarginMode,
    MaterialInput,
    OverheadInput,
    PricingInput,
    RateType,
    ValueStatus,
)


def load_request_from_json(filepath: str) -> PricingInput:
    with open(filepath) as f:
        data = json.load(f)

    materials = tuple(
        MaterialInput(
            name=m["name"],
            quantity=Decimal(m["quantity"]),
            unit=m["unit"],
            cost_per_unit=Decimal(m["cost_per_unit"]),
            source_note=m.get("source_note"),
            value_status=ValueStatus(m.get("value_status", "exact"))
        )
        for m in data.get("materials", [])
    )

    labour = tuple(
        LabourInput(
            task_name=task["task_name"],
            hours=Decimal(task["hours"]),
            hourly_rate=Decimal(task["hourly_rate"]),
            rate_source=task["rate_source"],
            rate_type=RateType(task.get("rate_type", "preset")),
            hours_status=ValueStatus(task.get("hours_status", "exact")),
            note=task.get("note")
        )
        for task in data.get("labour", [])
    )

    overhead = tuple(
        OverheadInput(
            name=o["name"],
            amount=Decimal(o["amount"]),
            explanation=o.get("explanation"),
            value_status=ValueStatus(o.get("value_status", "exact"))
        )
        for o in data.get("overhead", [])
    )

    comparables = tuple(
        ComparableInput(
            id=c["id"],
            product_title=c["product_title"],
            category=c["category"],
            craft_type=c["craft_type"],
            material=c["material"],
            dimensions=c.get("dimensions"),
            listed_price=Decimal(c["listed_price"]),
            source_name=c["source_name"],
            source_reference=c["source_reference"],
            capture_date=date.fromisoformat(c["capture_date"]),
            status=ComparableStatus(c["status"]),
            verification_date=date.fromisoformat(c["verification_date"]) if c.get("verification_date") else None,
            verified_by=c.get("verified_by"),
            verification_note=c.get("verification_note"),
            geographic_context=c.get("geographic_context"),
            similarity_note=c.get("similarity_note"),
            evidence_reference=c.get("evidence_reference"),
            selected=c.get("selected", False)
        )
        for c in data.get("comparables", [])
    )

    return PricingInput(
        materials=materials,
        labour=labour,
        overhead=overhead,
        margin_mode=MarginMode(data["margin_mode"]),
        margin_value=Decimal(data["margin_value"]),
        comparables=comparables,
        comparable_influence=Decimal(data.get("comparable_influence", "20")),
        max_adjustment=Decimal(data.get("max_adjustment", "10")),
        low_buffer=Decimal(data.get("low_buffer", "5")),
        high_buffer=Decimal(data.get("high_buffer", "10")),
        calculation_date=date.fromisoformat(data["calculation_date"]),
        currency=data.get("currency", "INR"),
        locale=data.get("locale", "en")
    )


def main():
    examples_dir = os.path.dirname(os.path.abspath(__file__))

    print("=" * 60)
    print("Phase 15 Pricing Model - Example Calculations")
    print("=" * 60)

    print("\n--- Example 1: Without Comparables ---")
    request1 = load_request_from_json(os.path.join(examples_dir, "request_without_comparables.json"))
    result1 = calculate_price(request1)
    print(serialize_pricing_result(result1))

    print("\n--- Example 2: With Comparables ---")
    request2 = load_request_from_json(os.path.join(examples_dir, "request_with_comparables.json"))
    result2 = calculate_price(request2)
    print(serialize_pricing_result(result2))

    print("\n--- Determinism Check ---")
    result1_repeat = calculate_price(request1)
    assert result1.total_material_cost == result1_repeat.total_material_cost
    assert result1.suggested_base_price == result1_repeat.suggested_base_price
    print("[OK] Identical input produces identical output")


if __name__ == "__main__":
    main()
