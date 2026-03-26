# mcp-server/server.py
import json
import os
import re
from pathlib import Path

import httpx
import yaml
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:18000")
SKILL_NAME = "intelligent-arch-creator"

mcp = FastMCP("arch-viewer")


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=BACKEND_URL, timeout=60.0)


def _find_local_skill() -> str | None:
    """Find the locally installed skill directory. Checks project scope first, then user scope."""
    project_path = os.path.join(os.getcwd(), ".claude", "commands", SKILL_NAME)
    if os.path.isdir(project_path):
        return project_path
    user_path = os.path.expanduser(f"~/.claude/commands/{SKILL_NAME}")
    if os.path.isdir(user_path):
        return user_path
    return None


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

3. **Load subskills** — call get_skill_tree() to check for matching learned patterns

4. **Map detected stack to symbols** (ONLY use these symbol_types):
   kafka_broker, kafka_topic, redis_cache, redis_pubsub, pubsub_channel,
   postgres_db, api_service, load_balancer, client_actor, external_service

5. **Assign layers**: 0=clients, 1=APIs/gateways, 2=workers, 3=messaging, 4=databases

6. **Generate edges** with labels:
   HTTP calls → solid, "HTTP POST →"
   Kafka produce → animated, "produce →", #ef4444
   SQL read/write → solid, "SQL read ←", #3b82f6
   Redis pub/sub → animated, "publish →", #f97316
   External API → dotted, "API call →", #6b7280

7. **Generate 3 insights** about architectural GAPS (not praise)

8. **Call push_architecture()** with this JSON schema:
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


# ─── Tools ───────────────────────────────────────────────────────────────────


@mcp.tool()
async def check_app_health() -> str:
    """Check if the Intelligent Arch Viewer app is running and return skill instructions.
    MUST call this before push_architecture. Returns the process to follow for generating diagrams."""
    try:
        async with _client() as client:
            resp = await client.get("/health")
            resp.raise_for_status()
            data = resp.json()

        local_skill = _find_local_skill()

        msg = f"App is running. Auth mode: {data.get('auth_mode', 'unknown')}"
        if local_skill:
            msg += f"\nSkill: installed at {local_skill}"
            msg += f"\n\n{SKILL_PROCESS_SUMMARY}"
        else:
            msg += (
                "\n\nACTION REQUIRED: The intelligent-arch-creator skill is NOT installed."
                "\nAsk the user:"
                '\n  "The architecture skill needs to be installed. Where should I install it?'
                "\n  - **Project** — installs to this project only (.claude/commands/)"
                '\n  - **User** — installs globally for all projects (~/.claude/commands/)"'
                "\n\nThen call install_skill(scope) with their choice (default: project)."
                "\nAfter installation, proceed with the architecture generation."
            )
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
        # Inject local skill_path into the context
        data = json.loads(payload)
        local_skill = _find_local_skill()
        if local_skill and "context" in data:
            data["context"]["skill_path"] = local_skill

        async with _client() as client:
            resp = await client.post("/api/sessions/", json=data)
            resp.raise_for_status()
            result = resp.json()
            return f"Architecture pushed successfully.\nOpen in browser: http://localhost:13000/session/{result['id']}\nSession ID: {result['id']}"
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
    """Show the current skill structure with subskills and keywords.
    Reads from the LOCAL project's installed skill (not the backend).
    Subskills evolve over time as the user approves adaptations in the viewer."""
    local_skill = _find_local_skill()
    if not local_skill:
        return (
            "Skill not installed locally. Call install_skill() first.\n"
            "Falling back to standard skill from backend..."
        )

    skill_dir = Path(local_skill)

    # Read skill name from skill.md frontmatter
    name = SKILL_NAME
    skill_md = skill_dir / "skill.md"
    if skill_md.exists():
        content = skill_md.read_text()
        match = re.search(r"name:\s*(.+)", content)
        if match:
            name = match.group(1).strip()

    # Read keywords.yaml
    keywords = []
    kw_file = skill_dir / "keywords.yaml"
    if kw_file.exists():
        kw_data = yaml.safe_load(kw_file.read_text()) or {}
        keywords = kw_data.get("mappings", [])

    # Read subskills
    subskills = []
    sub_dir = skill_dir / "subskills"
    if sub_dir.is_dir():
        for f in sorted(sub_dir.glob("*.md")):
            content = f.read_text()
            sub_name = f.stem
            version = 1
            learned_from = 0
            match_name = re.search(r"name:\s*(.+)", content)
            if match_name:
                sub_name = match_name.group(1).strip()
            match_ver = re.search(r"version:\s*(\d+)", content)
            if match_ver:
                version = int(match_ver.group(1))
            match_learned = re.search(r"learned_from:\s*(\d+)", content)
            if match_learned:
                learned_from = int(match_learned.group(1))
            subskills.append({
                "name": sub_name,
                "file": f.name,
                "version": version,
                "learned_from": learned_from,
                "content": content,
            })

    return json.dumps({
        "name": name,
        "path": str(skill_dir),
        "subskills": subskills,
        "keywords": keywords,
    }, indent=2)


