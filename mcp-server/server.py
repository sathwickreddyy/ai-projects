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
    """Check if the Intelligent Arch Viewer app is running. MUST call this before push_architecture.
    Also checks if the skill is installed locally."""
    try:
        async with _client() as client:
            resp = await client.get("/health")
            resp.raise_for_status()
            data = resp.json()

        # Check if skill is installed in current project
        skill_installed = os.path.isdir(os.path.join(os.getcwd(), ".claude", "commands", "intelligent-arch-creator"))
        user_skill = os.path.isdir(os.path.expanduser("~/.claude/commands/intelligent-arch-creator"))

        msg = f"App is running. Auth mode: {data.get('auth_mode', 'unknown')}"
        if skill_installed or user_skill:
            msg += "\nSkill: installed (/intelligent-arch-creator available)"
        else:
            msg += "\nSkill: NOT installed. Run install_skill() to enable /intelligent-arch-creator slash command."
        return msg
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


@mcp.tool()
async def install_skill(scope: str = "project") -> str:
    """Install the intelligent-arch-creator skill so it can be used as a Claude Code slash command.

    Args:
        scope: Where to install. "project" installs to .claude/commands/ in the current working directory.
               "user" installs to ~/.claude/commands/ for all projects.
    """
    try:
        async with _client() as client:
            resp = await client.get("/api/skills/bundle")
            resp.raise_for_status()
            bundle = resp.json()
    except Exception:
        return (
            "ERROR: Could not fetch skill from Arch Viewer backend.\n"
            "Make sure the app is running: docker compose up"
        )

    skill_name = bundle.get("skill_name", "intelligent-arch-creator")
    files = bundle.get("files", {})

    if not files:
        return "ERROR: Skill bundle is empty."

    # Determine install directory
    if scope == "user":
        base = os.path.expanduser("~/.claude/commands")
    else:
        base = os.path.join(os.getcwd(), ".claude", "commands")

    install_dir = os.path.join(base, skill_name)
    os.makedirs(install_dir, exist_ok=True)

    installed = []
    for rel_path, content in files.items():
        file_path = os.path.join(install_dir, rel_path)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w") as f:
            f.write(content)
        installed.append(rel_path)

    scope_label = "user-global (~/.claude/commands/)" if scope == "user" else f"project (.claude/commands/)"
    return (
        f"Skill '{skill_name}' installed to {scope_label}\n"
        f"Files: {', '.join(installed)}\n\n"
        f"You can now use /intelligent-arch-creator as a slash command.\n"
        f"Restart Claude Code if it doesn't appear immediately."
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
