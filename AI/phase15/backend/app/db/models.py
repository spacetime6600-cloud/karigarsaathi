"""SQLAlchemy domain models for Phase 15 isolated feedback storage."""
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class PricingFeedbackRecord(Base):
    __tablename__ = "pricing_feedback"

    id = Column(String(64), primary_key=True, index=True)
    owner_uid = Column(String(128), index=True, nullable=False)
    suggested_price = Column(Float, nullable=False)
    artisan_selected_price = Column(Float, nullable=False)
    decision = Column(String(32), nullable=False)  # accepted, rejected, edited
    cost_floor = Column(Float, nullable=False)
    formula_version = Column(String(64), nullable=False)
    is_below_cost = Column(Boolean, default=False)
    reason = Column(Text, nullable=True)
    calculation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
