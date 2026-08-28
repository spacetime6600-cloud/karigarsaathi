from decimal import Decimal

from pricing_model.rounding import round_half_up, round_half_up_value


class TestRounding:
    def test_round_half_up_exact(self):
        result = round_half_up(Decimal("100"))
        assert result.rounded == Decimal("100")
        assert result.difference == Decimal("0")

    def test_round_half_up_half_up(self):
        result = round_half_up(Decimal("100.5"))
        assert result.rounded == Decimal("101")
        assert result.difference == Decimal("0.5")

    def test_round_half_up_half_down(self):
        result = round_half_up(Decimal("100.4"))
        assert result.rounded == Decimal("100")
        assert result.difference == Decimal("-0.4")

    def test_round_half_up_negative(self):
        result = round_half_up(Decimal("-100.5"))
        assert result.rounded == Decimal("-101")
        assert result.difference == Decimal("-0.5")

    def test_round_half_up_negative_half_down(self):
        result = round_half_up(Decimal("-100.4"))
        assert result.rounded == Decimal("-100")
        assert result.difference == Decimal("0.4")

    def test_round_half_up_value_function(self):
        assert round_half_up_value(Decimal("100.5")) == Decimal("101")
        assert round_half_up_value(Decimal("100.4")) == Decimal("100")
        assert round_half_up_value(Decimal("100")) == Decimal("100")

    def test_rounding_result_fields(self):
        result = round_half_up(Decimal("100.5"))
        assert result.unrounded == Decimal("100.5")
        assert result.rounded == Decimal("101")
        assert result.rule == "ROUND_HALF_UP"
