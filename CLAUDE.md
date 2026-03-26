# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Intelligent Arch Viewer** — an MCP-backed architecture visualization app. A Claude Code skill (`intelligent-arch-creator`) analyzes codebases, generates structured architecture JSON, and pushes it to this app for interactive visualization with proper SVG infrastructure symbols, AI-powered review, and skill learning.

## Commands

```bash
# Start everything (backend :18000, frontend :13000)
docker compose up --build

# Backend only (hot-reload)
docker compose up backend

# Frontend only (Vite dev)
docker compose up frontend

# Backend tests (34 passing)
cd backend && ./venv/bin/python -m pytest tests/ -v

# Frontend type check (0 errors)
cd frontend && npx tsc --noEmit

# MCP server (stdio, NOT Docker — launched by Claude Code)
python mcp-server/server.py
```

## Architecture

### Four Components

1. **MCP Server** (`mcp-server/server.py`) — stdio transport, FastMCP. 6 tools: `check_app_health`, `push_architecture`, `pull_latest_state`, `list_sessions`, `get_skill_tree`, `install_skill`. Zero logic — pure HTTP pass-through to backend at `http://localhost:18000`.

2. **Backend** (`backend/`) — FastAPI, Python 3.12, SQLite (aiosqlite). Port 18000 (host) → 8000 (container).
   - `app/core/config.py` — Pydantic Settings. Two auth modes: `cli` (Claude CLI subprocess) and `api` (Anthropic SDK). No hardcoded model versions.
   - `app/db/session.py` — SQLAlchemy async models: Session, Diagram, Review, SkillAdaptation, AuthConfig. Schema auto-created on startup.
   - `app/services/ai_engine.py` — Dual-driver Claude integration (CLI subprocess or Anthropic SDK). 5 methods: review, stream_review, answer_followup, generate_adaptation, preview_impact.
   - `app/services/symbol_registry.py` — Parses `symbols.yaml`, provides palette items and compact type list for prompts.
   - `app/services/skill_manager.py` — Reads/writes skill files on disk. NEVER auto-saves — explicit approval required.
   - `app/api/` — 7 route groups: sessions, diagrams, ai, ws, skills, symbols, auth.

3. **Frontend** (`frontend/`) — React 18, TypeScript strict, Vite 5, Tailwind CSS 3, Zustand, ELK.js. Port 13000.
   - Custom SVG canvas (not React Flow) with pan/zoom, 7 symbol shapes, 6-port connections, orthogonal edge routing.
   - 3-column layout: palette (260px) | canvas (flex) | right panel (320px).
   - Right panel: Suggestions | Follow-up | Adapt tabs.
   - Review modal: 4-step flow (score, diff, suggestions, skill adaptation).
   - Auth gate on first launch (CLI detection + API key fallback).

4. **Skill Files** (`skills/intelligent-arch-creator/`) — `skill.md` (instructions), `symbols.yaml` (shared symbol contract), `keywords.yaml` (subskill index), `subskills/` (learned patterns).

### Key Conventions

- **Symbol types** defined ONLY in `symbols.yaml` — both skill and app read this file. Adding a new symbol: edit YAML only, no code changes.
- **Node positions**: 0.0-1.0 fractions in DB. Canvas multiplies by 1200x700 for pixels.
- **6 connection ports** per node: top, top-right, right, bottom, bottom-left, left.
- **Edges always visible** — rendered above background, below nodes. Orthogonal routing avoids node overlaps.
- **Auth**: CLI uses latest model (no --model flag). API uses CLAUDE_MODEL env var (empty = SDK default).
- **Skill adaptation**: app proposes → user reviews in Adapt tab → explicitly approves → writes to disk.
- **Docker prerequisite**: skill calls `check_app_health()` before `push_architecture()`.

### Dark Theme Palette

| Token | Hex |
|-------|-----|
| bg | `#0a0a0f` |
| surface | `#0f1117` |
| panel | `#161b27` |
| border | `#1e2430` |
| text | `#c9d1e0` |
| muted | `#6b7280` |
| accent | `#2563eb` |

### Category Colors

messaging `#ef4444`, database `#3b82f6`, cache `#ef4444`, api `#059669`, infrastructure `#0ea5e9`, client `#8b5cf6`, external `#6b7280`

## Project Memory

`.claude/` directory (project-level) with split files for minimal token consumption:
- `INDEX.md` — pointer file, always loaded (~20 lines)
- `decisions/` — one file per architectural decision (11 decisions logged)
- `design/` — architecture, canvas, skill system, symbol system
- `CONSTRAINTS.md` — 10 hard rules

## MCP Configuration

