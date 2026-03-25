# System Architecture

## Components

1. **MCP Server** (`mcp-server/server.py`) — stdio transport, 5 tools: check_app_health, push_architecture, pull_latest_state, list_sessions, get_skill_tree. Zero logic, pure HTTP pass-through to backend.

2. **Backend** (`backend/`) — FastAPI + SQLite (aiosqlite). Three service layers:
   - `services/symbol_registry.py` — parses symbols.yaml
   - `services/ai_engine.py` — dual-driver Claude calls (CLI subprocess or Anthropic SDK)
   - `services/skill_manager.py` — reads/writes skill files on disk

3. **Frontend** (`frontend/`) — React 18 + TypeScript strict + Tailwind. Custom SVG canvas (not React Flow). ELK.js for layout. Zustand for state.
   - 7 SVG shape components + 8 internal element renderers
   - 6-port connection system + orthogonal edge routing
   - 3-tab right panel (suggestions, follow-up, skill adaptation)
   - 4-step review modal
   - Auth gate (CLI detection + API key fallback)

4. **Skill Files** (`skills/intelligent-arch-creator/`) — skill.md (instructions), symbols.yaml (shared contract), keywords.yaml (subskill index), subskills/ (learned patterns)

## Data Flow

Skill analyzes project → generates context envelope JSON → MCP push_architecture → backend stores session + v1 diagram → frontend renders → user modifies → review via Claude → skill adaptation with explicit approval

## Spec

Full spec: `docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md`
Implementation plan: `docs/superpowers/plans/2026-03-25-intelligent-arch-viewer.md`
