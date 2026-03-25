import pytest
from app.db.session import init_db, get_db, Session as DbSession, Diagram, Review, SkillAdaptation, AuthConfig


@pytest.mark.asyncio
async def test_init_db_creates_tables():
    await init_db(":memory:")
    async for db in get_db():
        from sqlalchemy import text
        result = await db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
        assert "sessions" in tables
        assert "diagrams" in tables
        assert "reviews" in tables
        assert "skill_adaptations" in tables
        assert "auth_config" in tables


@pytest.mark.asyncio
async def test_create_session():
    await init_db(":memory:")
    async for db in get_db():
        session = DbSession(title="Test Arch", context={"project_name": "test"})
        db.add(session)
        await db.commit()
        await db.refresh(session)
        assert session.id is not None
        assert session.title == "Test Arch"
        assert session.status == "active"


@pytest.mark.asyncio
async def test_create_diagram():
    await init_db(":memory:")
    async for db in get_db():
        session = DbSession(title="Test")
        db.add(session)
        await db.commit()
        await db.refresh(session)

        diagram = Diagram(
            session_id=session.id,
            nodes=[{"id": "n1", "symbol_type": "api_service", "name": "API"}],
            edges=[],
            flows=[],
        )
        db.add(diagram)
        await db.commit()
        await db.refresh(diagram)
        assert diagram.version == 1
        assert len(diagram.nodes) == 1
