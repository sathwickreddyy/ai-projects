---
name: intelligent-arch-creator
description: Analyze a codebase, detect its technology stack, and generate a structured architecture diagram for the Intelligent Arch Viewer app
version: "1.0"
---

# Intelligent Architecture Creator

You analyze codebases and produce structured architecture diagrams. Your output is a JSON payload that gets pushed to the Arch Viewer app for interactive visualization with proper SVG infrastructure symbols, AI-powered review, and skill learning.

---

## Step 1: Check App Health

Before anything else, call the MCP tool:

```
check_app_health()
```

If the app is not running, tell the user:
> "The Intelligent Arch Viewer app needs to be running. Please start it with `docker compose up` in the arch-viewer project directory, then try again."

Do NOT proceed until the app responds healthy.

---

## Step 2: Ask Scan Scope

Present three options before reading any project files:

> "I'll analyze this project for an architecture diagram. How deep should I go?
> - **Quick** (~5K tokens) — reads configs and manifests only. Fast, high-level overview.
> - **Standard** (~15K tokens) — also reads entrypoints and connection configs. Recommended for most projects.
> - **Deep** (~30K tokens) — reads infrastructure code and docs too. Most thorough.
>
> Which scope?"

Default to **Standard** if the user doesn't specify or says "just do it".

---

## Step 3: Scan Project Files

Read files in strict priority order. Stop at the scope limit.

| Priority | Scope | What to Read | Examples |
|----------|-------|-------------|---------|
| P0 | Quick+ | Docker/infra configs | `docker-compose.yml`, `Dockerfile`, `k8s/*.yaml`, `.env.example` |
| P1 | Quick+ | Package manifests | `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle` |
| P2 | Standard+ | Entrypoints | `main.py`, `app.py`, `index.ts`, `cmd/main.go`, `src/main.rs`, `server.js` |
| P3 | Standard+ | Config/settings files | Files containing database URLs, Kafka bootstrap servers, Redis hosts, API base URLs |
| P4 | Deep | Infrastructure client code | Kafka producer/consumer files, Redis client wrappers, DB migration files, queue handlers |
| P5 | Deep | README/docs | `README.md`, `docs/architecture.md`, `CLAUDE.md` |

### CRITICAL: How to Scan Files

**NEVER use broad searches.** These waste thousands of tokens on junk:
- `**/*` ← returns node_modules, __pycache__, .git — NEVER DO THIS
- `**/*.md` ← returns 80+ LICENSE files from node_modules — NEVER DO THIS
- `**/*.py` from project root ← includes venv, tests — avoid

**Instead, read SPECIFIC files directly.** You already know what to look for:

**P0 — read these files directly (no search needed):**
```
Read: docker-compose.yml
Read: Dockerfile (or backend/Dockerfile)
Read: .env.example
```

**P1 — read these files directly:**
```
Read: package.json (or frontend/package.json)
Read: requirements.txt (or backend/requirements.txt)
Read: go.mod OR Cargo.toml OR pom.xml (whichever exists)
```

**P2 — read entrypoints (check which exist first):**
```
Read: backend/main.py OR main.py OR app.py OR src/main.ts OR cmd/main.go
```

**P3 — read config files found in P0 (e.g., .env.example already read, look for config.py):**
```
Read: backend/config.py OR backend/app/core/config.py OR src/config.ts
```

**P4 — read ONLY backend source files that reveal infrastructure:**
```
List: backend/routers/ OR backend/api/ (to see what routes exist)
Read: files that sound like infrastructure (kafka_*.py, redis_*.py, db.py)
List: backend/clients/ OR backend/services/ (if they exist)
```

**P5 — read ONLY root docs:**
```
Read: README.md
Read: CLAUDE.md (if exists)
```

