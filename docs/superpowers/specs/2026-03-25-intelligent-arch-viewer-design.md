# Intelligent Architecture Viewer — Design Spec

## Overview

An intelligent architecture visualization app that receives structured JSON from a Claude Code skill (`intelligent-arch-creator`), renders interactive diagrams with proper SVG infrastructure symbols, supports drag-drop modification, AI-powered reviews, and feeds learnings back into a skill/subskill system.

**This is a clean-slate rebuild** — the existing codebase is deleted and rebuilt from scratch.

---

## 1. System Architecture

Approach: **Monolith Web App + MCP Bridge**

Four components:

- **MCP Server** (stdio, thin bridge) — receives architecture payloads from Claude Code, forwards to backend. 5 tools: `check_app_health`, `push_architecture`, `pull_latest_state`, `list_sessions`, `get_skill_tree`.
- **Backend** (FastAPI, Python 3.12) — session management, AI engine (Claude API/CLI), skill file management, symbol registry, layout computation.
- **Frontend** (React 18, TypeScript strict, Tailwind CSS 3) — custom SVG canvas with pan/zoom, symbol rendering, drag-drop palette, review modal, skill adaptation panels.
- **Database** — SQLite for single-user local deployments. PostgreSQL as optional upgrade.

### Data Flow

1. User runs `intelligent-arch-creator` skill in Claude Code → skill does full analysis
2. Skill calls MCP tool `push_architecture(context_envelope)` → MCP forwards to backend `POST /api/sessions`
3. Backend stores session, returns URL → user opens in browser
4. Frontend renders diagram with SVG symbols, smart edge routing, auto-layout
5. User modifies diagram → changes saved via WebSocket in real-time
6. User clicks "Review" → backend calls Claude → streams review via WebSocket
7. User adapts skill → backend writes to skill files on disk after explicit approval
8. Claude Code can later call `pull_latest_state(session_id)` to fetch modifications

### Ports

| Service    | Host Port | Container Port |
|------------|-----------|----------------|
| Backend    | 18000     | 8000           |
| Frontend   | 13000     | 13000          |
| PostgreSQL | 15432     | 5432           |

---

## 2. Context Envelope

The JSON payload the skill sends to the app:

```json
{
  "context": {
    "project_name": "order-service",
    "project_path": "/path/to/project",
    "detected_stack": ["fastapi", "kafka", "redis", "postgres"],
    "user_intent": "design event-driven order processing",
    "skill_used": "intelligent-arch-creator",
    "skill_version": "1.0",
    "skill_path": "/path/to/skills/intelligent-arch-creator",
    "conversation_summary": "...",
    "preferences": { "layout_direction": "TB", "theme": "dark" }
  },
  "architecture": {
    "title": "Order Processing System",
    "mode": "stage_diagram",
    "nodes": [
      {
        "id": "api_1",
        "symbol_type": "api_service",
        "name": "Order API",
        "props": { "framework": "fastapi", "endpoints": ["POST /orders"] },
        "position": { "x": 0.5, "y": 0.1 },
        "layer": 0
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "api_1",
        "source_port": "bottom",
        "target": "kafka_1",
        "target_port": "top",
        "label": "Kafka produce →",
        "style": "animated",
        "color": "#ef4444"
      }
    ],
    "flows": [
      {
        "id": "f1",
        "name": "Order Write Path",
        "steps": ["api_1", "kafka_1", "pg_1"],
        "color": "#ef4444"
      }
    ]
  }
}
```

Key fields:
- `symbol_type` maps to the symbol instruction set — not generic types.
- `props` are symbol-specific (Kafka gets topics/partitions, Redis gets key patterns).
- `source_port`/`target_port` — one of 6 ports: `top`, `top-right`, `right`, `bottom`, `bottom-left`, `left`.
- `flows` — named paths for animated highlighting and review context.
- Positions stored as 0.0–1.0 fractions. Canvas converts to pixels.

