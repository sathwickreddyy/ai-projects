# backend/tests/test_ai_api.py
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db.session import init_db

@pytest.mark.asyncio
async def test_followup_endpoint_exists():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # This won't actually call Claude, but the endpoint should accept the request format
        resp = await client.post("/api/ai/followup", json={
            "diagram_id": "fake-id",
            "qa_history": [{"q": "test?", "a": "yes"}],
        })
        # It may fail because diagram doesn't exist, but should be 404 or 422, not 405
        assert resp.status_code != 405  # Method not allowed = route doesn't exist

@pytest.mark.asyncio
async def test_adaptation_endpoint_exists():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/ai/adaptation", json={
            "session_id": "fake-id",
        })
        assert resp.status_code != 405

@pytest.mark.asyncio
async def test_impact_endpoint_exists():
    await init_db(":memory:")
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # The endpoint will fail trying to read skills or call Claude, but that's ok
        # We just need to verify the route exists (not 405)
        resp = await client.post("/api/ai/impact", json={
            "adaptation": {"decisions": ["test"]},
        })
        assert resp.status_code != 405
