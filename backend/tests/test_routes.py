import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_session(client):
    resp = await client.post("/api/sessions", json={
        "title": "Test Architecture",
        "data": {"nodes": [], "edges": []},
        "detected_stack": ["fastapi", "redis"],
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Test Architecture"
    assert body["data"] == {"nodes": [], "edges": []}
    assert body["detected_stack"] == ["fastapi", "redis"]
    assert "id" in body


@pytest.mark.asyncio
async def test_get_session(client):
    create_resp = await client.post("/api/sessions", json={
        "title": "Get Test",
        "data": {"nodes": [{"id": "n1"}], "edges": []},
    })
    session_id = create_resp.json()["id"]

    resp = await client.get(f"/api/sessions/{session_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Get Test"
    assert resp.json()["data"]["nodes"][0]["id"] == "n1"


@pytest.mark.asyncio
async def test_get_session_not_found(client):
    resp = await client.get("/api/sessions/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_session(client):
    create_resp = await client.post("/api/sessions", json={
        "title": "Patch Test",
        "data": {"nodes": [{"id": "n1", "position": {"x": 0, "y": 0}}], "edges": []},
    })
    session_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/sessions/{session_id}", json={
        "data": {"nodes": [{"id": "n1", "position": {"x": 100, "y": 200}}], "edges": []},
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["nodes"][0]["position"] == {"x": 100, "y": 200}


@pytest.mark.asyncio
async def test_list_sessions(client):
    resp = await client.get("/api/sessions")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) > 0