---

## 3. Symbol Instruction Set (symbols.yaml)

A self-describing YAML schema shared between the skill (for generation) and the app (for rendering). Two sections: **meta-schema** (defines building blocks) and **symbol definitions** (follows those rules).

### Meta-Schema

**Shapes** (base SVG shapes for the outer form):
- `horizontal_cylinder` — storage/buffer concepts (topics, queues, databases). Ellipse caps + rect body. Does NOT support children. Supports internal elements.
- `container_box` — grouping (brokers, clusters). Rounded rect with header bar. Supports children (layout: vertical_stack, horizontal_stack, grid). No internal elements.
- `diamond_stack` — key-value stores (Redis). Diamond with 3D layered depth.
- `hexagon` — active processors (API services).
- `rounded_rect` — generic services, load balancers, gateways.
- `circle` — clients, users, external actors.
- `cloud` — external services, third-party APIs.

**Internal elements** (drawn inside shapes):
- `partition_lane` — vertical divider lanes (for Kafka partitions). Repeats from integer prop.
- `message_block` — small colored rects stacked bottom-to-top. Opacity decreases upward.
- `key_pattern_text` — monospace text lines (key patterns, table names, routes).
- `endpoint_text` — API endpoint labels.
- `row_line` — horizontal divider lines (table rows).
- `animated_message` — translating block (data flow animation).
- `subscriber_pulse` — pulsing circle at end-cap (active listeners).
- `status_indicator` — corner dot (health status).

**Ports** — every symbol gets 6 connection points:
- `top` (center-top), `top-right` (right edge 25% from top), `right` (center-right), `bottom` (center-bottom), `bottom-left` (left edge 75% from top), `left` (center-left).

**Animations**: `flow_dash` (edges), `pulse_glow` (nodes), `flow_through` (internal elements).

**Color palette** (category defaults):
- messaging: `#ef4444` / `#f87171`
- database: `#3b82f6` / `#60a5fa`
- cache: `#ef4444` / `#f87171`
- api: `#059669` / `#34d399`
- infrastructure: `#0ea5e9` / `#38bdf8`
- client: `#8b5cf6` / `#a78bfa`
- external: `#6b7280` / `#9ca3af`

**Prop types**: `string`, `integer`, `enum`, `string_array`, `topic_def` (object: name, partitions, color), `channel_def` (object: name, subscribers, color).

### Symbol Definitions

Each entry: pick a shape, pick internal elements (if supported), pick a category, define props_schema, define children (if container).

Initial symbols (10):
- `kafka_broker` — container_box with kafka_topic children (vertical_stack)
- `kafka_topic` — horizontal_cylinder with partition_lane + message_block
- `redis_cache` — diamond_stack with key_pattern_text
- `redis_pubsub` — container_box with pubsub_channel children (vertical_stack)
- `pubsub_channel` — horizontal_cylinder with animated_message + subscriber_pulse
- `postgres_db` — horizontal_cylinder with row_line + key_pattern_text
- `api_service` — hexagon with endpoint_text
- `load_balancer` — rounded_rect with status_indicator
- `client_actor` — circle
- `external_service` — cloud

Adding new symbols: follow the 5-step recipe documented in the YAML comments. Any AI model reads `meta:` to understand the building blocks, then adds an entry under `symbols:`.

Visual convention: horizontal cylinders stacked vertically when inside a container. Coloring follows category palette unless overridden.

---

## 4. Canvas & Layout Engine

### Canvas Stack

Custom SVG renderer (not React Flow — too opinionated for our symbol system):

1. Background (dot grid, theme-aware)
2. Edge layer (SVG paths — always rendered above background, routes around nodes)
3. Node layer (SVG symbol components)
4. Port overlay (6 ports per node, visible on hover/connect)
5. Interaction layer (drag, select, connect, drop from palette)
6. HUD overlay (mode toggle, minimap, zoom controls)

