# intelligent-arch-creator Skill — Design Spec

## Overview

The `intelligent-arch-creator` skill is a set of instructions that Claude follows when a user asks to analyze a codebase and generate an architecture diagram for the Arch Viewer. The skill is delivered via MCP tool context — not a slash command. It ships as a standard skill in the repo and gets customized over time through the viewer's adaptation loop.

---

## 1. Skill Responsibilities

**The skill does:**
- Check app health via MCP before starting
- Ask the user for scan scope (Quick/Standard/Deep) with token estimates
- Scan project files in priority order, stopping at scope limit
- Detect the technology stack from scanned files
- Load matching subskills and apply their decisions/patterns/symbol overrides
- Generate a rich context envelope with all node props fully populated (smart zoom)
- Assign layers per node (architectural intent, not pixel positions)
- Set `auto_layout: true` so the viewer handles positioning via ELK.js
- Pick a default display mode (user can switch in UI)
- Generate 3 architectural insights (gaps, not praise)
- Push to the viewer via MCP tool

**The skill does NOT:**
- Compute pixel positions (viewer + ELK.js handles layout)
- Choose the final diagram mode (UI mode toggle lets user switch)
- Decide what to show vs hide (viewer handles zoom-level rendering)
- Auto-save anything to skill files (viewer's explicit approval flow handles this)

---

## 2. File Scanning Strategy

### Scan Scope (user chooses)

Before reading any files, the skill presents three options:

| Scope | Priorities read | Approx tokens | Best for |
|-------|----------------|---------------|----------|
| **Quick** | P0-P1 (configs + manifests) | ~5K tokens | High-level overview |
| **Standard** | P0-P3 (+ entrypoints + settings) | ~15K tokens | Most projects (default) |
| **Deep** | P0-P5 (full priority stack) | ~30K tokens | Thorough analysis |

Prompt to user:
> "I'll analyze this project for an architecture diagram. How deep should I go?
> - **Quick** (~5K tokens) — reads configs and manifests only
> - **Standard** (~15K tokens) — also reads entrypoints and connection configs (recommended)
> - **Deep** (~30K tokens) — reads infrastructure code and docs too
>
> Which scope?"

Default to **Standard** if user doesn't specify.

### Priority Order

| Priority | What | Why | Examples |
|----------|------|-----|---------|
| P0 | Docker/infra configs | Reveals entire stack in one file | `docker-compose.yml`, `Dockerfile`, `k8s/*.yaml`, `.env.example` |
| P1 | Package manifests | Confirms languages + dependencies | `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml` |
| P2 | Entrypoints | Reveals service structure + routes | `main.py`, `app.py`, `index.ts`, `cmd/main.go`, `src/main.rs` |
| P3 | Config/settings | Reveals connections between services | Database URLs, Kafka bootstrap servers, Redis hosts, API base URLs |
| P4 | Infrastructure client code | Reveals data flow details | Kafka producer/consumer files, Redis client wrappers, DB migrations |
| P5 | README/docs | Catches anything code didn't reveal | `README.md`, `docs/architecture.md`, `CLAUDE.md` |

### Skip Rules

Always skip: `node_modules/`, `.git/`, `__pycache__/`, `venv/`, `dist/`, `build/`, `vendor/`, test files, generated code, static assets, lock files.

### Early Stop

If after P1 the stack is fully clear (e.g., docker-compose.yml listed all services, ports, and dependencies), skip lower priorities and go straight to generation. Don't read more files just because the budget allows.

---

## 3. Stack Detection → Symbol Mapping

The skill maps detected technologies to the correct `symbol_type` and populates `props` from what it read in the code:

### Detection Rules

```
docker-compose has "kafka" or "confluent" image
  → kafka_broker
  → Read topic names from env vars, producer/consumer code
  → Props: topics[] with partition counts, consumer_groups[]

requirements.txt has "asyncpg"/"psycopg2" OR docker-compose has "postgres"
  → postgres_db
  → Read migration files or model definitions for table names
  → Props: tables[], role (primary/replica)

Code imports redis AND uses pub/sub (subscribe, publish, channel)
  → redis_pubsub (NOT redis_cache)
  → Read channel names from code
  → Props: channels[]

Code imports redis AND uses get/set/cache/expire
  → redis_cache
  → Read key patterns from code
  → Props: key_patterns[]

Code has FastAPI/Flask/Express/Gin route definitions
  → api_service
  → Read route decorators for endpoint list
  → Props: framework, endpoints[]

docker-compose has nginx/haproxy/traefik
  → load_balancer
  → Props: algorithm

Code references external APIs (Stripe, Twilio, S3, Auth0)
  → external_service per external dependency
  → Props: provider

Frontend or client-facing entry point
  → client_actor
  → Props: type (browser/mobile/cli)
```

**Key judgment calls:**
- Redis: `redis_cache` vs `redis_pubsub` depends on usage in code, not just dependency presence. If both are used, create BOTH nodes.
- Kafka: if the project has few topics (1-3), show them as children inside `kafka_broker`. If many topics, show the broker only with topic names in props.
- Multiple instances: if docker-compose has `postgres-primary` and `postgres-replica`, create two `postgres_db` nodes with different `role` props.

### Layer Assignment

```
Layer 0: client_actor, external_service (entry points / edges of the system)
Layer 1: load_balancer, api_service (gateway / API tier)
Layer 2: worker services, notification services (processing tier)
Layer 3: kafka_broker, redis_pubsub (messaging tier)
Layer 4: postgres_db, redis_cache (storage tier)
```

### Smart Zoom (always populate props)

Even at Quick scan scope, the skill populates every available prop it can find. The viewer decides whether to render internal elements based on zoom level. The skill's job is to **gather**, the viewer's job is to **display**.

Example: even if the user chose Quick scope and the skill only read docker-compose.yml, if that file shows `POSTGRES_DB: orders_db`, the postgres_db node should have `props.tables: ["orders"]` (inferred from the DB name). More detail gets added at deeper scan scopes.

---

## 4. Edge Generation

### Creation Rules

| Source action | Edge style | Label format | Color |
|--------------|-----------|-------------|-------|
| HTTP call to another service | `solid` | `HTTP GET/POST →` | target's category color |
| Produce to Kafka topic | `animated` | `produce →` | `#ef4444` |
| Consume from Kafka topic | `animated` | `consume ←` | `#ef4444` |
| SQL read from database | `solid` | `SQL read ←` | `#3b82f6` |
| SQL write to database | `solid` | `SQL write →` | `#3b82f6` |
| Redis cache get/set | `solid` | `cache read ←` / `cache write →` | `#ef4444` |
| Redis publish to channel | `animated` | `publish →` | `#f97316` |
| Redis subscribe to channel | `animated` | `subscribe ←` | `#f97316` |
| Client calls API | `solid` | `HTTP →` | `#8b5cf6` |
| Call to external API | `dotted` | `API call →` | `#6b7280` |
| gRPC call | `solid` | `gRPC →` | target's category color |
| WebSocket connection | `animated` | `WS ↔` | `#22c55e` |

### Labeling Conventions

- Always include protocol: HTTP, SQL, gRPC, Kafka, Redis, WebSocket
- Always include direction: `→` outbound, `←` inbound, `↔` bidirectional
- For async messaging: use `animated` style
- For synchronous calls: use `solid` style
- For optional/fallback paths: use `dotted` style

### Port Selection

Leave `source_port` and `target_port` as `null`. The viewer's auto-assignment picks the optimal port pair based on node positions after ELK layout. The skill should not guess ports.

### Flow Generation

Group related edges into named flows with distinct colors:

- Write path (API → Kafka → DB): name "Write Path", color `#ef4444`
- Read path (API → Cache → DB): name "Read Path", color `#3b82f6`
- Notification path (Kafka → Service → Redis pub/sub): name "Notification Path", color `#f97316`
- Client flow (Client → LB → API): name "Client Flow", color `#8b5cf6`

Only create flows for paths with 3+ nodes. Don't create a flow for a single edge.

---

## 5. Insights Generation

The skill generates exactly 3 insights with every diagram. These seed the Suggestions panel in the viewer.

**Focus on gaps, not praise:**
- What's missing that a production system would need?
- What pattern isn't being followed that should be?
- What single point of failure or scaling bottleneck exists?

**Examples:**
- "No DLQ pattern detected — failed Kafka messages will be lost silently"
- "Single PostgreSQL instance handles both reads and writes — consider a read replica for scale"
- "No circuit breaker between API and Kafka — broker outage will cascade to API layer"
- "Redis is used for both caching and pub/sub — consider separating into two instances for isolation"
- "No health check endpoints detected — infrastructure monitoring will be blind"

**Anti-patterns (don't generate these):**
- "Well-structured microservice architecture" (praise, not actionable)
- "Consider adding a CDN" (generic, not specific to what was found)
- "The system uses Kafka for messaging" (restating what's in the diagram)

---

## 6. Context Envelope Schema

```json
{
  "context": {
    "project_name": "string — directory/project name",
    "project_path": "string — absolute path",
    "detected_stack": ["string array — detected technologies"],
    "user_intent": "string — what the user asked for",
    "skill_used": "intelligent-arch-creator",
    "skill_version": "1.0",
    "skill_path": "string — absolute path to this skill directory",
    "conversation_summary": "string — brief conversation context",
    "scan_scope": "quick | standard | deep",
    "tokens_consumed": 14500,
    "files_scanned": ["docker-compose.yml", "requirements.txt", "..."],
    "preferences": {}
  },
  "architecture": {
    "title": "string — diagram title",
    "mode": "stage_diagram | animated_flow | step_by_step | mental_map",
    "default_mode": "stage_diagram",
    "auto_layout": true,
    "nodes": [
      {
        "id": "string — unique node ID (e.g., 'kafka_1', 'pg_primary')",
        "symbol_type": "string — must match a key in symbols.yaml",
        "name": "string — display name",
        "props": {
          "...symbol-specific props from props_schema"
        },
        "position": { "x": 0.0-1.0, "y": 0.0-1.0 },
        "layer": 0
      }
    ],
    "edges": [
      {
        "id": "string — unique edge ID",
        "source": "string — source node ID",
        "source_port": null,
        "target": "string — target node ID",
        "target_port": null,
        "label": "string — protocol + direction label",
        "style": "solid | animated | dotted",
        "color": "string — hex color"
      }
    ],
    "flows": [
      {
        "id": "string",
        "name": "string — flow name (e.g., 'Write Path')",
        "steps": ["node_id_1", "node_id_2", "node_id_3"],
        "color": "string — hex color"
      }
    ],
    "insights": [
      "string — architectural gap or observation",
      "string — another gap",
      "string — third gap"
    ]
  }
}
```

---

## 7. Subskill Integration

### Loading (during generation)

1. Skill detects stack from scanned files
2. Reads `keywords.yaml` — checks each mapping's `match_any` groups
3. If detected stack contains ALL keywords in any group → subskill matches
4. Reads matching subskill `.md` from `subskills/` directory
5. Applies:
   - **Decisions** (always): adds nodes/edges/props automatically (e.g., "always add DLQ" → DLQ topic added to kafka_broker)
   - **Patterns** (suggest): included in insights if relevant (e.g., "CQRS" → insight about read/write separation)
   - **Symbol Overrides** (modify): overrides default colors or props (e.g., "write-path edges in #ef4444")

### No-match behavior

If no subskill matches, generate the diagram from first principles. Subskills enhance — they don't gate. The skill works perfectly fine with zero subskills.

### What ships standard

- `keywords.yaml` — 1 mapping: `[kafka, order]` → `:order-processing`
- `subskills/order-processing.md` — 3 decisions (DLQ, path separation, Redis vs Kafka), 4 patterns (CQRS, saga, event sourcing, read replica), 2 symbol overrides
- The mechanism for creating more — users build their library through the viewer's Adapt tab

### Adaptation loop (handled by the viewer, not the skill)

1. User modifies diagram in viewer
2. Clicks Review → AI detects changes, generates suggested decisions
3. Adapt tab → user types target subskill name, cherry-picks decisions, adds keywords
4. Clicks Approve → backend writes new subskill file + updates keywords.yaml
5. Next project with matching keywords → subskill auto-loads during generation

---

## 8. MCP Tool Integration

The skill relies on the `arch-viewer` MCP server's tools:

| Tool | When called | Purpose |
|------|-----------|---------|
| `check_app_health()` | First, before anything | Fail fast if viewer not running |
| `push_architecture(payload)` | Last, after generation | Send context envelope to viewer |
| `pull_latest_state(session_id)` | On user request | Fetch modified diagram back |
| `list_sessions()` | On user request | Browse previous diagrams |
| `get_skill_tree()` | On user request | View subskill structure |

The skill's `push_architecture` call is the final step. Everything before it (scanning, detection, generation) happens in the Claude Code conversation. The MCP server is just the delivery mechanism.

### Future: `install_skill` tool

A 6th tool to be added that fetches the standard skill from the running backend (`GET /api/skills/bundle`) and installs it to `.claude/commands/` at project scope. This enables the skill to be discoverable as a slash command in any project. Deferred — current approach relies on MCP tool context for skill delivery.

---

## 9. Skill File Structure (on disk)

```
skills/
  intelligent-arch-creator/
    skill.md              # Main instructions — what Claude reads
    symbols.yaml          # Symbol instruction set (shared with viewer app)
    keywords.yaml         # Keyword → subskill mapping index
    subskills/
      order-processing.md # Shipped example
      (user creates more via viewer's Adapt flow)
```

`skill.md` is the only file the skill reads as instructions. `symbols.yaml` is read for the available type list and props schemas. `keywords.yaml` and `subskills/` are read conditionally based on stack detection.

---

## 10. Implementation Scope

This spec covers rewriting `skill.md` with all the intelligence described above. No changes to:
- `symbols.yaml` (already complete)
- `keywords.yaml` (already has the example mapping)
- `subskills/order-processing.md` (already has real content)
- Backend code (AI engine, skill manager — already built)
- Frontend code (already built)
- MCP server (5 tools already work)

**Single deliverable:** A rewritten `skills/intelligent-arch-creator/skill.md` that is comprehensive, self-contained, and produces high-quality diagrams when followed by any Claude model.
