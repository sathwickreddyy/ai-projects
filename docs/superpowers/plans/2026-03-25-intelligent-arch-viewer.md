# Intelligent Architecture Viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an intelligent architecture visualization app that receives structured JSON from a Claude Code skill, renders interactive diagrams with SVG infrastructure symbols, supports AI-powered review, and feeds learnings back into a skill/subskill system.

**Architecture:** Monolith web app (FastAPI backend + React frontend) with MCP bridge for Claude Code integration. Custom SVG canvas with ELK.js layout engine. AI engine calls Claude via CLI or API key. Skill files managed on disk with explicit approval workflow.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy (SQLite), React 18, TypeScript strict, Tailwind CSS 3, Zustand, ELK.js, Vite 5, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md`

**Note:** PostgreSQL support is intentionally deferred to v2. SQLite only for v1.

---

## Phase 0: Clean Slate + Project Scaffold

### Task 0.1: Delete Existing Code

**Files:**
- Delete: `backend/`, `frontend/`, `mcp-server/`, `postgres/`, `projects/`, `docker-compose.yml`, `.env.example`, `.claude.json`, `SPEC.md`, `CLAUDE.md`
- Keep: `.git/`, `.gitignore`, `docs/`, `.superpowers/`

- [ ] **Step 1: Remove old implementation files**

```bash
rm -rf backend frontend mcp-server postgres projects
rm -f docker-compose.yml .env.example .claude.json SPEC.md CLAUDE.md
```

- [ ] **Step 2: Commit clean slate**

```bash
git add -A
git commit -m "chore: clean slate for intelligent arch viewer rebuild"
```

---

### Task 0.2: Project Scaffold + Memory System

**Files:**
- Create: `.gitignore`
- Create: `.claude/INDEX.md`
- Create: `.claude/constraints.md`
- Create: `.claude/decisions/001-clean-slate-rebuild.md`
- Create: `.claude/design/architecture.md`

- [ ] **Step 1: Create .gitignore**

```
.env
__pycache__/
*.pyc
*.pyo
.venv/
venv/
node_modules/
dist/
build/
*.egg-info/
.DS_Store
.superpowers/
*.db
```

- [ ] **Step 2: Create memory system**

`.claude/INDEX.md`:
```markdown
# Project Memory Index

## Decisions
- [001 Clean slate rebuild](decisions/001-clean-slate-rebuild.md) — why we rebuilt from scratch

## Design
- [Architecture](design/architecture.md) — system architecture overview

## Constraints
- [Constraints](constraints.md) — hard rules for this project
```

`.claude/constraints.md`:
```markdown
# Hard Constraints

1. No hardcoded Claude model versions — CLI uses latest, API uses CLAUDE_MODEL env var
2. Symbol types defined ONLY in symbols.yaml — both skill and app read from this file
3. App NEVER auto-saves to skill files — explicit approval required
4. Skill must check app health before push_architecture
5. All edges/connections always visible — never hidden behind nodes
6. Node positions stored as 0.0-1.0 fractions in DB, converted to pixels on canvas
7. 6 connection ports per node: top, top-right, right, bottom, bottom-left, left
8. SSE/WebSocket for streaming — no polling
9. TypeScript strict mode, no implicit any
10. SQLite default, PostgreSQL optional
```

`.claude/decisions/001-clean-slate-rebuild.md`:
```markdown
# Decision: Clean Slate Rebuild

**Date:** 2026-03-25
**Status:** Accepted

Previous implementation was a standalone web platform for architecture diagrams.
New design is fundamentally different: MCP-server-backed intelligent viewer with
skill adaptation, proper SVG infrastructure symbols, and AI review flow.
Rewriting from scratch is cleaner than adapting — no shared code between old and new.
```

`.claude/design/architecture.md`:
```markdown
# System Architecture

Four components:
- MCP Server (stdio, thin bridge) → 5 tools
- Backend (FastAPI + SQLite) → sessions, AI engine, skill manager
- Frontend (React + custom SVG canvas) → symbols, layout, review
- Skill files (on disk) → skill.md, symbols.yaml, keywords.yaml, subskills/

See full spec: docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md
```

- [ ] **Step 3: Commit scaffold**

```bash
git add -A
git commit -m "chore: project scaffold with memory system"
```

---

### Task 0.3: Docker Compose + Environment

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "18000:8000"
    env_file:
      - .env
    environment:
      DATABASE_PATH: /data/arch_viewer.db
      SKILLS_DIR: /skills
      PYTHONUNBUFFERED: "1"
    volumes:
      - ./backend:/app
      - ./data:/data
      - ./skills:/skills
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "13000:13000"
    environment:
      VITE_API_URL: http://localhost:18000
      VITE_WS_URL: ws://localhost:18000
    volumes:
      - ./frontend/src:/app/src
    depends_on:
      - backend
```

- [ ] **Step 2: Create .env.example**

```env
# Auth: cli | api
CLAUDE_AUTH_MODE=cli

# Only needed when CLAUDE_AUTH_MODE=api
ANTHROPIC_API_KEY=

# Optional: override default model for API mode
# CLI mode always uses latest from subscription
CLAUDE_MODEL=

# App
DATABASE_PATH=./data/arch_viewer.db
SKILLS_DIR=./skills
```

- [ ] **Step 3: Create data directory**

```bash
mkdir -p data
echo "*.db" > data/.gitignore
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: docker compose and environment config"
```

---

### Task 0.4: Symbol Instruction Set

**Files:**
- Create: `skills/intelligent-arch-creator/symbols.yaml`