**Rules:**
- Read files DIRECTLY by path — don't search/glob first
- If a file doesn't exist, that's fine — skip it, don't search for alternatives
- NEVER read from node_modules/, venv/, .git/, __pycache__/, dist/, build/
- Max 3000 chars per file (first 3000 is enough)
- Do NOT read symbols.yaml — the quick reference table below has everything you need

**Early stop:** If docker-compose.yml lists all services, ports, images, and env vars clearly, skip P3-P5 and go straight to Step 4.

---

## Step 4: Detect Stack & Map to Symbols

From what you scanned, identify each technology and create the correct node. Read `symbols.yaml` in this directory for the full list of available `symbol_type` values and their `props_schema`.

### Detection → Symbol Rules

**Messaging:**

| Detected | symbol_type | How to populate props |
|----------|------------|----------------------|
| Kafka/Confluent image in docker-compose, or aiokafka/confluent-kafka in deps | `kafka_broker` | Read topic names from env vars or producer/consumer code. Set `props.topics[]` with partition counts. |
| Individual Kafka topic referenced in code | `kafka_topic` | Only use if showing topics outside a broker. Usually topics are children inside `kafka_broker`. |
| Redis with pub/sub usage (subscribe, publish, channel) | `redis_pubsub` | Read channel names from code. Set `props.channels[]`. |
| RabbitMQ/AMQP in deps or docker-compose | Use `redis_pubsub` shape as closest match | Note in insights that a dedicated RabbitMQ symbol should be added. |

**Databases:**

| Detected | symbol_type | How to populate props |
|----------|------------|----------------------|
| PostgreSQL (asyncpg, psycopg2, postgres image) | `postgres_db` | Read table names from migrations, models, or SQL files. Set `props.tables[]`, `props.role`. |
| Redis with cache usage (get, set, expire, cache) | `redis_cache` | Read key patterns from code. Set `props.key_patterns[]`. |
| MongoDB, Cassandra, Elasticsearch | Use `postgres_db` as closest cylinder shape | Note in insights that a dedicated symbol should be added. |

**If Redis is used for BOTH caching AND pub/sub:** create two separate nodes — one `redis_cache` and one `redis_pubsub`.

**Services:**

| Detected | symbol_type | How to populate props |
|----------|------------|----------------------|
| FastAPI, Flask, Express, Gin, Spring Boot routes | `api_service` | Read route decorators for endpoint list. Set `props.framework`, `props.endpoints[]`. |
| Nginx, HAProxy, Traefik, ALB in docker-compose | `load_balancer` | Set `props.algorithm` if detectable. |
| External API calls (Stripe, Twilio, S3, Auth0) | `external_service` | One node per external dependency. Set `props.provider`. |
| Frontend client, browser, mobile app | `client_actor` | Set `props.type` (browser/mobile/cli/iot). |

**Multiple instances:** if docker-compose has `postgres-primary` and `postgres-replica`, create two `postgres_db` nodes with different `props.role` values.

### Layer Assignment

Assign each node a `layer` value. This expresses architectural intent — the viewer uses it for ELK layout.

```
Layer 0: client_actor, external_service (entry points / system edges)
Layer 1: load_balancer, api_service (gateway / API tier)
Layer 2: worker services, notification services (processing tier)
Layer 3: kafka_broker, redis_pubsub (messaging tier)
Layer 4: postgres_db, redis_cache (storage tier)
```

### Position

Set approximate positions using the layer:
- `y` = layer * 0.2 (so layer 0 is at top, layer 4 at bottom)
- `x` = distribute nodes within same layer evenly (e.g., 2 nodes at layer 1 → x=0.33 and x=0.66)

These are rough — set `auto_layout: true` in the output and the viewer's ELK.js engine will reposition everything optimally.

### Props: Always Populate (Smart Zoom)

Even at Quick scope, fill in every prop you can infer. If docker-compose.yml shows `POSTGRES_DB: orders_db`, set `props.tables: ["orders"]`. If a Kafka topic is named `order-events`, infer `props.partitions: 3` as a sensible default.

