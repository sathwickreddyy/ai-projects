import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db.session import init_db

async def _create_session(client):
    """Helper to create a session and return its ID."""
    payload = {
        "context": {"project_name": "diag-test"},
        "architecture": {
            "title": "Diag Test",
            "mode": "stage_diagram",
            "nodes": [{"id": "n1", "symbol_type": "api_service", "name": "API"}],
            "edges": [{"id": "e1", "source": "n1", "target": "n1"}],
            "flows": [],
        }
    }
    resp = await client.post("/api/sessions/", json=payload)
    assert resp.status_code == 200, f"Session creation failed: {resp.status_code} - {resp.text}"
    return resp.json()["id"]

@pytest.mark.asyncio
async def test_list_diagram_versions():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = await _create_session(client)
        resp = await client.get(f"/api/diagrams/{session_id}")
        assert resp.status_code == 200
        diagrams = resp.json()
        assert isinstance(diagrams, list)
        assert len(diagrams) >= 1
        assert diagrams[0]["version"] == 1

@pytest.mark.asyncio
async def test_patch_diagram_creates_new_version():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = await _create_session(client)

        # Get v1 diagram ID
        versions = await client.get(f"/api/diagrams/{session_id}")
        v1_id = versions.json()[0]["id"]

        # Patch to create v2
        resp = await client.patch(f"/api/diagrams/{v1_id}", json={
            "nodes": [
                {"id": "n1", "symbol_type": "api_service", "name": "API"},
                {"id": "n2", "symbol_type": "kafka_broker", "name": "Kafka"},
            ],
            "edges": [{"id": "e1", "source": "n1", "target": "n2"}],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == 2
        assert len(data["nodes"]) == 2

@pytest.mark.asyncio
async def test_get_diagram_diff():
    await init_db(":memory:")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = await _create_session(client)

        # Get v1
        versions = await client.get(f"/api/diagrams/{session_id}")
        v1_id = versions.json()[0]["id"]

        # Create v2
        patch_resp = await client.patch(f"/api/diagrams/{v1_id}", json={
            "nodes": [
                {"id": "n1", "symbol_type": "api_service", "name": "API"},
                {"id": "n2", "symbol_type": "kafka_broker", "name": "Kafka"},
            ],
        })
        v2_id = patch_resp.json()["id"]

        # Get diff
        resp = await client.get(f"/api/diagrams/{v2_id}/diff")
        assert resp.status_code == 200
        diff = resp.json()
        assert "added_nodes" in diff
        assert "removed_nodes" in diff
