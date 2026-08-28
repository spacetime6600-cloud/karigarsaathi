"""Pytest fixtures and environment setup for Phase 15 test suite."""
import pytest
import pytest_asyncio
from backend.app.db.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    """Ensure database schema is created before test execution."""
    await init_db()