- [ ] **Step 1: Create symbols.yaml with meta-schema + 10 symbol definitions**

Write the full `symbols.yaml` as specified in Section 3 of the design spec. This file is long (~300 lines) — refer to the spec for the complete content including:
- `meta:` section with shapes, internal_elements, ports, animations, color_palette, prop_types
- `symbols:` section with all 10 initial symbol definitions
- Commented example showing how to add a new symbol

The full content is defined in the spec under "Section 3: Symbol Instruction Set (symbols.yaml)".

- [ ] **Step 2: Commit**

```bash
git add skills/
git commit -m "feat: symbol instruction set (symbols.yaml)"
```

---

## Phase 1: Backend Core

### Task 1.1: Backend Scaffold + Config

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy[asyncio]==2.0.35
aiosqlite==0.20.0
anthropic==0.34.2
python-dotenv==1.0.1
pydantic==2.9.2
pydantic-settings==2.5.2
aiofiles==24.1.0
httpx==0.27.2
websockets==13.1
pyyaml==6.0.2
```

- [ ] **Step 3: Create config.py**

```python
from typing import Literal, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    claude_auth_mode: Literal["cli", "api"] = "cli"
    anthropic_api_key: str = ""
    claude_model: str = ""  # empty = latest for CLI, sonnet for API
    database_path: str = "./data/arch_viewer.db"
    skills_dir: str = "./skills"

    class Config:
        env_file = ".env"

    def validate_auth(self):
        if self.claude_auth_mode == "api" and not self.anthropic_api_key:
            raise ValueError("CLAUDE_AUTH_MODE=api requires ANTHROPIC_API_KEY")
        if self.claude_auth_mode == "cli":
            import shutil
            if not shutil.which("claude"):
                raise ValueError("CLAUDE_AUTH_MODE=cli requires claude CLI on PATH")

    @property
    def resolved_model(self) -> Optional[str]:
        """Return model for API mode. None for CLI (uses latest)."""
        if self.claude_auth_mode == "cli":
            return None
        return self.claude_model or None  # SDK picks default if None


settings = Settings()
```

- [ ] **Step 4: Create empty `__init__.py` files**

```bash
touch backend/app/__init__.py backend/app/core/__init__.py
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: backend scaffold with config"
```

---

### Task 1.2: Database Models

**Files:**
- Create: `backend/app/db/__init__.py`
- Create: `backend/app/db/session.py`
- Test: `backend/tests/test_db.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_db.py
import pytest
import asyncio
from app.db.session import init_db, get_db, Session, Diagram, Review, SkillAdaptation

@pytest.fixture
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.mark.asyncio
async def test_init_db_creates_tables():
    await init_db(":memory:")
    async for db in get_db():
        # Should not raise
        result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in result.fetchall()]
        assert "sessions" in tables
        assert "diagrams" in tables
        assert "reviews" in tables
        assert "skill_adaptations" in tables
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && python -m pytest tests/test_db.py -v
```

- [ ] **Step 3: Implement models**

```python
# backend/app/db/session.py
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy import Column, String, Text, Integer, Boolean, Float
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

_engine = None
_session_factory = None


class Base(DeclarativeBase):
    pass


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(Text, default="Untitled")
    context = Column(JSON, default=dict)  # full context envelope
    status = Column(String, default="active")  # active | archived
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class Diagram(Base):
    __tablename__ = "diagrams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    version = Column(Integer, default=1)
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list)
    flows = Column(JSON, default=list)
    mode = Column(String, default="stage_diagram")
    theme = Column(JSON, default=dict)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    diagram_id = Column(String, nullable=False)
    score = Column(Integer)
    summary = Column(Text)
    feedback = Column(JSON, default=dict)  # full structured feedback
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class SkillAdaptation(Base):
    __tablename__ = "skill_adaptations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    target_subskill = Column(String, nullable=False)
    decisions = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    status = Column(String, default="pending")  # pending | approved | discarded
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class AuthConfig(Base):
    __tablename__ = "auth_config"

    id = Column(String, primary_key=True, default="default")
    mode = Column(String, default="cli")
    api_key_encrypted = Column(String, default="")


async def init_db(path: str = None):
    global _engine, _session_factory
    from app.core.config import settings
    db_path = path or settings.database_path
    url = f"sqlite+aiosqlite:///{db_path}" if db_path != ":memory:" else "sqlite+aiosqlite://"
    _engine = create_async_engine(url, echo=False)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && python -m pytest tests/test_db.py -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: database models (sessions, diagrams, reviews, adaptations)"
```

---

### Task 1.3: Backend Main + Health Endpoint

**Files:**
- Create: `backend/app/main.py`
- Test: `backend/tests/test_health.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_health.py
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_returns_ok():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "auth_mode" in data
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement main.py**

```python
# backend/app/main.py
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Auth mode: %s", settings.claude_auth_mode)
    logger.info("Model: %s", settings.resolved_model or "latest (CLI)")
    await init_db()
    yield


app = FastAPI(title="arch-viewer", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "auth_mode": settings.claude_auth_mode,
    }
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: backend main with health endpoint"
```

---

## Phase 2: Backend Services

### Task 2.1: Symbol Registry (YAML Parser)

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/symbol_registry.py`
- Test: `backend/tests/test_symbol_registry.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_symbol_registry.py
import pytest
from app.services.symbol_registry import SymbolRegistry

@pytest.fixture
def registry():
    return SymbolRegistry("skills/intelligent-arch-creator/symbols.yaml")

