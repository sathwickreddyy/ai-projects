from typing import AsyncGenerator

from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import text
from sqlalchemy import TIMESTAMP

from app.core.config import settings


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(Text, unique=True, nullable=False)
    path = Column(Text, nullable=False)
    description = Column(Text)
    last_scanned = Column(TIMESTAMP(timezone=True))
    file_index = Column(JSONB, default={})
    metadata_ = Column("metadata", JSONB, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))


class Architecture(Base):
    __tablename__ = "architectures"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    project_id = Column(UUID(as_uuid=True))
    name = Column(Text, default="Default")
    nodes = Column(JSONB, default=[])
    edges = Column(JSONB, default=[])
    layout = Column(JSONB, default={})
    mode = Column(Text, default="stage_diagram")
    theme = Column(JSONB, default={})
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    scope = Column(Text, default="global")
    key = Column(Text, nullable=False)
    value = Column(JSONB, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))


class ComponentLibrary(Base):
    __tablename__ = "component_library"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(Text, unique=True, nullable=False)
    category = Column(Text, nullable=False)
    icon = Column(Text, nullable=False)
    color = Column(Text, nullable=False)
    border_color = Column(Text, nullable=False)
    default_props = Column(JSONB, default={})
    keywords = Column(ARRAY(Text), default=[])
    sort_order = Column(Integer, default=0)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(Text, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    prompt_snippet = Column(Text, nullable=False)
    trigger_pattern = Column(ARRAY(Text), default=[])
    scope = Column(Text, default="global")
    approved_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    approved_by = Column(Text, default="user")
    active = Column(Boolean, default=True)


class ClaudeReview(Base):
    __tablename__ = "claude_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    architecture_id = Column(UUID(as_uuid=True))
    prompt = Column(Text, nullable=False)
    feedback = Column(JSONB, nullable=False)
    applied = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))


class ChangeLog(Base):
    __tablename__ = "change_log"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    architecture_id = Column(UUID(as_uuid=True))
    change_type = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))


engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
