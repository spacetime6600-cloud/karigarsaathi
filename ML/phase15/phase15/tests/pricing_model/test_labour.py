from decimal import Decimal

import pytest

from pricing_model.exceptions import (
    InvalidHoursError,
    InvalidRateError,
    UnreasonableValueError,
)
from pricing_model.models import LabourInput, RateType, ValueStatus
from pricing_model.validation import validate_labour


class TestSingleLabourTask:
    def test_valid_labour(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("5"),
            hourly_rate=Decimal("200"),
            rate_source="Market rate",
            rate_type=RateType.PRESET,
            hours_status=ValueStatus.EXACT
        )
        validate_labour(labour)

    def test_negative_hours_rejected(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("-2"),
            hourly_rate=Decimal("200"),
            rate_source="Market rate",
        )
        with pytest.raises(InvalidHoursError):
            validate_labour(labour)

    def test_negative_rate_rejected(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("5"),
            hourly_rate=Decimal("-200"),
            rate_source="Market rate",
        )
        with pytest.raises(InvalidRateError):
            validate_labour(labour)

    def test_zero_hours_allowed(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("0"),
            hourly_rate=Decimal("200"),
            rate_source="Market rate",
        )
        validate_labour(labour)

    def test_empty_task_name_rejected(self):
        labour = LabourInput(
            task_name="",
            hours=Decimal("5"),
            hourly_rate=Decimal("200"),
            rate_source="Market rate",
        )
        with pytest.raises(InvalidHoursError):
            validate_labour(labour)

    def test_empty_rate_source_rejected(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("5"),
            hourly_rate=Decimal("200"),
            rate_source="",
        )
        with pytest.raises(InvalidRateError):
            validate_labour(labour)

    def test_unreasonable_hours_rejected(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("200000"),
            hourly_rate=Decimal("200"),
            rate_source="Market rate",
        )
        with pytest.raises(UnreasonableValueError):
            validate_labour(labour)

    def test_unreasonable_rate_rejected(self):
        labour = LabourInput(
            task_name="Carving",
            hours=Decimal("5"),
            hourly_rate=Decimal("2000000"),
            rate_source="Market rate",
        )
        with pytest.raises(UnreasonableValueError):
            validate_labour(labour)


class TestMultipleLabourTasks:
    def test_multiple_valid_labour(self):
        tasks = [
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),
            LabourInput(task_name="Sanding", hours=Decimal("3"), hourly_rate=Decimal("150"), rate_source="Market rate"),
        ]
        for t in tasks:
            validate_labour(t)
