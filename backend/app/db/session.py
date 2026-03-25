import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy import Column, String, Text, Integer, Boolean
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

_engine = None
_session_factory = None


class Base(DeclarativeBase):
    pass


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(Text, default="Untitled")
    context = Column(JSON, default=dict)
    status = Column(String, default="active")
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class Diagram(Base):
    __tablename__ = "diagrams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    version = Column(Integer, default=1)
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list)
    flows = Column(JSON, default=list)
    mode = Column(String, default="stage_diagram")
    theme = Column(JSON, default=dict)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    diagram_id = Column(String, nullable=False)
    score = Column(Integer)
    summary = Column(Text)
    feedback = Column(JSON, default=dict)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class SkillAdaptation(Base):
    __tablename__ = "skill_adaptations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    target_subskill = Column(String, nullable=False)
    decisions = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    status = Column(String, default="pending")
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class AuthConfig(Base):
    __tablename__ = "auth_config"

    id = Column(String, primary_key=True, default="default")
    mode = Column(String, default="cli")
    api_key_encrypted = Column(String, default="")


async def init_db(path: str = None):
    global _engine, _session_factory
    from app.core.config import settings
    db_path = path or settings.database_path
    url = f"sqlite+aiosqlite:///{db_path}" if db_path != ":memory:" else "sqlite+aiosqlite://"
    _engine = create_async_engine(url, echo=False)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session
