from decimal import Decimal

import pytest

from pricing_model.exceptions import (
    InvalidCostError,
    InvalidDecimalError,
    InvalidQuantityError,
    UnreasonableValueError,
)
from pricing_model.models import MaterialInput, ValueStatus
from pricing_model.validation import validate_material


class TestSingleMaterial:
    def test_valid_material(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("10"),
            unit="kg",
            cost_per_unit=Decimal("50"),
            value_status=ValueStatus.EXACT
        )
        validate_material(material)

    def test_negative_quantity_rejected(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("-5"),
            unit="kg",
            cost_per_unit=Decimal("50"),
        )
        with pytest.raises(InvalidQuantityError):
            validate_material(material)

    def test_negative_cost_rejected(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("10"),
            unit="kg",
            cost_per_unit=Decimal("-50"),
        )
        with pytest.raises(InvalidCostError):
            validate_material(material)

    def test_zero_quantity_allowed(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("0"),
            unit="kg",
            cost_per_unit=Decimal("50"),
        )
        validate_material(material)

    def test_unreasonable_quantity_rejected(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("2000000"),
            unit="kg",
            cost_per_unit=Decimal("50"),
        )
        with pytest.raises(UnreasonableValueError):
            validate_material(material)

    def test_invalid_decimal_string(self):
        material = MaterialInput(
            name="Wood",
            quantity="not_a_number",
            unit="kg",
            cost_per_unit=Decimal("50"),
        )
        with pytest.raises(InvalidDecimalError):
            validate_material(material)

    def test_empty_name_rejected(self):
        material = MaterialInput(
            name="",
            quantity=Decimal("10"),
            unit="kg",
            cost_per_unit=Decimal("50"),
        )
        with pytest.raises(InvalidQuantityError):
            validate_material(material)

    def test_empty_unit_rejected(self):
        material = MaterialInput(
            name="Wood",
            quantity=Decimal("10"),
            unit="",
            cost_per_unit=Decimal("50"),
        )
        with pytest.raises(InvalidQuantityError):
            validate_material(material)


class TestMultipleMaterials:
    def test_multiple_valid_materials(self):
        materials = [
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),
            MaterialInput(name="Paint", quantity=Decimal("2"), unit="L", cost_per_unit=Decimal("200")),
        ]
        for m in materials:
            validate_material(m)
