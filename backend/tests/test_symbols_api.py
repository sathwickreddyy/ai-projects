import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_get_symbols():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/symbols/")
        assert resp.status_code == 200
        data = resp.json()
        assert "symbols" in data
        assert "meta" in data


@pytest.mark.asyncio
async def test_get_palette():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/symbols/palette")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)
        assert len(items) > 0
        assert "symbol_type" in items[0]
        assert "category" in items[0]
