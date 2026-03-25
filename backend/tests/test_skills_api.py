import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_get_skill_tree():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/skills/tree")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert "subskills" in data
