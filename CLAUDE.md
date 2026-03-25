# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Intelligent Arch Viewer** — An MCP-backed architecture visualization app that generates, reviews, and refines system diagrams through Claude's analysis of codebases.

Four components:
1. **MCP server** (`mcp-server/`) — Exposes `check_app_health` and `push_architecture` tools to Claude. Runs as stdio process.
2. **Backend** (`backend/`) — FastAPI app. Stores sessions/diagrams, serves symbols.yaml, handles Claude streaming via CLI subprocess or direct API.
3. **Frontend** (`frontend/`) — React + TypeScript + ReactFlow canvas. SSE streaming for AI suggestions. Dark theme with animated SVG symbols.
4. **Skill files** (`skills/intelligent-arch-creator/`) — Claude skill package that uses the MCP tools to analyze repos and push diagrams.

## Commands

```bash
# Start everything (backend on :18000, frontend on :13000)
docker compose up --build

# Backend only (hot-reload enabled)
docker compose up backend

# Frontend only (Vite dev server, hot-reload enabled)
docker compose up frontend

# Run backend tests
cd backend && python -m pytest tests/ -v

# MCP server (stdio mode, NOT Docker)
# Used by Claude desktop app via .mcp.json config
python mcp-server/server.py

# Frontend type check
cd frontend && npx tsc --noEmit
```

## Architecture

### Backend (FastAPI, port 18000)
- **SQLite** by default (`data/arch_viewer.db`). Schema auto-created on startup.
- **Dual auth mode**: `CLAUDE_AUTH_MODE=cli` (uses `claude` CLI subprocess) or `api` (uses Anthropic SDK with `ANTHROPIC_API_KEY`).
- **Routes**:
  - `POST /api/sessions` — Create session with diagram
  - `GET /api/sessions/:id` — Retrieve session
  - `GET /api/symbols` — Return symbols.yaml (canonical symbol instruction set)
  - `POST /api/ai/review` — Claude review of diagram (SSE stream)
  - `POST /api/ai/suggestions` — Claude suggestions (SSE stream)
  - `WS /api/ws/:session_id` — WebSocket for live updates
- **Services**:
  - `claude_service.py` — Three-driver routing: CLI subprocess, Anthropic API, or AWS Bedrock
  - `scanner.py` — Placeholder for future filesystem scanning
  - `watcher.py` — Filesystem watcher (watchdog + asyncio bridge)

### Frontend (React + TypeScript, port 13000)
- **ReactFlow** canvas with custom node/edge rendering
- **Zustand** for global state (nodes, edges, flows, preferences)
- **SSE streaming** via `fetch` + `ReadableStream` (no polling)
- **Dark theme**: `bg-zinc-900`, neon accents for symbols
- **6 connection ports per node**: top, top-right, right, bottom, bottom-left, left
- **Components**:
  - `ArchCanvas.tsx` — Main canvas, drag-drop from palette
  - `CustomNode.tsx` — SVG symbol renderer (reads symbols.yaml shape specs)
  - `ComponentPalette.tsx` — Draggable symbol library
  - `ReviewPanel.tsx` — 4-step modal (collect constraints → analyze → review → adapt)
  - `RightPanel.tsx` — Suggestions, follow-up, adapt tabs

### MCP Server (stdio)
- **FastMCP** framework (`mcp.server.fastmcp`)
- Two tools:
  - `check_app_health()` — Health check before pushing
  - `push_architecture(payload)` — POST session to backend
- Connects to backend at `http://localhost:18000` (configurable via `BACKEND_URL`)