def test_loads_symbols(registry):
    symbols = registry.get_all_symbols()
    assert "kafka_broker" in symbols
    assert "api_service" in symbols
    assert len(symbols) >= 10

def test_symbol_has_required_fields(registry):
    kafka = registry.get_symbol("kafka_broker")
    assert kafka["category"] == "messaging"
    assert kafka["shape"] == "container_box"
    assert "props_schema" in kafka

def test_get_palette_items(registry):
    items = registry.get_palette_items()
    categories = {item["category"] for item in items}
    assert "messaging" in categories
    assert "database" in categories

def test_get_meta(registry):
    meta = registry.get_meta()
    assert "shapes" in meta
    assert "internal_elements" in meta
    assert "ports" in meta
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement SymbolRegistry**

```python
# backend/app/services/symbol_registry.py
from pathlib import Path
from typing import Optional
import yaml


class SymbolRegistry:
    def __init__(self, yaml_path: str):
        self._path = Path(yaml_path)
        self._data = {}
        self._load()

    def _load(self):
        if self._path.exists():
            with open(self._path) as f:
                self._data = yaml.safe_load(f) or {}

    def reload(self):
        self._load()

    def get_meta(self) -> dict:
        return self._data.get("meta", {})

    def get_all_symbols(self) -> dict:
        return self._data.get("symbols", {})

    def get_symbol(self, symbol_type: str) -> Optional[dict]:
        return self._data.get("symbols", {}).get(symbol_type)

    def get_palette_items(self) -> list[dict]:
        items = []
        palette = self.get_meta().get("color_palette", {})
        for name, defn in self.get_all_symbols().items():
            category = defn.get("category", "other")
            colors = palette.get(category, {})
            items.append({
                "symbol_type": name,
                "label": defn.get("label", name),
                "category": category,
                "shape": defn.get("shape", "rounded_rect"),
                "keywords": defn.get("keywords", []),
                "color": colors.get("primary", "#6b7280"),
                "border_color": colors.get("border", "#9ca3af"),
                "props_schema": defn.get("props_schema", {}),
            })
        return items

    def get_compact_type_list(self) -> str:
        """Compact summary for Claude prompts — saves tokens."""
        lines = []
        for name, defn in self.get_all_symbols().items():
            props = list(defn.get("props_schema", {}).keys())
            lines.append(f"- {name} ({defn.get('label', name)}): props={props}")
        return "\n".join(lines)
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add backend/ skills/
git commit -m "feat: symbol registry YAML parser"
```

---

### Task 2.2: AI Engine

**Files:**
- Create: `backend/app/services/ai_engine.py`
- Test: `backend/tests/test_ai_engine.py`

- [ ] **Step 1: Write failing test for prompt construction**

```python
# backend/tests/test_ai_engine.py
import pytest
from app.services.ai_engine import AIEngine

def test_build_review_prompt():
    engine = AIEngine.__new__(AIEngine)  # skip __init__
    prompt = engine._build_review_prompt(
        diagram={"nodes": [{"id": "n1", "name": "API"}], "edges": []},
        context={"detected_stack": ["fastapi"]},
    )
    assert "architecture" in prompt.lower()
    assert "n1" in prompt
    assert "fastapi" in prompt

def test_build_followup_prompt_includes_qa_history():
    engine = AIEngine.__new__(AIEngine)
    prompt = engine._build_followup_prompt(
        diagram={"nodes": [], "edges": []},
        context={},
        qa_history=[{"q": "Expected msgs/sec?", "a": "<100/sec"}],
    )
    assert "Expected msgs/sec?" in prompt
    assert "<100/sec" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement AIEngine**

The AI engine has two drivers (CLI subprocess, Anthropic SDK) behind a unified interface. Key methods:

```python
# backend/app/services/ai_engine.py
import asyncio
import json
from typing import AsyncIterator, Optional
from app.core.config import settings

REVIEW_SYSTEM = """You are a senior systems architect reviewing an architecture diagram.
Return JSON only. No markdown. No explanation outside JSON.
{
  "score": 1-10,
  "summary": "one paragraph overall assessment",
  "issues": [{"severity":"critical|warning|suggestion","component":"node_id","message":"","fix":""}],
  "missing_components": [{"name":"","reason":"","type":"","symbol_type":""}],
  "follow_up_questions": [{"question":"","options":["a","b","c"]}],
  "suggested_adaptations": [{"decision":"","reason":""}]
}"""