The viewer decides whether to render internal elements at the current zoom level. Your job is to **gather**, the viewer's job is to **display**.

---

## Step 5: Load Subskills

Call the MCP tool with your detected stack to get matching subskills:

```
get_skill_tree(detected_stack="kafka,redis,fastapi,postgres")
```

Pass the comma-separated detected technologies. The tool returns:
- **Matched subskills** with full content (decisions, patterns, overrides) — apply these
- **Non-matching subskills** as summaries only (saves tokens)
- If no subskills match, generate from first principles — that's fine

For matched subskills, check the keyword logic:

```yaml
# keywords format in the response
mappings:
  - subskill: order-processing
    match_any:
      - [kafka, order]       # ALL keywords in this group must be in detected stack
      - [event-driven, order] # OR all keywords in this group
```

If a subskill matches, apply its content:

- **Decisions (always apply):** these modify your output directly. E.g., "always include DLQ topic" → add a DLQ topic to the kafka_broker's topics array.
- **Patterns (suggest when relevant):** include as insights if the pattern applies. E.g., "CQRS" → add insight about read/write separation if only one DB detected.
- **Symbol Overrides (modify rendering):** apply color or prop overrides. E.g., "write-path edges in #ef4444" → use that color for write-path edges.

**If no subskill matches, that's fine.** Generate the diagram from first principles. Subskills enhance — they don't gate.

---

## Step 6: Generate Edges

For every connection you detected between components, create an edge.

### Edge Rules

| Connection type | style | label format | color |
|----------------|-------|-------------|-------|
| HTTP call between services | `solid` | `HTTP GET/POST →` | target's category color |
| Produce to Kafka | `animated` | `produce →` | `#ef4444` |
| Consume from Kafka | `animated` | `consume ←` | `#ef4444` |
| SQL read | `solid` | `SQL read ←` | `#3b82f6` |
| SQL write | `solid` | `SQL write →` | `#3b82f6` |
| Redis cache read/write | `solid` | `cache read ←` / `cache write →` | `#ef4444` |
| Redis publish | `animated` | `publish →` | `#f97316` |
| Redis subscribe | `animated` | `subscribe ←` | `#f97316` |
| Client → API | `solid` | `HTTP →` | `#8b5cf6` |
| External API call | `dotted` | `API call →` | `#6b7280` |
| gRPC | `solid` | `gRPC →` | target's category color |
| WebSocket | `animated` | `WS ↔` | `#22c55e` |

### Labeling

- Always include **protocol**: HTTP, SQL, gRPC, Kafka, Redis, WebSocket
- Always include **direction**: `→` outbound, `←` inbound, `↔` bidirectional
- `animated` = async messaging, `solid` = synchronous, `dotted` = optional/fallback

### Ports

Set `source_port` and `target_port` to `null`. The viewer auto-assigns optimal ports after ELK layout. Do not guess ports.

### Flows

Group related edges into named flows with distinct colors:

| Flow pattern | Name | Color |
|-------------|------|-------|
| API → Kafka → DB write path | "Write Path" | `#ef4444` |
| API → Cache → DB read path | "Read Path" | `#3b82f6` |
| Kafka → Service → Redis pub/sub | "Notification Path" | `#f97316` |
| Client → LB → API | "Client Flow" | `#8b5cf6` |

Only create flows for paths with 3 or more nodes. A single edge doesn't need a flow.

---

## Step 7: Generate Insights

Generate exactly **3 insights**. These seed the Suggestions panel in the viewer.

**Focus on architectural gaps, not praise:**
- What's missing that a production system would need?
- What pattern isn't being followed that should be?
- What single point of failure or scaling bottleneck exists?

**Good insights:**
- "No DLQ pattern detected — failed Kafka messages will be lost silently"
- "Single PostgreSQL instance handles both reads and writes — consider a read replica for scale"
- "No circuit breaker between API and Kafka — broker outage will cascade to API layer"
- "Redis used for both caching and pub/sub — consider separating for isolation"
- "No health check endpoints detected — infrastructure monitoring will be blind"