All connection lines, edges, and relationship arrows must always be visible — never hidden behind nodes. Edge layer renders with proper z-ordering.

### Layout Engine (ELK.js)

ELK (Eclipse Layout Kernel) compiled to JS for hierarchical/layered layouts:

- Algorithm: `layered` for stage_diagram/step_by_step, `force` for mental_map
- Direction: TB (top-to-bottom) default
- Port constraints: FIXED_SIDE (respects 6-port positions)
- Spacing: node=80px, edge=40px, layer=120px

Auto-layout triggers:
- Explicitly via "Auto-arrange" button
- On initial load from skill payload
- After drag-drop of new component (re-routes affected edges only)

### 6-Port Connection System

Ports appear as small circles on hover. Dragging from a port shows preview edge that snaps to nearest port on target. Auto-assignment picks shortest/cleanest port pair. Manual override: drag endpoint to different port.

### Edge Routing (Orthogonal)

For each edge:
1. Compute straight-line path between source_port → target_port
2. Check intersections with node bounding boxes
3. If blocked: route with L-shaped or Z-shaped bends (20px minimum clearance)
4. Check edge-edge crossings — add vertical offset to resolve
5. Apply bezier smoothing at bend points

Edge styles:
- Solid + arrow: synchronous (HTTP, gRPC)
- Dashed + animated: async/event (Kafka, pub/sub)
- Dotted: optional/fallback
- Color: from flow or explicit override

### Drag Behavior

- Node follows cursor immediately
- Connected edges re-route in real-time (simplified routing during drag)
- On drag-end: full routing recalculation for affected edges
- Positions saved to backend (debounced 500ms)

### Zoom Detail Levels

At <50% zoom: internal elements (partition lanes, endpoint text) hide for performance. Only outer shapes and labels shown.

---

## 5. Review Mode

Full-screen modal with 4 guided steps. User can navigate forward/back or jump to any step.

### Step 1: Score & Summary

- Diagram sent to Claude with review system prompt
- Response streams via WebSocket — raw chunks shown in monospace preview
- Parsed into: score (1-10, color-coded), summary, issues list, missing components, follow-up questions, suggested adaptations

### Step 2: Side-by-Side Diff

Two read-only canvases:
- Left: system-generated (v1 from skill)
- Right: user-modified (current state)
- Added nodes: green glow + NEW badge (right panel)
- Removed nodes: faded red + strikethrough (left panel)
- Moved nodes: ghost outline at old position
- Change summary bar at bottom: +N nodes, -N nodes, ~N edges

Diff logic matches nodes by `id`. Same id = check for position/prop changes.

### Step 3: Suggestions & Follow-up

**Missing components**: cards with symbol preview, description, "Add to Diagram" button (auto-places via ELK), "Dismiss" button.

**Follow-up questionnaire**: AI-generated multiple-choice questions. Answers sent back to Claude with current architecture for refined suggestions. Iterative — each answer can spawn new questions.

### Step 4: Skill Adaptation

Two tabs in one panel:
- **Tab 1 (Adapt Skill)**: target subskill name input (dropdown for existing, free-text for new), checkboxes on each learned decision (cherry-pick), editable trigger keywords, impact preview, "Approve & Save" button.
- **Tab 2 (Skill Tree)**: rendered tree view with root skill → subskill leaves. Expandable nodes showing decisions, patterns, symbol overrides. "+ Create new subskill" at bottom.

---

## 6. AI Engine

Backend class with unified interface for API key and CLI auth modes:

```
AIEngine:
  review(diagram, context) → ReviewFeedback
  stream_review(diagram, context) → AsyncIterator[str]
  answer_followup(diagram, context, qa_history) → UpdatedSuggestions
  generate_adaptation(diagram_v1, diagram_v2, context) → AdaptationProposal
  preview_impact(adaptation, skill_tree) → ImpactReport
```