class AIEngine:
    def __init__(self):
        self._mode = settings.claude_auth_mode

    def _build_review_prompt(self, diagram: dict, context: dict) -> str:
        stack = ", ".join(context.get("detected_stack", []))
        return (
            f"Review this architecture.\n"
            f"Detected stack: {stack}\n\n"
            f"Architecture:\n```json\n{json.dumps(diagram, indent=2)}\n```"
        )

    def _build_followup_prompt(self, diagram: dict, context: dict, qa_history: list) -> str:
        qa_text = "\n".join(f"Q: {qa['q']}\nA: {qa['a']}" for qa in qa_history)
        return (
            f"Update your review based on these answers:\n\n{qa_text}\n\n"
            f"Architecture:\n```json\n{json.dumps(diagram, indent=2)}\n```"
        )

    async def _cli_stream(self, system: str, user_msg: str) -> AsyncIterator[str]:
        cmd = ["claude", "--print", "--stream", "--system-prompt", system]
        if settings.resolved_model:
            cmd.extend(["--model", settings.resolved_model])
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        proc.stdin.write(user_msg.encode())
        await proc.stdin.drain()
        proc.stdin.close()
        while True:
            chunk = await proc.stdout.read(256)
            if not chunk:
                break
            yield chunk.decode(errors="replace")
        await proc.wait()

    async def _api_stream(self, system: str, user_msg: str) -> AsyncIterator[str]:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        kwargs = {"max_tokens": 4096, "system": system,
                  "messages": [{"role": "user", "content": user_msg}]}
        if settings.resolved_model:
            kwargs["model"] = settings.resolved_model
        async with client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

    async def stream_review(self, diagram: dict, context: dict) -> AsyncIterator[str]:
        user_msg = self._build_review_prompt(diagram, context)
        streamer = self._cli_stream if self._mode == "cli" else self._api_stream
        async for chunk in streamer(REVIEW_SYSTEM, user_msg):
            yield chunk

    async def review(self, diagram: dict, context: dict) -> dict:
        chunks = []
        async for chunk in self.stream_review(diagram, context):
            chunks.append(chunk)
        raw = "".join(chunks)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)

    async def answer_followup(self, diagram: dict, context: dict, qa_history: list) -> dict:
        user_msg = self._build_followup_prompt(diagram, context, qa_history)
        streamer = self._cli_stream if self._mode == "cli" else self._api_stream
        chunks = []
        async for chunk in streamer(REVIEW_SYSTEM, user_msg):
            chunks.append(chunk)
        raw = "".join(chunks)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)

    async def generate_adaptation(self, diagram_v1: dict, diagram_v2: dict, context: dict) -> dict:
        """Compare original vs modified, extract learned decisions."""
        user_msg = (
            f"Compare these two architecture versions and extract the key decisions "
            f"the user made when modifying the original.\n\n"
            f"Original:\n```json\n{json.dumps(diagram_v1, indent=2)}\n```\n\n"
            f"Modified:\n```json\n{json.dumps(diagram_v2, indent=2)}\n```\n\n"
            f"Return JSON: {{\"decisions\": [\"...\"], \"patterns\": [\"...\"], "
            f"\"symbol_overrides\": [\"...\"]}}"
        )
        return await self._complete(REVIEW_SYSTEM, user_msg)

    async def preview_impact(self, adaptation: dict, skill_tree: dict) -> dict:
        """Predict how this adaptation changes future generations."""
        user_msg = (
            f"Given this proposed skill adaptation:\n"
            f"```json\n{json.dumps(adaptation, indent=2)}\n```\n\n"
            f"And the current skill tree:\n"
            f"```json\n{json.dumps(skill_tree, indent=2)}\n```\n\n"
            f"Predict what changes future architecture generations would see. "
            f"Return JSON: {{\"impacts\": [\"...\"], \"affected_keywords\": [\"...\"]}}"
        )
        return await self._complete(REVIEW_SYSTEM, user_msg)

    async def _complete(self, system: str, user_msg: str) -> dict:
        """Non-streaming completion."""
        chunks = []
        streamer = self._cli_stream if self._mode == "cli" else self._api_stream
        async for chunk in streamer(system, user_msg):
            chunks.append(chunk)
        raw = "".join(chunks)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: AI engine with CLI and API drivers"
```

---

### Task 2.3: Skill Manager

**Files:**
- Create: `backend/app/services/skill_manager.py`
- Test: `backend/tests/test_skill_manager.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_skill_manager.py
import pytest
import tempfile
from pathlib import Path
from app.services.skill_manager import SkillManager

@pytest.fixture
def skill_dir(tmp_path):
    # Minimal skill structure
    (tmp_path / "skill.md").write_text("---\nname: test-skill\n---\n# Test")
    (tmp_path / "keywords.yaml").write_text(
        "mappings:\n  - subskill: test-sub\n    match_any:\n      - [kafka, order]\n"
    )
    sub_dir = tmp_path / "subskills"
    sub_dir.mkdir()
    (sub_dir / "test-sub.md").write_text(
        "---\nname: test-sub\nversion: 1\nlearned_from: 1\n---\n## Decisions\n- Always use DLQ\n"
    )
    return tmp_path

def test_read_skill_tree(skill_dir):
    mgr = SkillManager(str(skill_dir))
    tree = mgr.read_skill_tree()
    assert tree["name"] == "test-skill"
    assert len(tree["subskills"]) == 1
    assert tree["subskills"][0]["name"] == "test-sub"

