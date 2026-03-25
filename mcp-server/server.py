# mcp-server/server.py
import json
import os

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:18000")

mcp = FastMCP("arch-viewer")


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=BACKEND_URL, timeout=60.0)


@mcp.tool()
async def check_app_health() -> str:
    """Check if the Intelligent Arch Viewer app is running. MUST call this before push_architecture."""
    try:
        async with _client() as client:
            resp = await client.get("/health")
            resp.raise_for_status()
            data = resp.json()
            return f"App is running. Auth mode: {data.get('auth_mode', 'unknown')}"
    except Exception:
        return (
            "ERROR: Arch Viewer app is not running.\n"
            "Please start it with: docker compose up\n"
            "Then try again."
        )


@mcp.tool()
async def push_architecture(payload: str) -> str:
    """Push a finalized architecture to the viewer app. Called at end of analysis.

    Args:
        payload: JSON string containing the context envelope with architecture data.
    """
    try:
        async with _client() as client:
            resp = await client.post("/api/sessions", json=json.loads(payload))
            resp.raise_for_status()
            data = resp.json()
            return f"Architecture pushed successfully.\nOpen in browser: http://localhost:13000/session/{data['id']}\nSession ID: {data['id']}"
    except json.JSONDecodeError:
        return "Error: payload is not valid JSON"
    except Exception as e:
        return f"Error pushing architecture: {e}"


@mcp.tool()
async def pull_latest_state(session_id: str) -> str:
    """Fetch the latest state of a diagram after user modifications.

    Args:
        session_id: The session ID returned by push_architecture.
    """
    try:
        async with _client() as client:
            resp = await client.get(f"/api/sessions/{session_id}/latest")
            resp.raise_for_status()
            return json.dumps(resp.json(), indent=2)
    except Exception as e:
        return f"Error fetching latest state: {e}"


@mcp.tool()
async def list_sessions() -> str:
    """List all architecture sessions with their status."""
    try:
        async with _client() as client:
            resp = await client.get("/api/sessions")
            resp.raise_for_status()
            sessions = resp.json()
            if not sessions:
                return "No sessions found."
            lines = []
            for s in sessions:
                lines.append(
                    f"- {s['id'][:8]}... | {s.get('title', 'Untitled')} | {s['status']} | {s.get('created_at', '')}"
                )
            return "\n".join(lines)
    except Exception as e:
        return f"Error listing sessions: {e}"


@mcp.tool()
async def get_skill_tree() -> str:
    """Show the current intelligent-arch-creator skill structure with subskills and keywords."""
    try:
        async with _client() as client:
            resp = await client.get("/api/skills/tree")
            resp.raise_for_status()
            return json.dumps(resp.json(), indent=2)
    except Exception as e:
        return f"Error fetching skill tree: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