**Bad insights (don't generate these):**
- "Well-structured microservice architecture" ← praise, not actionable
- "Consider adding a CDN" ← generic, not specific to what was found
- "The system uses Kafka for messaging" ← restating what's in the diagram

---

## Step 8: Assemble & Push

Build the context envelope JSON and call the MCP tool:

```
push_architecture(payload_json_string)
```

The tool returns a session URL. Tell the user:
> "Architecture pushed. Open in your browser: {url}"

---

## Output Schema

```json
{
  "context": {
    "project_name": "directory name",
    "project_path": "/absolute/path/to/project",
    "detected_stack": ["fastapi", "kafka", "redis", "postgres"],
    "user_intent": "what the user asked for",
    "skill_used": "intelligent-arch-creator",
    "skill_version": "1.0",
    "skill_path": "/absolute/path/to/this/skill/directory",
    "conversation_summary": "brief context from the conversation",
    "scan_scope": "quick | standard | deep",
    "tokens_consumed": 14500,
    "files_scanned": ["docker-compose.yml", "requirements.txt"],
    "preferences": {}
  },
  "architecture": {
    "title": "Project Name — Architecture",
    "mode": "stage_diagram",
    "default_mode": "stage_diagram",
    "auto_layout": true,
    "nodes": [
      {
        "id": "unique_id",
        "symbol_type": "must match symbols.yaml",
        "name": "Display Name",
        "props": { "...per props_schema" },
        "position": { "x": 0.5, "y": 0.2 },
        "layer": 1
      }
    ],
    "edges": [
      {
        "id": "unique_edge_id",
        "source": "source_node_id",
        "source_port": null,
        "target": "target_node_id",
        "target_port": null,
        "label": "HTTP POST →",
        "style": "solid",
        "color": "#059669"
      }
    ],
    "flows": [
      {
        "id": "flow_id",
        "name": "Write Path",
        "steps": ["api_1", "kafka_1", "pg_1"],
        "color": "#ef4444"
      }
    ],
    "insights": [
      "First architectural gap or observation",
      "Second gap",
      "Third gap"
    ]
  }
}
```

### Mode Selection (default_mode)

Pick the default based on user's intent. The user can switch modes in the viewer UI.

| User says | default_mode |
|-----------|-------------|
| "analyze this project", "show me the architecture" | `stage_diagram` |
| "how does a request flow", "trace the order path" | `animated_flow` |
| "deployment process", "how does it start up" | `step_by_step` |
| "give me an overview", "what's in this project" | `mental_map` |
| Anything unclear | `stage_diagram` |

---

## Symbols Reference

Read `symbols.yaml` in this directory for the full specification. Quick reference:

| symbol_type | shape | category | key props |
|------------|-------|----------|-----------|
| `kafka_broker` | container_box | messaging | `topics[]` (with name, partitions, color) |
| `kafka_topic` | horizontal_cylinder | messaging | `partitions`, `messages_hint`, `consumer_groups[]` |
| `redis_cache` | diamond_stack | cache | `key_patterns[]` |
| `redis_pubsub` | container_box | messaging | `channels[]` (with name, subscribers, color) |
| `pubsub_channel` | horizontal_cylinder | messaging | `subscribers` |
| `postgres_db` | horizontal_cylinder | database | `tables[]`, `role` (primary/replica/standby) |
| `api_service` | hexagon | api | `framework`, `endpoints[]` |
| `load_balancer` | rounded_rect | infrastructure | `algorithm` |
| `client_actor` | circle | client | `type` (browser/mobile/cli/iot) |
| `external_service` | cloud | external | `provider` |

Only use symbol_types from this list. If a technology has no matching symbol, use the closest shape and note in insights that a dedicated symbol should be added.
