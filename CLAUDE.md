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

1. **MCP Server** (`mcp-server/server.py`) — stdio transport, FastMCP. 5 tools: `check_app_health`, `push_architecture`, `pull_latest_state`, `list_sessions`, `get_skill_tree`. Zero logic — pure HTTP pass-through to backend at `http://localhost:18000`.

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

## Specs & Plans

- Design spec: `docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md`
- Implementation plan: `docs/superpowers/plans/2026-03-25-intelligent-arch-viewer.md`
