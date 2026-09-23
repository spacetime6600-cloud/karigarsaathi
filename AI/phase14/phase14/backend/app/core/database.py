from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from sqlalchemy import event
from pathlib import Path
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from backend.app.core.config import settings

Base = declarative_base()


def ensure_db_directory(url_str: str) -> None:
    """Ensure the parent directory for a SQLite database file exists before connecting."""
    try:
        url = make_url(url_str)
        if url.get_backend_name() == "sqlite" and url.database:
            if url.database not in (":memory:", ""):
                db_path = Path(url.database)
                if not db_path.is_absolute():
                    (Path.cwd() / db_path).parent.mkdir(parents=True, exist_ok=True)
                    service_root = Path(__file__).resolve().parent.parent.parent.parent
                    (service_root / db_path).parent.mkdir(parents=True, exist_ok=True)
                else:
                    db_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        Path("./data").mkdir(parents=True, exist_ok=True)


ensure_db_directory(settings.database_url)

# SQLite async engine
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    echo=False,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_engine() -> AsyncEngine:
    yield engine