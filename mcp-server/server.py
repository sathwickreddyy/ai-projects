import json
import os

import httpx
from mcp.server.fastmcp import FastMCP

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:18000")

mcp = FastMCP("arch-viewer")


@mcp.tool()
async def check_app_health() -> str:
    """Check if the Arch Viewer app is running and healthy."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BACKEND_URL}/health", timeout=5, follow_redirects=True)
            if resp.status_code == 200:
                return "Arch Viewer is healthy and running."
            return f"Arch Viewer returned status {resp.status_code}"
    except Exception as e:
        return f"Arch Viewer is not reachable: {e}"


@mcp.tool()
async def push_architecture(architecture_json: str) -> str:
    """Push a generated architecture to the Arch Viewer app.

    Args:
        architecture_json: JSON string with title, detected_stack, nodes, edges.
    """
    try:
        data = json.loads(architecture_json)
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"

    title = data.get("title", "Untitled")
    detected_stack = data.get("detected_stack", [])
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    payload = {
        "title": title,
        "detected_stack": detected_stack,
        "data": {"nodes": nodes, "edges": edges},
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/sessions",
                json=payload,
                timeout=10,
                follow_redirects=True,
            )
            if resp.status_code == 201:
                session = resp.json()
                session_id = session["id"]
                return (
                    f"Architecture pushed successfully.\n"
                    f"Open in browser: http://localhost:13000/session/{session_id}\n"
                    f"Session ID: {session_id}"
                )
            return f"Backend returned {resp.status_code}: {resp.text}"
    except Exception as e:
        return f"Failed to push: {e}"


@mcp.tool()
async def list_sessions() -> str:
    """List all architecture sessions."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/sessions",
                timeout=5,
                follow_redirects=True,
            )
            sessions = resp.json()
            if not sessions:
                return "No sessions found."
            lines = [f"Found {len(sessions)} session(s):\n"]
            for s in sessions:
                lines.append(f"  - {s['title']} (ID: {s['id']}, created: {s['created_at']})")
            return "\n".join(lines)
    except Exception as e:
        return f"Failed to list sessions: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
