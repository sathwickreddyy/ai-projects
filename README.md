# Intelligent Arch Viewer

An AI-powered architecture diagram tool that works with [Claude Code](https://claude.ai/code). Point it at any codebase and get an interactive, editable architecture diagram with proper infrastructure symbols — not boxes and arrows, but Kafka brokers with topic cylinders, Redis with animated pub/sub channels, PostgreSQL with table rows, and more.

The tool learns from your modifications. When you fix a diagram, those decisions get saved as reusable patterns that improve all future diagrams for similar systems.

## What It Does

1. **You run a skill in Claude Code** — it scans your project, detects the tech stack, and generates a structured architecture diagram
2. **The diagram opens in your browser** — interactive canvas with proper SVG symbols for each infrastructure component
3. **You modify it** — drag-drop components from the palette, connect edges between 6 ports per node, auto-arrange with ELK.js layout
4. **AI reviews your architecture** — scores it, flags missing components (no DLQ? no read replica?), asks follow-up questions
5. **Your changes become learnings** — approve adaptations that get saved to skill files, so next time you diagram a similar system, it starts smarter

## Prerequisites

- [Claude Code](https://claude.ai/code) (CLI, desktop app, or IDE extension)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- One of:
  - Claude Pro/Max subscription (uses `claude` CLI — no API key needed)
  - Anthropic API key

## Quick Start

### 1. Clone and configure

```bash
git clone <this-repo>
cd <this-repo>

# Copy environment template
cp .env.example .env
```

Edit `.env` and set your auth mode:

```env
# Option A: Use your Claude subscription (recommended)
CLAUDE_AUTH_MODE=cli

# Option B: Use an API key
CLAUDE_AUTH_MODE=api
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Start the app

```bash
docker compose up --build
```

Wait for both services to be ready:
- Backend: http://localhost:18000/health
- Frontend: http://localhost:13000

### 3. Set up the MCP server in Claude Code

The MCP server needs its own Python venv with the `mcp` package. Run this once from the project root:

```bash
python3 -m venv mcp-server/venv
mcp-server/venv/bin/pip install -r mcp-server/requirements.txt
```

**Using from this project directory:** The `.claude.json` is already configured. Claude Code picks it up automatically when you open this project.

**Using from another project directory:** Run this from inside that project (creates a `.mcp.json` local to it):

```bash
claude mcp add arch-viewer \
  --scope project \
  --transport stdio \
  -- /Users/sathwick/my-office/learning-projects/ai-projects/mcp-server/venv/bin/python \
  /Users/sathwick/my-office/learning-projects/ai-projects/mcp-server/server.py
```

Repeat this once per project you want to push diagrams from.

Verify it works (start `docker compose up` first, then in Claude Code):

```
> Use the arch-viewer MCP to check if the app is healthy
```

### Why stdio and not SSE/HTTP transport?

The MCP server runs on your **host machine** (not in Docker) because it's a subprocess of Claude Code. The auth mode determines whether the backend also needs to be on the host:

| Auth mode | Backend location | Why |
|-----------|-----------------|-----|
| `cli` (Pro/Max subscription) | **Must run on host** | The `claude` binary is a macOS executable — it can't run inside a Linux container. If backend is in Docker, cli mode fails. |
| `api` (API key) | Can run in Docker | No dependency on the host `claude` binary. `docker compose up` works normally. |

For `cli` mode: start the backend directly on your machine instead of via Docker:
```bash
# Start only the frontend in Docker
docker compose up frontend

# Run backend on host with your subscription auth
cd backend && CLAUDE_AUTH_MODE=cli uvicorn app.main:app --port 8000 --reload
```

### 4. Install the skill

The `intelligent-arch-creator` skill tells Claude Code how to analyze codebases and generate diagrams. Install it from the running backend (make sure `docker compose up` is running first):

In Claude Code, ask:
```
> Use the arch-viewer MCP to install the skill
```

This calls `install_skill(scope="project")` which fetches the skill files from the backend and writes them to `.claude/commands/intelligent-arch-creator/` in your current project. After installation:

- `/intelligent-arch-creator` becomes available as a slash command
- Or you can just describe what you want — Claude will follow the skill instructions

To install globally (available in all projects):
```
> Use arch-viewer to install the skill with user scope
```

### 5. Generate your first diagram

Open Claude Code in any project you want to diagram:

```
> Analyze this codebase and generate an architecture diagram
```

Or use the slash command directly:
```
> /intelligent-arch-creator
```

Claude will:
1. Check the viewer app is running
2. Ask you for scan depth (Quick/Standard/Deep)
3. Scan your project files in priority order
4. Detect the tech stack (Kafka, Redis, PostgreSQL, FastAPI, etc.)
5. Load matching subskills for learned patterns
6. Generate a structured architecture with proper SVG symbols
7. Push it to the viewer
8. Give you a URL to open in your browser

### 6. Work with the diagram

Once the diagram opens at `http://localhost:13000`:

- **Drag components** from the left palette onto the canvas
- **Connect nodes** by dragging between the 6 ports on each node
- **Auto-arrange** — click the button in the top bar to clean up the layout
- **Switch modes** — Stage (layered), Flow (animated), Steps (sequential), Map (force-directed)
- **Review** — click "Review" for AI analysis with scoring, suggestions, and follow-up questions
- **Adapt skills** — approve modifications so future diagrams start with your learned patterns

## How the Skill System Works

The viewer doesn't just make static diagrams — it learns.

```
intelligent-arch-creator/          ← main skill
  skill.md                         ← instructions for Claude Code
  symbols.yaml                     ← what symbols exist and how they render
  keywords.yaml                    ← maps tech keywords to subskills
  subskills/
    order-processing.md            ← learned: "always add DLQ for Kafka"
    proximity-service.md           ← learned: "use Redis GEO for <10km"
    ...                            ← your patterns accumulate here
```

When you approve an adaptation in the viewer:
1. The decision gets saved to a subskill file (e.g., "always include DLQ topic per consumer group")
2. Keywords get indexed (e.g., `kafka + order → :order-processing`)
3. Next time Claude diagrams a system with matching keywords, it loads those learned patterns

You control what gets saved. The app shows an impact preview before writing anything to disk.

## Symbol System

Every infrastructure component has a proper technical SVG representation:

| Component | Shape | What It Shows |
|-----------|-------|---------------|
| Kafka Broker | Container box | Topic cylinders stacked vertically inside |
| Kafka Topic | Horizontal cylinder | Partition lanes with message blocks |
| Redis Cache | Diamond stack | Key patterns (session:\*, cache:\*) |
| Redis Pub/Sub | Container box | Channel cylinders with animated messages |
| PostgreSQL | Horizontal cylinder | Table rows with names |
| API Service | Hexagon | Endpoint routes |
| Load Balancer | Rounded rectangle | Status indicator |
| Client | Circle | Type badge (browser, mobile, CLI) |
| External Service | Cloud | Provider name |

Symbols are defined in `skills/intelligent-arch-creator/symbols.yaml`. To add a new symbol, edit the YAML — no code changes needed. The file is self-describing: read the `meta:` section for the building blocks, then add an entry under `symbols:`.

## Project Structure

```
.
├── backend/                  # FastAPI + SQLite
│   ├── app/
│   │   ├── api/              # REST routes (sessions, diagrams, ai, skills, symbols, auth)
│   │   ├── core/             # Config (auth modes, model selection)
│   │   ├── db/               # SQLAlchemy models
│   │   └── services/         # AI engine, symbol registry, skill manager
│   └── tests/                # 34 pytest tests
├── frontend/                 # React + TypeScript + Tailwind
│   └── src/
│       ├── components/
│       │   ├── canvas/       # SVG canvas, node/edge rendering, ports, minimap
│       │   ├── symbols/      # 7 shape components + internal elements
│       │   ├── layout/       # AppShell, TopBar, StatusBar
│       │   ├── palette/      # Draggable component library
│       │   ├── panels/       # Suggestions, follow-up, skill adaptation
│       │   ├── review/       # 4-step review modal
│       │   └── auth/         # First-launch auth gate
│       ├── hooks/            # Canvas, layout, routing, AI, skills, session
│       ├── stores/           # Zustand (app state + symbol registry)
│       ├── lib/              # ELK layout, edge router, diff engine, symbol parser
│       └── api/              # REST client + WebSocket
├── mcp-server/               # MCP bridge (5 tools, stdio transport)
├── skills/                   # Skill files (shared with Claude Code)
│   └── intelligent-arch-creator/
├── .claude/                  # Project memory (decisions, design notes)
└── docs/superpowers/         # Design spec + implementation plan
```

## Ports

| Service | URL |
|---------|-----|
| Frontend | http://localhost:13000 |
| Backend | http://localhost:18000 |
| Health check | http://localhost:18000/health |

## Troubleshooting

**"Arch Viewer app is not running"** — The skill checks the app is healthy before pushing. Run `docker compose up` first.

**CLI auth not working in Docker** — The `claude` CLI is a host binary, not available inside Linux containers. Either run the backend on your host machine, or switch to `CLAUDE_AUTH_MODE=api` with an API key.

**Symbols not loading in palette** — The backend reads `symbols.yaml` from the skills directory. Make sure the `SKILLS_DIR` env var points to the right path (default: `./skills`).

**Frontend shows "arch-viewer loading..."** — The auth gate is waiting for backend. Check `docker compose logs backend` for errors.
