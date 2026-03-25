import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db.session import init_db

@pytest.mark.asyncio
async def test_push_architecture_creates_session():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "context": {"project_name": "test", "detected_stack": ["fastapi"]},
            "architecture": {
                "title": "Test Arch",
                "mode": "stage_diagram",
                "nodes": [{"id": "n1", "symbol_type": "api_service", "name": "API"}],
                "edges": [],
                "flows": [],
            }
        }
        resp = await client.post("/api/sessions/", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "url" in data

@pytest.mark.asyncio
async def test_list_sessions():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/sessions/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

@pytest.mark.asyncio
async def test_get_session_by_id():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create first
        payload = {
            "context": {"project_name": "test2"},
            "architecture": {
                "title": "Test2",
                "mode": "stage_diagram",
                "nodes": [],
                "edges": [],
                "flows": [],
            }
        }
        create_resp = await client.post("/api/sessions/", json=payload)
        session_id = create_resp.json()["id"]

        # Get by ID
        resp = await client.get(f"/api/sessions/{session_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == session_id
        assert data["title"] == "Test2"
        assert "diagram" in data

@pytest.mark.asyncio
async def test_get_latest_state():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "context": {"project_name": "test3"},
            "architecture": {
                "title": "Test3",
                "mode": "stage_diagram",
                "nodes": [{"id": "n1"}],
                "edges": [],
                "flows": [],
            }
        }
        create_resp = await client.post("/api/sessions/", json=payload)
        session_id = create_resp.json()["id"]

        resp = await client.get(f"/api/sessions/{session_id}/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "version" in data