Prompt construction layers:
1. Base system prompt (role + JSON output format)
2. Context from envelope (project, stack, intent)
3. Current architecture JSON
4. Active subskill decisions (if matched)
5. QA history (for follow-up rounds)

Context token optimization: send compact symbol type list to Claude, not the full instruction set.

Model selection: The app should NOT hardcode a specific model version (e.g., `claude-sonnet-4-20250514`). Instead:
- CLI mode: omit `--model` flag — Claude CLI automatically uses the latest model available on the user's subscription
- API mode: default to `claude-sonnet-4-6-20250514` but resolve via a `CLAUDE_MODEL` env var. The skill and app documentation should note that this should be updated when newer models release
- The backend should log which model is being used at startup for visibility

### Auth

First-launch gate:
1. Detect if `claude` CLI is on PATH and authenticated → offer "Use Claude Code CLI"
2. Always show "Paste API key" as fallback
3. Backend routes through the correct driver (CLI subprocess vs AsyncAnthropic SDK)

---

## 7. MCP Server

Thin bridge, 5 tools:

- `check_app_health()` → GET /health → returns status or error message. The skill MUST call this before `push_architecture`. If unhealthy, return a message telling the user to run `docker compose up`.
- `push_architecture(payload)` → POST /api/sessions → returns session URL
- `pull_latest_state(session_id)` → GET /api/sessions/{id}/latest → returns modified architecture + diff
- `list_sessions()` → GET /api/sessions → returns session list
- `get_skill_tree()` → GET /api/skills/tree → returns skill structure

Zero logic in MCP server. All pass-through to backend.

---

## 8. Skill File Management

### File Structure

```
skills/
  intelligent-arch-creator/
    skill.md              # Main skill — Claude Code reads this
    symbols.yaml          # Symbol instruction set (shared with app)
    keywords.yaml         # Keyword → subskill mapping index
    subskills/
      proximity.md
      order-processing.md
      realtime-messaging.md
      ml-inference.md
```

### Main Skill (skill.md)

Instructs Claude Code to:
1. **Check app is running** — call health endpoint (`GET http://localhost:18000/health`). If not reachable, tell the user: "The Intelligent Arch Viewer app needs to be running. Please start it with `docker compose up` in the project directory, then try again." Do NOT proceed until the app is healthy.
2. Scan project files → detect technology stack
3. Check keywords.yaml for matching subskill → load it if matched
4. Read symbols.yaml for available symbol types
5. Generate context envelope JSON
6. Call `push_architecture()` MCP tool → sends to viewer app
7. Return the session URL to the user

### Keywords Index (keywords.yaml)

Maps detected technology keywords to subskill files. AND logic within a group, OR logic between groups:

```yaml
mappings:
  - subskill: order-processing
    match_any:
      - [kafka, order]
      - [event-driven, order]
```

### Subskill Files

Markdown with frontmatter (name, version, learned_from count, last_updated). Sections: Decisions (always apply), Patterns (suggest when relevant), Symbol Overrides (modify default rendering).

### Safety

The app NEVER auto-saves to skill files. Every write goes through explicit approval flow. User sees what changes on disk before confirming.

Skill path comes from context envelope (`skill_path` field) — no hardcoding.

---

## 9. Database

### SQLite (default) / PostgreSQL (optional)

Tables:

| Table | Purpose |
|-------|---------|
| `sessions` | One per push. Stores context envelope, status, created_at |
| `diagrams` | Versioned snapshots. FK to session. v1 = original, v2+ = modifications |
| `reviews` | AI review results. FK to diagram version |
| `skill_adaptations` | Pending/approved adaptations. Decisions, target subskill, approval status |
| `auth_config` | Stored auth mode preference (cli/api_key) |

---

## 10. Frontend Component Structure