### Skill files (`skills/intelligent-arch-creator/`)
- **symbols.yaml** — Canonical symbol instruction set. Defines shapes (horizontal_cylinder, container_box, diamond_stack, hexagon, rounded_rect, circle, cloud), internal elements (partition_lane, message_block, key_pattern_text, etc.), 6-port layout, color palette, and symbol library (kafka_broker, kafka_topic, redis_cache, postgres_db, api_service, load_balancer, client_actor, external_service).
- **skill.md** — Claude skill instructions for using the MCP tools
- **keywords.yaml** — Keyword hints for symbol detection
- **subskills/** — Specialized analysis patterns

## Key conventions

### Symbol instruction set
All symbols defined in `skills/intelligent-arch-creator/symbols.yaml`. Both the skill and the frontend read from this file. No hardcoded symbol definitions elsewhere.

**Shapes**: horizontal_cylinder (Kafka topics, databases), container_box (brokers, clusters), diamond_stack (Redis cache), hexagon (API services), rounded_rect (load balancers, gateways), circle (clients, users), cloud (external services).

**Internal elements**: partition_lane, message_block, key_pattern_text, endpoint_text, row_line, animated_message, subscriber_pulse, status_indicator.

**Props schema**: Each symbol defines `props_schema` with typed fields (string, integer, enum, string_array, object types like topic_def/channel_def).

### Node positions
Stored as **0.0-1.0 fractions** in the database. Converted to pixels on canvas based on viewport dimensions. This makes diagrams resolution-independent.

### 6 connection ports
Every node has exactly 6 ports:
- `top` — center-top
- `top-right` — right edge, 25% from top
- `right` — center-right
- `bottom` — center-bottom
- `bottom-left` — left edge, 75% from top
- `left` — center-left

Edges specify `source_port` and `target_port` for explicit routing.

### Dark theme colors
Background: `bg-zinc-900` (#18181b)
Symbol categories use neon palette:
- **messaging**: `#ef4444` (red) — Kafka, Redis Pub/Sub
- **database**: `#3b82f6` (blue) — PostgreSQL
- **cache**: `#ef4444` (red) — Redis cache
- **api**: `#059669` (green) — FastAPI, services
- **infrastructure**: `#0ea5e9` (cyan) — load balancers
- **client**: `#8b5cf6` (purple) — browsers, users
- **external**: `#6b7280` (gray) — third-party services

### Auth modes
Three modes controlled by `CLAUDE_AUTH_MODE` env var:
1. **cli** (default) — Uses `claude` CLI subprocess. No API key required. Best for Pro subscription users.
2. **api** — Uses Anthropic SDK with `ANTHROPIC_API_KEY`. Direct API calls.
3. **bedrock** — AWS Bedrock via boto3 (future use case, code ready but not in default .env.example).

CLI mode always uses latest model from subscription. API mode uses `CLAUDE_MODEL` env var (defaults to SDK's latest if empty).

## Port assignments

- **Backend**: Host `18000` → Container `8000`
- **Frontend**: Host `13000` → Container `13000`
- **MCP server**: stdio (no port, runs as subprocess)

## Project memory

The `.claude/` directory tracks project decisions:
- `MEMORY.md` — Decision log (append-only)
- `APPROACHES.md` — Alternative approaches considered
- `CONSTRAINTS.md` — Hard constraints (10 rules)
- `PROGRESS.md` — File checklist
- `REVISIONS.md` — Change tracking

## Development notes

- **No hardcoded model versions** — CLI uses latest, API uses `CLAUDE_MODEL` env var
- **App never auto-saves to skill files** — explicit approval required
- **Skill must check app health before push** — `check_app_health()` call required
- **All edges always visible** — never hidden behind nodes (z-index ordering)
- **SSE/WebSocket for streaming** — no polling
- **TypeScript strict mode** — no implicit any
- **SQLite default, PostgreSQL optional** — DB path via `DATABASE_PATH` env var

## Testing

Backend tests use pytest with async fixtures:
- `tests/conftest.py` — Shared fixtures (test client, in-memory DB)
- `tests/test_health.py` — Health endpoint
- `tests/test_db.py` — Session CRUD

Frontend type checking via `npx tsc --noEmit` (no runtime tests yet).

## Files to edit when adding new symbols

1. **skills/intelligent-arch-creator/symbols.yaml** — Add symbol definition
2. **skills/intelligent-arch-creator/keywords.yaml** — Add keyword hints
3. **Frontend automatically picks up changes** — reads symbols.yaml from backend `/api/symbols` endpoint

No code changes needed in frontend components — symbol rendering is data-driven via the YAML spec.
