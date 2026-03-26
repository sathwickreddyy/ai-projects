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


SKILL_PROCESS_SUMMARY = """
## How to Generate an Architecture Diagram

Follow these steps IN ORDER:

1. **Ask scan scope** — Present 3 options to user:
   - Quick (~5K tokens): configs + manifests only
   - Standard (~15K tokens): + entrypoints + settings (default)
   - Deep (~30K tokens): + infra code + docs

2. **Scan files in priority order** (stop at scope limit):
   P0: docker-compose.yml, Dockerfile, k8s/*.yaml, .env.example
   P1: package.json, requirements.txt, go.mod, Cargo.toml
   P2: main.py, app.py, index.ts, server.js (entrypoints)
   P3: Config files with DB URLs, Kafka hosts, Redis connections
   P4: Kafka producer/consumer code, Redis clients, DB migrations
   P5: README.md, docs/
   SKIP: node_modules, .git, __pycache__, venv, tests, lock files

3. **Map detected stack to symbols** (ONLY use these symbol_types):
   kafka_broker, kafka_topic, redis_cache, redis_pubsub, pubsub_channel,
   postgres_db, api_service, load_balancer, client_actor, external_service

4. **Assign layers**: 0=clients, 1=APIs/gateways, 2=workers, 3=messaging, 4=databases

5. **Generate edges** with labels:
   HTTP calls → solid, "HTTP POST →"
   Kafka produce → animated, "produce →", #ef4444
   SQL read/write → solid, "SQL read ←", #3b82f6
   Redis pub/sub → animated, "publish →", #f97316
   External API → dotted, "API call →", #6b7280

6. **Generate 3 insights** about architectural GAPS (not praise)

7. **Call push_architecture()** with this JSON schema:
{
  "context": {
    "project_name": "string", "project_path": "string",
    "detected_stack": ["string"], "user_intent": "string",
    "skill_used": "intelligent-arch-creator", "skill_version": "1.0",
    "skill_path": "", "conversation_summary": "string",
    "scan_scope": "quick|standard|deep", "tokens_consumed": 0,
    "files_scanned": ["string"], "preferences": {}
  },
  "architecture": {
    "title": "string", "mode": "stage_diagram",
    "default_mode": "stage_diagram", "auto_layout": true,
    "nodes": [{"id":"string","symbol_type":"string","name":"string",
      "props":{},"position":{"x":0.5,"y":0.2},"layer":0}],
    "edges": [{"id":"string","source":"string","source_port":null,
      "target":"string","target_port":null,"label":"string",
      "style":"solid|animated|dotted","color":"#hex"}],
    "flows": [{"id":"string","name":"string","steps":["node_ids"],"color":"#hex"}],
    "insights": ["gap 1","gap 2","gap 3"]
  }
}

Set source_port/target_port to null (viewer auto-assigns).
Set auto_layout: true (viewer uses ELK.js for positioning).
""".strip()


@mcp.tool()
async def check_app_health() -> str:
    """Check if the Intelligent Arch Viewer app is running and return skill instructions.
    MUST call this before push_architecture. Returns the process to follow for generating diagrams."""
    try:
        async with _client() as client:
            resp = await client.get("/health")
            resp.raise_for_status()
            data = resp.json()

        # Check if skill is installed locally
        skill_installed = os.path.isdir(os.path.join(os.getcwd(), ".claude", "commands", "intelligent-arch-creator"))
        user_skill = os.path.isdir(os.path.expanduser("~/.claude/commands/intelligent-arch-creator"))

        msg = f"App is running. Auth mode: {data.get('auth_mode', 'unknown')}"
        if skill_installed or user_skill:
            msg += "\nSkill: installed (/intelligent-arch-creator available)"
        else:
            msg += "\nSkill: not installed as slash command. Run install_skill() to enable /intelligent-arch-creator."
            msg += "\n\nHowever, you can still follow these instructions directly:"

        msg += f"\n\n{SKILL_PROCESS_SUMMARY}"
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
            resp = await client.post("/api/sessions/", json=json.loads(payload))
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
            resp = await client.get("/api/sessions/")
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
            resp = await client.get("/api/skills/tree/")
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
            resp = await client.get("/api/skills/bundle/")
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