```
src/
  App.tsx
  components/
    layout/       AppShell, TopBar, StatusBar
    palette/      ComponentPalette, PaletteItem
    canvas/       Canvas, CanvasBackground, NodeRenderer, EdgeRenderer,
                  PortOverlay, ModeToggle, Minimap
    symbols/      HorizontalCylinder, ContainerBox, DiamondStack, Hexagon,
                  RoundedRect, Circle, Cloud, InternalElements
    panels/       RightPanel, SuggestionsPanel, FollowUpPanel, AdaptPanel,
                  SkillAdaptForm, SkillTree
    review/       ReviewModal, ScoreSummary, DiffView, SuggestionsStep, AdaptStep
    auth/         AuthGate
  hooks/          useCanvas, useLayout, useEdgeRouting, useDragDrop,
                  useSession, useAI, useSkills
  stores/         appStore (Zustand), symbolRegistry
  types/          index.ts, symbols.ts
  api/            client.ts, ws.ts
  lib/            elkLayout.ts, edgeRouter.ts, diffEngine.ts, symbolParser.ts
```

### Backend Route Groups

| Prefix | Purpose |
|--------|---------|
| `/api/sessions` | CRUD sessions, push/pull architecture state |
| `/api/diagrams` | Version management, diff between versions |
| `/api/ai` | Review stream, follow-up answers, adaptation generation |
| `/api/skills` | Skill tree read, adaptation save, impact preview |
| `/api/symbols` | Symbol registry (parsed from YAML) |
| `/api/auth` | CLI detection, API key validation |
| `/ws/review` | WebSocket streaming review chunks |

---

## 11. App Layout

Three-column layout: Component Palette (260px) | Canvas (flex) | Right Panel (320px).
Top bar: session selector, stack badges, version indicator, auth status, Review button, Auto-arrange button.
Status bar: node/edge/flow counts, layout algorithm, zoom level, save state.

Right panel tabs: Suggestions | Follow-up | Adapt.

Review mode: full-screen modal overlay with 4-step navigation.

Auth gate: shown on first launch, detects CLI availability, offers API key fallback.

Dark theme: background `#0a0a0f`/`#0f1117`, surface `#161b27`, border `#1e2430`, text `#c9d1e0`, muted `#6b7280`.

---

## 12. Project Memory System

Structured file-based memory split by concern for minimal token consumption:

```
.claude/
  INDEX.md                     # Pointer file (~20 lines), always loaded
  decisions/
    001-symbol-schema.md       # One file per architectural decision
    002-elk-layout.md
    003-auth-cli-apikey.md
    ...
  design/
    architecture.md            # System architecture notes
    canvas.md                  # Canvas + routing design
    skill-system.md            # Skill adaptation design
    symbol-system.md           # Symbol registry design
  updates/
    YYYY-MM-DD-topic.md        # Each enhancement gets its own file
  constraints.md               # Hard rules (single file, rarely changes)
```

Rules:
- INDEX.md is the only file always loaded — one-line pointers to each memory file
- No file exceeds ~50 lines — split if it grows
- Decisions numbered with topic suffix for grep-friendly lookup
- Updates date-stamped — old ones naturally deprioritize
- Auto-updated by Claude Code on enhancements (new decision → new file, not append to existing)

---

## 13. Implementation Order

1. Project scaffolding + memory system + symbols.yaml
2. Database schema (SQLite) + backend core (config, models, session)
3. MCP server (4 tools)
4. Backend AI engine (Claude API/CLI bridge)
5. Backend skill manager (file read/write)
6. Backend API routes (sessions, diagrams, AI, skills, symbols, auth) + WebSocket endpoint for review streaming
7. Frontend config + types + stores
8. Frontend canvas (SVG renderer, symbols, ports)
9. Frontend layout engine (ELK.js) + edge routing
10. Frontend palette (search, tags, drag-drop)
11. Frontend right panel (suggestions, follow-up, adapt)
12. Frontend review modal (4 steps)
13. Frontend auth gate
14. Skill files (skill.md, keywords.yaml, sample subskills)
15. Integration testing end-to-end