@mcp.tool()
async def save_skill_adaptation(target_subskill: str, decisions: str, keywords: str) -> str:
    """Save an approved skill adaptation to the LOCAL project's skill files.
    Called after the user approves changes in the viewer's Adapt tab.

    Args:
        target_subskill: Name of the subskill to create or update (e.g., 'proximity-geo')
        decisions: JSON array of decision strings (e.g., '["Always add DLQ", "Separate read/write"]')
        keywords: JSON array of trigger keywords (e.g., '["kafka", "order"]')
    """
    local_skill = _find_local_skill()
    if not local_skill:
        return "ERROR: Skill not installed locally. Call install_skill() first."

    skill_dir = Path(local_skill)
    sub_dir = skill_dir / "subskills"
    sub_dir.mkdir(exist_ok=True)

    try:
        decision_list = json.loads(decisions)
        keyword_list = json.loads(keywords)
    except json.JSONDecodeError:
        return "ERROR: decisions and keywords must be valid JSON arrays"

    # Write or update subskill file
    sub_file = sub_dir / f"{target_subskill}.md"
    from datetime import date

    if sub_file.exists():
        content = sub_file.read_text()
        for d in decision_list:
            if d not in content:
                content += f"\n- {d}"
        content = re.sub(
            r"version:\s*(\d+)",
            lambda m: f"version: {int(m.group(1)) + 1}",
            content,
        )
        sub_file.write_text(content)
    else:
        decisions_text = "\n".join(f"- {d}" for d in decision_list)
        content = (
            f"---\nname: {target_subskill}\n"
            f"version: 1\nlearned_from: 1\n"
            f"last_updated: {date.today().isoformat()}\n---\n\n"
            f"## Decisions\n{decisions_text}\n"
        )
        sub_file.write_text(content)

    # Update keywords.yaml
    if keyword_list:
        kw_file = skill_dir / "keywords.yaml"
        kw_data = {"mappings": []}
        if kw_file.exists():
            kw_data = yaml.safe_load(kw_file.read_text()) or {"mappings": []}

        existing = next((m for m in kw_data["mappings"] if m["subskill"] == target_subskill), None)
        if existing:
            if keyword_list not in existing["match_any"]:
                existing["match_any"].append(keyword_list)
        else:
            kw_data["mappings"].append({
                "subskill": target_subskill,
                "match_any": [keyword_list],
            })
        kw_file.write_text(yaml.dump(kw_data, default_flow_style=False))

    return (
        f"Adaptation saved to {sub_file}\n"
        f"Keywords updated in {skill_dir / 'keywords.yaml'}\n"
        f"Subskill '{target_subskill}' will be loaded for future projects matching {keyword_list}"
    )


@mcp.tool()
async def install_skill(scope: str = "project") -> str:
    """Install the intelligent-arch-creator skill from the Arch Viewer backend.
    This copies the standard skill template to your local .claude/commands/ directory.
    The local copy evolves independently as you approve adaptations.

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

    skill_name = bundle.get("skill_name", SKILL_NAME)
    files = bundle.get("files", {})

    if not files:
        return "ERROR: Skill bundle is empty."

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

    scope_label = "user-global (~/.claude/commands/)" if scope == "user" else "project (.claude/commands/)"
    return (
        f"Skill '{skill_name}' installed to {scope_label}\n"
        f"Files: {', '.join(installed)}\n\n"
        f"This is your local copy — it will evolve as you approve adaptations.\n"
        f"You can now use /intelligent-arch-creator as a slash command.\n"
        f"Restart Claude Code if it doesn't appear immediately."
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
