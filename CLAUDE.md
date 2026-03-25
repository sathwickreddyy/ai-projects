# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**arch-platform** — an AI-powered architecture diagram generator. Users register code projects, the platform scans their files, detects the tech stack, and uses Claude to generate interactive architecture diagrams. Users can review, edit, and export diagrams via a React Flow canvas.

## Commands

```bash
# Start everything (Postgres, backend, frontend, watcher)
docker compose up --build

# Backend only (hot-reload via uvicorn)
docker compose up backend

# Frontend only (Vite dev server)
docker compose up frontend

# Run the file watcher (marks projects stale on filesystem changes)
docker compose up watcher

# MCP server (stdio transport — NOT a Docker service)
python mcp-server/server.py
```

Backend: http://localhost:18000 | Frontend: http://localhost:13000 | Health check: GET /health

No test suite exists yet. No linter configuration.

## Architecture

### Services (docker-compose.yml)

- **postgres** (port 15432) — PostgreSQL 16 with `postgres/init.sql` for schema + seed data
- **backend** (port 18000) — FastAPI + SQLAlchemy async, hot-reloads from `./backend`
- **frontend** (port 13000) — React 18 + Vite + Tailwind + React Flow (@xyflow/react)
- **watcher** — same backend image running `app.services.watcher` to detect filesystem changes in `./projects/`
- **mcp-server** — stdio-based MCP server (launched by Claude Code, not Docker). Configured in `.claude.json`

### Backend (`backend/app/`)

- `core/config.py` — Pydantic Settings. Three auth modes for Claude: `cli`, `bedrock`, `api`. Set via `CLAUDE_AUTH_MODE` env var. Validated at startup in `main.py` lifespan.
- `db/session.py` — All SQLAlchemy models (Project, Architecture, UserPreference, ComponentLibrary, Skill, ClaudeReview, ChangeLog) and async session factory. No Alembic migrations — schema comes from `postgres/init.sql`.
- `services/claude_service.py` — Three parallel driver implementations (CLI subprocess, Bedrock boto3, Anthropic SDK) behind a unified `_complete()` / `_stream()` router. Public functions: `generate_architecture()`, `stream_review()`, `apply_preference_change()`. Active skills from DB are injected into the system prompt.
- `services/scanner.py` — Walks a project directory, reads relevant files (priority-scored), runs `detect_stack()` keyword matching. Respects `MAX_FILES=40` and `MAX_CONTEXT=120000` char limits.
- `services/watcher.py` — Watchdog-based filesystem observer. Debounces events (3s) and marks projects as stale in Postgres via JSONB update.
- `api/` — REST routers: `projects`, `architectures`, `components`, `preferences`, `skills`, `claude`, `ws` (WebSocket review streaming)

### Frontend (`frontend/src/`)

- **State**: Zustand store (`stores/appStore.ts`) is the single source of truth for nodes, edges, active project/architecture, review state
- **API**: All HTTP calls go through `api/client.ts` (axios). SSE streaming uses `fetch()` + `getReader()`, NOT EventSource (POST required)
- **Canvas**: React Flow with `CustomNode.tsx` and `CustomEdge.tsx`. Component palette uses drag-and-drop via `dataTransfer`
- **Types**: `types/index.ts` defines all shared interfaces (Project, Architecture, ArchNode, ArchEdge, ReviewFeedback, etc.)

### Key Conventions

- Node positions stored as 0.0-1.0 fractions in DB. Canvas multiplies by 1200x700 for pixels. Drag-end divides back before PATCH.
- Claude model: `claude-sonnet-4-20250514` for all API/CLI calls; Bedrock model configurable via `BEDROCK_MODEL_ID`
- Architecture modes: `animated_flow`, `step_by_step`, `stage_diagram`, `mental_map`
- PNG export uses `html-to-image` on `#arch-canvas-wrapper`, filtering out controls/minimap
- `.claude/` files are append-only project documentation (APPROACHES, CONSTRAINTS, PROGRESS, REVISIONS)

### Database

PostgreSQL with `uuid-ossp` extension. Tables: `projects`, `architectures`, `user_preferences`, `component_library` (seeded with 18 components across queue/database/api/infrastructure categories), `skills` (3 default system skills), `claude_reviews`, `change_log`. All PKs are UUID.

### Environment Setup

Copy `.env.example` to `.env` and set `CLAUDE_AUTH_MODE` + corresponding credentials:
- `api` (default for Docker): set `ANTHROPIC_API_KEY`
- `bedrock`: set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `cli`: requires `claude` CLI on PATH (host-only, not Docker)

### Sample Project

`projects/sample-fastapi-app/` is a demo order-processing microservice (FastAPI + Kafka + Redis + PostgreSQL) used to test architecture generation. The scanner's `detect_stack()` must detect all four technologies from these files.