def test_read_keywords(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mappings = mgr.read_keywords()
    assert len(mappings) == 1
    assert mappings[0]["subskill"] == "test-sub"

def test_save_adaptation_creates_new_subskill(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mgr.save_adaptation(
        target_subskill="new-sub",
        decisions=["Use circuit breaker"],
        keywords=["circuit", "resilience"],
    )
    new_file = skill_dir / "subskills" / "new-sub.md"
    assert new_file.exists()
    content = new_file.read_text()
    assert "Use circuit breaker" in content
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement SkillManager**

```python
# backend/app/services/skill_manager.py
import re
from datetime import date
from pathlib import Path
from typing import Optional
import yaml


class SkillManager:
    def __init__(self, skill_dir: str):
        """skill_dir resolved from context envelope's skill_path, falling back to settings.skills_dir."""
        self._dir = Path(skill_dir)

    def read_skill_tree(self) -> dict:
        skill_md = self._dir / "skill.md"
        name = "unknown"
        if skill_md.exists():
            content = skill_md.read_text()
            match = re.search(r"name:\s*(.+)", content)
            if match:
                name = match.group(1).strip()

        subskills = []
        sub_dir = self._dir / "subskills"
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

        keywords = self.read_keywords()
        return {
            "name": name,
            "subskills": subskills,
            "keywords": keywords,
        }

    def read_keywords(self) -> list[dict]:
        kw_file = self._dir / "keywords.yaml"
        if not kw_file.exists():
            return []
        data = yaml.safe_load(kw_file.read_text()) or {}
        return data.get("mappings", [])

    def save_adaptation(
        self,
        target_subskill: str,
        decisions: list[str],
        keywords: list[str],
    ) -> str:
        sub_dir = self._dir / "subskills"
        sub_dir.mkdir(exist_ok=True)
        sub_file = sub_dir / f"{target_subskill}.md"

        if sub_file.exists():
            content = sub_file.read_text()
            # Append decisions
            for d in decisions:
                if d not in content:
                    content += f"\n- {d}"
            # Bump version
            content = re.sub(
                r"version:\s*(\d+)",
                lambda m: f"version: {int(m.group(1)) + 1}",
                content,
            )
            sub_file.write_text(content)
        else:
            decisions_text = "\n".join(f"- {d}" for d in decisions)
            content = (
                f"---\nname: {target_subskill}\n"
                f"version: 1\nlearned_from: 1\n"
                f"last_updated: {date.today().isoformat()}\n---\n\n"
                f"## Decisions\n{decisions_text}\n"
            )
            sub_file.write_text(content)

        # Update keywords.yaml
        self._add_keywords(target_subskill, keywords)
        return str(sub_file)

    def _add_keywords(self, subskill: str, keywords: list[str]):
        if not keywords:
            return
        kw_file = self._dir / "keywords.yaml"
        data = {"mappings": []}
        if kw_file.exists():
            data = yaml.safe_load(kw_file.read_text()) or {"mappings": []}

        # Check if mapping exists
        for mapping in data["mappings"]:
            if mapping["subskill"] == subskill:
                if keywords not in mapping["match_any"]:
                    mapping["match_any"].append(keywords)
                kw_file.write_text(yaml.dump(data, default_flow_style=False))
                return

        data["mappings"].append({
            "subskill": subskill,
            "match_any": [keywords],
        })
        kw_file.write_text(yaml.dump(data, default_flow_style=False))
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: skill manager for reading/writing skill files"
```

---

## Phase 3: Backend API Routes

### Task 3.1: Sessions API

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/sessions.py`
- Test: `backend/tests/test_sessions_api.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_sessions_api.py
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_push_architecture_creates_session():
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
        resp = await client.post("/api/sessions", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "url" in data

@pytest.mark.asyncio
async def test_list_sessions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/sessions")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement sessions router**

Create `backend/app/api/sessions.py` with:
- `POST /api/sessions` — accepts context envelope, creates session + v1 diagram, returns `{id, url}`
- `GET /api/sessions` — list all sessions
- `GET /api/sessions/{id}` — get session with latest diagram
- `GET /api/sessions/{id}/latest` — get latest diagram state + diff summary vs v1

Register router in `main.py`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: sessions API (push, list, get, latest)"
```

---

### Task 3.2: Diagrams API

**Files:**
- Create: `backend/app/api/diagrams.py`
- Test: `backend/tests/test_diagrams_api.py`

- [ ] **Step 1-5: Same TDD cycle**

Endpoints:
- `GET /api/diagrams/{session_id}` — list diagram versions for session
- `PATCH /api/diagrams/{diagram_id}` — update nodes/edges/flows/mode (creates new version)
- `GET /api/diagrams/{diagram_id}/diff` — diff between v1 and this version

- [ ] **Commit**

```bash
git commit -m "feat: diagrams API (versions, patch, diff)"
```

---

### Task 3.3: AI Routes + WebSocket

**Files:**
- Create: `backend/app/api/ai.py`
- Create: `backend/app/api/ws.py`

- [ ] **Step 1-5: Same TDD cycle**

Routes:
- `POST /api/ai/review` — non-streaming review, returns full JSON
- `POST /api/ai/followup` — process follow-up answers
- `POST /api/ai/adaptation` — generate adaptation proposal from v1 vs current diff
- `POST /api/ai/impact` — preview impact of an adaptation
- `WS /ws/review/{diagram_id}` — WebSocket streaming review

- [ ] **Commit**

```bash
git commit -m "feat: AI routes and WebSocket review streaming"
```

---

### Task 3.4: Skills + Symbols + Auth Routes

**Files:**
- Create: `backend/app/api/skills.py`
- Create: `backend/app/api/symbols.py`
- Create: `backend/app/api/auth.py`

- [ ] **Step 1-5: Same TDD cycle**

Routes:
- `GET /api/skills/tree` — skill tree structure
- `POST /api/skills/adapt` — save approved adaptation
- `POST /api/skills/impact` — preview impact
- `GET /api/symbols` — full symbol registry for frontend
- `GET /api/symbols/palette` — palette items (compact)
- `GET /api/auth/status` — check CLI availability + current auth mode
- `POST /api/auth/configure` — set API key or switch to CLI mode

- [ ] **Commit**

```bash
git commit -m "feat: skills, symbols, and auth API routes"
```

---

## Phase 4: MCP Server

### Task 4.1: MCP Server (5 tools)

**Files:**
- Create: `mcp-server/requirements.txt`
- Create: `mcp-server/server.py`
- Create: `.claude.json`

- [ ] **Step 1: Create requirements.txt**

```
mcp>=1.0.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

- [ ] **Step 2: Create server.py with 5 tools**

```python
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
    """Push a finalized architecture to the viewer app. Called at end of analysis."""
    try:
        async with _client() as client:
            resp = await client.post("/api/sessions", json=json.loads(payload))
            resp.raise_for_status()
            data = resp.json()
            return f"Architecture pushed. Open: http://localhost:13000/session/{data['id']}"
    except Exception as e:
        return f"Error pushing architecture: {e}"


@mcp.tool()
async def pull_latest_state(session_id: str) -> str:
    """Fetch latest diagram state after user modifications."""
    try:
        async with _client() as client:
            resp = await client.get(f"/api/sessions/{session_id}/latest")
            resp.raise_for_status()
            return json.dumps(resp.json(), indent=2)
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def list_sessions() -> str:
    """List all architecture sessions."""
    try:
        async with _client() as client:
            resp = await client.get("/api/sessions")
            resp.raise_for_status()
            sessions = resp.json()
            if not sessions:
                return "No sessions."
            lines = [f"- {s['id'][:8]} | {s.get('title', 'Untitled')} | {s['status']}" for s in sessions]
            return "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def get_skill_tree() -> str:
    """Show current skill structure with subskills and keywords."""
    try:
        async with _client() as client:
            resp = await client.get("/api/skills/tree")
            resp.raise_for_status()
            return json.dumps(resp.json(), indent=2)
    except Exception as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

- [ ] **Step 3: Create .claude.json**

```json
{
  "mcpServers": {
    "arch-viewer": {
      "command": "python",
      "args": ["mcp-server/server.py"],
      "env": {
        "BACKEND_URL": "http://localhost:18000"
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add mcp-server/ .claude.json
git commit -m "feat: MCP server with 5 tools (health, push, pull, list, tree)"
```

---

## Phase 5: Frontend Core

### Task 5.1: Frontend Scaffold

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`, `frontend/postcss.config.js`
- Create: `frontend/index.html`, `frontend/src/index.css`
- Create: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "arch-viewer-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.5",
    "axios": "^1.7.7",
    "elkjs": "^0.9.3",
    "@tailwindcss/forms": "^0.5.9"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 2: Create config files** (tsconfig, vite, tailwind, postcss — same patterns as spec Section 9). Tailwind config should include custom dark theme colors:

```js
// tailwind.config.js — extend theme with arch-viewer palette
theme: {
  extend: {
    colors: {
      arch: {
        bg: '#0a0a0f',
        surface: '#0f1117',
        panel: '#161b27',
        border: '#1e2430',
        text: '#c9d1e0',
        muted: '#6b7280',
        accent: '#2563eb',
      }
    }
  }
}
```

`index.css` must set body background to `#0a0a0f`, text to `#c9d1e0`, custom scrollbar styling (6px, `#1e2430` thumb).

- [ ] **Step 3: Create Dockerfile, index.html, index.css, main.tsx, App.tsx stubs**

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffold (React + Vite + Tailwind + ELK.js)"
```

---

### Task 5.2: TypeScript Types

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/types/symbols.ts`

- [ ] **Step 1: Define all interfaces from spec Section 9.6**

Core types: `ContextEnvelope`, `ArchNode`, `ArchEdge`, `ArchFlow`, `Session`, `Diagram`, `ReviewFeedback`, `SkillTree`, `SymbolDefinition`, `PaletteItem`, `Port`, `AppState`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/
git commit -m "feat: TypeScript type definitions"
```

---

### Task 5.3: Zustand Store + API Client

**Files:**
- Create: `frontend/src/stores/appStore.ts`
- Create: `frontend/src/stores/symbolRegistry.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/ws.ts`

- [ ] **Step 1: Create appStore** — session, diagram (nodes/edges/flows), UI state, review state, all setters
- [ ] **Step 2: Create symbolRegistry** — parses symbol data from backend into lookup map
- [ ] **Step 3: Create API client** — axios instance, all REST calls from spec route table
- [ ] **Step 4: Create WebSocket client** — connect/disconnect, message handlers for review streaming
- [ ] **Step 5: Create `lib/symbolParser.ts`** — parses symbol registry JSON from `/api/symbols` into render-ready structures: maps `symbol_type` → `{shape, internalElements, colors, portsConfig}`. Used by `symbolRegistry` store and `NodeRenderer` component.
- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: Zustand store, symbol registry, API + WS clients"
```

---

## Phase 6: Frontend Canvas + Symbols

### Task 6.1: SVG Symbol Components

**Files:**
- Create: `frontend/src/components/symbols/HorizontalCylinder.tsx`
- Create: `frontend/src/components/symbols/ContainerBox.tsx`
- Create: `frontend/src/components/symbols/DiamondStack.tsx`
- Create: `frontend/src/components/symbols/Hexagon.tsx`
- Create: `frontend/src/components/symbols/RoundedRect.tsx`
- Create: `frontend/src/components/symbols/Circle.tsx`
- Create: `frontend/src/components/symbols/Cloud.tsx`
- Create: `frontend/src/components/symbols/InternalElements.tsx`

- [ ] **Step 1-7: Create each SVG component**

Each component accepts `props` from the node definition and renders the appropriate SVG. Key conventions:
- HorizontalCylinder: ellipse-left + rect-body + ellipse-right. Draws partition_lane, message_block, row_line, animated_message as internal elements based on `internal_elements` config.
- ContainerBox: rounded-rect with header bar. Renders children (stacked vertically).
- All components render 6 port circles (hidden by default, shown on hover via CSS).
- Colors from category palette, overridable via props.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/symbols/
git commit -m "feat: SVG symbol components (7 shapes + internal elements)"
```

---

### Task 6.2: Canvas Core

**Files:**
- Create: `frontend/src/components/canvas/Canvas.tsx`
- Create: `frontend/src/components/canvas/CanvasBackground.tsx`
- Create: `frontend/src/components/canvas/NodeRenderer.tsx`
- Create: `frontend/src/components/canvas/EdgeRenderer.tsx`
- Create: `frontend/src/components/canvas/PortOverlay.tsx`
- Create: `frontend/src/hooks/useCanvas.ts`

- [ ] **Step 1: Create useCanvas hook** — pan/zoom state, SVG viewBox management, mouse handlers
- [ ] **Step 2: Create CanvasBackground** — dot grid pattern
- [ ] **Step 3: Create NodeRenderer** — dispatches to correct symbol component by `symbol_type`, positions node, handles drag
- [ ] **Step 4: Create EdgeRenderer** — SVG path with arrow markers, label rendering, animated dash for async edges
- [ ] **Step 5: Create PortOverlay** — 6 port circles per node, visible on hover, draggable for new connections
- [ ] **Step 6: Create Canvas** — SVG container composing background → edges → nodes → ports → HUD. Z-ordering ensures edges always visible.
- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/canvas/ frontend/src/hooks/
git commit -m "feat: SVG canvas with node/edge rendering and port overlay"
```

---

### Task 6.3: Layout Engine + Edge Routing

**Files:**
- Create: `frontend/src/lib/elkLayout.ts`
- Create: `frontend/src/lib/edgeRouter.ts`
- Create: `frontend/src/hooks/useLayout.ts`
- Create: `frontend/src/hooks/useEdgeRouting.ts`

- [ ] **Step 1: Create elkLayout.ts** — ELK.js wrapper. Takes nodes/edges, returns positioned nodes + edge bend points. Supports `layered` and `force` algorithms.
- [ ] **Step 2: Create edgeRouter.ts** — orthogonal routing. For each edge: straight path → check node intersections → route with L/Z bends → check edge crossings → apply offsets → bezier smoothing.
- [ ] **Step 3: Create useLayout hook** — auto-arrange trigger, spring animation to new positions
- [ ] **Step 4: Create useEdgeRouting hook** — re-routes on node move (simplified during drag, full on drag-end)
- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/ frontend/src/hooks/
git commit -m "feat: ELK.js layout engine and orthogonal edge routing"
```

---

## Phase 7: Frontend UI Components

### Task 7.1: Layout + Palette

**Files:**
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/StatusBar.tsx`
- Create: `frontend/src/components/palette/ComponentPalette.tsx`
- Create: `frontend/src/components/palette/PaletteItem.tsx`
- Create: `frontend/src/hooks/useDragDrop.ts`

- [ ] **Step 1: Create AppShell** — 3-column CSS grid (260px | 1fr | 320px), 3 rows (48px | 1fr | 32px)
- [ ] **Step 2: Create TopBar** — session selector, stack badges, version indicator, auth dot, Review button, Auto-arrange button
- [ ] **Step 3: Create StatusBar** — node/edge/flow counts, layout algo, zoom, save status
- [ ] **Step 4: Create PaletteItem** — mini SVG preview + label + keywords. Draggable with `dataTransfer.setData("symbol_type", ...)`
- [ ] **Step 5: Create ComponentPalette** — search bar, tag filters, collapsible categories, scrollable list of PaletteItems
- [ ] **Step 6: Create useDragDrop hook** — onDrop handler for canvas: read symbol_type from dataTransfer, create node, run ELK for new node placement
- [ ] **Step 7: Commit**

```bash
git commit -m "feat: app layout, top bar, status bar, component palette with drag-drop"
```

---

### Task 7.2: Right Panel (Suggestions + Follow-up + Adapt)

**Files:**
- Create: `frontend/src/components/panels/RightPanel.tsx`
- Create: `frontend/src/components/panels/SuggestionsPanel.tsx`
- Create: `frontend/src/components/panels/FollowUpPanel.tsx`
- Create: `frontend/src/components/panels/AdaptPanel.tsx`
- Create: `frontend/src/components/panels/SkillAdaptForm.tsx`
- Create: `frontend/src/components/panels/SkillTree.tsx`
- Create: `frontend/src/hooks/useAI.ts`
- Create: `frontend/src/hooks/useSkills.ts`

- [ ] **Step 1: Create RightPanel** — 3 tabs: Suggestions | Follow-up | Adapt
- [ ] **Step 2: Create SuggestionsPanel** — missing component cards with symbol preview, "+ Add to Diagram" button, "Dismiss" button
- [ ] **Step 3: Create FollowUpPanel** — multiple-choice questionnaire, submit sends answers to backend, updated suggestions replace current
- [ ] **Step 4: Create SkillAdaptForm** — target subskill input (dropdown + new), decision checkboxes, keyword tags, impact preview, approve/discard buttons
- [ ] **Step 5: Create SkillTree** — rendered tree with root → subskill leaves, expandable to show decisions/patterns/overrides, "+ Create new subskill"
- [ ] **Step 6: Create AdaptPanel** — tabbed container: Adapt Skill tab (SkillAdaptForm) | Skill Tree tab (SkillTree)
- [ ] **Step 7: Create useAI + useSkills hooks**
- [ ] **Step 8: Commit**

```bash
git commit -m "feat: right panel with suggestions, follow-up, and skill adaptation"
```

---

### Task 7.3: Canvas Mode Toggle + Minimap

**Files:**
- Create: `frontend/src/components/canvas/ModeToggle.tsx`
- Create: `frontend/src/components/canvas/Minimap.tsx`

- [ ] **Step 1: Create ModeToggle** — floating bar: Stage | Flow | Steps | Map. Switching mode triggers backend AI call to restructure diagram.
- [ ] **Step 2: Create Minimap** — scaled-down overview in bottom-right corner
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: canvas mode toggle and minimap"
```

---

## Phase 8: Review Modal

### Task 8.1: Review Modal (4 Steps)

**Files:**
- Create: `frontend/src/components/review/ReviewModal.tsx`
- Create: `frontend/src/components/review/ScoreSummary.tsx`
- Create: `frontend/src/components/review/DiffView.tsx`
- Create: `frontend/src/components/review/SuggestionsStep.tsx`
- Create: `frontend/src/components/review/AdaptStep.tsx`
- Create: `frontend/src/lib/diffEngine.ts`
- Create: `frontend/src/hooks/useSession.ts`

- [ ] **Step 1: Create diffEngine.ts** — compares v1 diagram with current. Returns: added nodes (in v2 not v1), removed nodes (in v1 not v2), moved nodes (same id, different position), edge changes.
- [ ] **Step 2: Create ReviewModal** — full-screen overlay with step indicator (Step N of 4), prev/next navigation, exit button
- [ ] **Step 3: Create ScoreSummary** — step 1: score display (color-coded), summary paragraph, issues list with severity icons
- [ ] **Step 4: Create DiffView** — step 2: two mini-canvases side by side. Left=v1 (added nodes faded), Right=current (new nodes green glow + NEW badge, moved nodes with ghost). Change summary bar at bottom.
- [ ] **Step 5: Create SuggestionsStep** — step 3: reuses SuggestionsPanel + FollowUpPanel components
- [ ] **Step 6: Create AdaptStep** — step 4: reuses AdaptPanel component
- [ ] **Step 7: Create useSession hook** — load/save session, version management
- [ ] **Step 8: Commit**

```bash
git commit -m "feat: review modal with 4-step flow (score, diff, suggestions, adapt)"
```

---

## Phase 9: Auth + Integration

### Task 9.1: Auth Gate

**Files:**
- Create: `frontend/src/components/auth/AuthGate.tsx`

- [ ] **Step 1: Create AuthGate** — first-launch screen. Calls `GET /api/auth/status` to detect CLI. Shows: "Claude CLI detected ✓ — Use CLI" button OR "Paste API key" input. Saves choice to backend.
- [ ] **Step 2: Commit**

```bash
git commit -m "feat: auth gate (CLI detection + API key fallback)"
```

---

### Task 9.2: Skill Files

**Files:**
- Create: `skills/intelligent-arch-creator/skill.md`
- Create: `skills/intelligent-arch-creator/keywords.yaml`
- Create: `skills/intelligent-arch-creator/subskills/order-processing.md`

- [ ] **Step 1: Create skill.md** — main skill instructions as defined in spec Section 8

- [ ] **Step 2: Create keywords.yaml** — initial mappings for order-processing subskill

- [ ] **Step 3: Create sample subskill** — order-processing.md with 3 decisions, 4 patterns, 2 symbol overrides

- [ ] **Step 4: Commit**

```bash
git add skills/
git commit -m "feat: intelligent-arch-creator skill files"
```

---

### Task 9.3: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md** with build commands, architecture summary, key conventions

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: CLAUDE.md for new architecture"
```

---

### Task 9.4: End-to-End Smoke Test

- [ ] **Step 1: Start the app**

```bash
docker compose up --build
```

- [ ] **Step 2: Verify health**

```bash
curl http://localhost:18000/health
```

- [ ] **Step 3: Push a test architecture via API**

```bash
curl -X POST http://localhost:18000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context":{"project_name":"test","detected_stack":["fastapi"]},"architecture":{"title":"Test","mode":"stage_diagram","nodes":[{"id":"n1","symbol_type":"api_service","name":"Test API","props":{"endpoints":["GET /"]},"position":{"x":0.5,"y":0.5},"layer":0}],"edges":[],"flows":[]}}'
```

- [ ] **Step 4: Open frontend at http://localhost:13000 — verify diagram renders**

- [ ] **Step 5: Test MCP server**

```bash
echo '{"method":"tools/call","params":{"name":"check_app_health","arguments":{}}}' | python mcp-server/server.py
```

- [ ] **Step 6: Commit any fixes**

```bash
git commit -m "test: end-to-end smoke test passing"
```

---

## Checkpoint Summary

| Phase | Tasks | Delivers |
|-------|-------|----------|
| 0 | 0.1–0.4 | Clean slate, scaffold, Docker, symbols.yaml |
| 1 | 1.1–1.3 | Backend running with health endpoint + DB |
| 2 | 2.1–2.3 | Symbol registry, AI engine, skill manager |
| 3 | 3.1–3.4 | All backend API routes + WebSocket |
| 4 | 4.1 | MCP server (5 tools) |
| 5 | 5.1–5.3 | Frontend scaffold, types, stores, API client |
| 6 | 6.1–6.3 | SVG symbols, canvas, layout engine, routing |
| 7 | 7.1–7.3 | App layout, palette, right panel, mode toggle |
| 8 | 8.1 | Review modal with 4-step flow |
| 9 | 9.1–9.4 | Auth gate, skill files, CLAUDE.md, smoke test |

**Review checkpoints:** After Phase 1 (backend boots), Phase 4 (MCP works), Phase 6 (canvas renders), Phase 9 (end-to-end).
