"""Compatibility alias for pricing_model package."""
import sys
from backend.app.pricing_engine import *
from backend.app import pricing_engine

sys.modules["pricing_model"] = pricing_engine
sys.modules["pricing_model.calculator"] = sys.modules.get("backend.app.pricing_engine.calculator")
sys.modules["pricing_model.constants"] = sys.modules.get("backend.app.pricing_engine.constants")
sys.modules["pricing_model.enums"] = sys.modules.get("backend.app.pricing_engine.enums")
sys.modules["pricing_model.exceptions"] = sys.modules.get("backend.app.pricing_engine.exceptions")
sys.modules["pricing_model.models"] = sys.modules.get("backend.app.pricing_engine.models")
sys.modules["pricing_model.rounding"] = sys.modules.get("backend.app.pricing_engine.rounding")
sys.modules["pricing_model.validation"] = sys.modules.get("backend.app.pricing_engine.validation")
sys.modules["pricing_model.explanations"] = sys.modules.get("backend.app.pricing_engine.explanations")