`.claude.json` (project-level) configures the `arch-viewer` MCP server with stdio transport.

**One-time venv setup** (required before MCP works):
```bash
python3 -m venv mcp-server/venv
mcp-server/venv/bin/pip install -r mcp-server/requirements.txt
```

`.claude.json` uses the absolute path to the venv's Python so the server works from any project directory. To add it to another project (run from inside that project directory):
```bash
claude mcp add arch-viewer --scope project --transport stdio \
  -- /Users/sathwick/my-office/learning-projects/ai-projects/mcp-server/venv/bin/python \
  /Users/sathwick/my-office/learning-projects/ai-projects/mcp-server/server.py
```

**Why stdio (not SSE)?** The MCP server is a host-side subprocess. The backend is what calls Claude. In `cli` auth mode the backend must also run on the host (the `claude` binary can't run in a Linux Docker container). In `api` mode the backend can stay in Docker — stdio is still the simplest transport.

## Specs & Plans

- Design spec: `docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md`
- Implementation plan: `docs/superpowers/plans/2026-03-25-intelligent-arch-viewer.md`

---

## Build Summary (2026-03-25)

### What Was Built

Complete clean-slate rebuild of the project. Previous implementation (standalone web platform with PostgreSQL, React Flow, emoji-based nodes) was deleted entirely. New system built from scratch across 65 commits:

- **18 Python backend files** — FastAPI app with 7 API route groups, 3 services (AI engine, symbol registry, skill manager), 5 SQLAlchemy models, WebSocket endpoint
- **52 TypeScript frontend files** — Custom SVG canvas, 7 shape components + 8 internal element renderers, ELK.js layout, 6-port connection system, 3-tab right panel, 4-step review modal, auth gate
- **1 MCP server** — 5 tools (health check, push, pull, list, skill tree)
- **4 skill files** — skill.md, symbols.yaml (meta-schema + 10 symbol definitions), keywords.yaml, 1 sample subskill
- **34 backend tests passing**, 0 TypeScript errors

### Key Decisions Made

| # | Decision | Why |
|---|----------|-----|
| 001 | Clean slate rebuild | Old arch fundamentally different — no code to reuse |
| 002 | Monolith + MCP bridge | Single deployable unit; MCP as thin pass-through, not microservices |
| 003 | Custom SVG, not React Flow | React Flow too opinionated for 7 shape types with internal elements |
| 004 | symbols.yaml shared contract | One file drives both skill generation and app rendering |
| 005 | CLI or API key auth | No OAuth registration needed; no hardcoded model versions |
| 006 | Skill/subskill learning | Explicit approval required; user targets specific subskill manually |
| 007 | 4-step review modal | Full-screen focused flow beats cramped inline panel |
| 008 | Proper infra symbols | Horizontal cylinders stacked vertically, not emojis |
| 009 | Docker prerequisite | Skill checks health before pushing — prevents silent failures |
| 010 | SQLite default | PostgreSQL deferred to v2; single-user local dev is the primary use case |
| 011 | ELK.js layout | Layered algorithm for stage diagrams, force-directed for mental maps |

Full decision details: `.claude/decisions/001-011`

### What's NOT Done Yet (Next Steps)

**Immediate (v1 polish):**
- End-to-end smoke test with `docker compose up` — built but not run yet
- Wire the RightPanel placeholder in AppShell to the actual RightPanel component (may already be done by subagent)
- Test MCP push_architecture flow from Claude Code to the running app
- Verify auth gate flow in the browser (CLI detection → API key fallback)

**Short-term (v1.1):**
- Edge routing obstacle avoidance — current routing does L/Z bends but doesn't actively avoid crossing other nodes
- Diagram persistence — PATCH endpoint creates new versions but frontend doesn't debounce saves on drag yet
- Export functionality — PNG (html-to-image on canvas wrapper), Mermaid, draw.io XML
- WebSocket review streaming in frontend — useAI hook is wired to SSE, WS client exists but not integrated into review flow

**Medium-term (v2):**
- PostgreSQL support for team/multi-user deployments
- Real-time collaboration via WebSocket (multiple users editing same diagram)
- More symbol types (RabbitMQ, MongoDB, Cassandra, gRPC, GraphQL, Kubernetes, etc.)
- Symbol detail zoom levels — hide internal elements at <50% zoom for performance
- Subskill auto-detection — suggest matching subskills based on detected stack without user intervention
- Diagram history timeline — visual diff slider between versions

**Long-term:**
- Global skill sharing — move proven subskills from project-level to global
- Diagram templates — pre-built starting points for common architectures
- Code generation — generate infrastructure-as-code from diagram (Terraform, Docker Compose, K8s manifests)
