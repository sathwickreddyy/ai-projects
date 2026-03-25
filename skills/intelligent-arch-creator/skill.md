---
name: intelligent-arch-creator
description: Analyze a project and generate a structured architecture diagram for the Arch Viewer app
---

## What You Do

Analyze the user's project files, detect the technology stack, and produce a structured architecture JSON payload following the symbol instruction set. Send it to the Arch Viewer app for interactive visualization.

## Prerequisites

The Arch Viewer app must be running. Before doing anything:
1. Call `check_app_health()` MCP tool
2. If the app is not running, tell the user: "Please start the Arch Viewer with `docker compose up` and try again."
3. Do NOT proceed until the app is healthy.

## Process

1. **Check app health** — call `check_app_health()` MCP tool
2. **Scan project files** — identify frameworks, databases, messaging systems, infrastructure
3. **Check keywords.yaml** — if detected stack matches a subskill's keywords, read that subskill's .md file and apply its learned decisions and patterns
4. **Read symbols.yaml** — use ONLY symbol_types defined in this file. Each node must have a valid `symbol_type` from the symbols list.
5. **Generate context envelope JSON** — following the output schema below
6. **Call MCP tool** — `push_architecture(payload)` sends the JSON to the viewer app
7. **Return the session URL** — tell the user to open it in their browser

## Symbol Instruction Set

Read `symbols.yaml` in this directory for available symbol_types and their props_schema. Only generate symbol_types that exist in this file.

Available types: kafka_broker, kafka_topic, redis_cache, redis_pubsub, pubsub_channel, postgres_db, api_service, load_balancer, client_actor, external_service.

Each symbol_type has a `props_schema` defining what properties it accepts (e.g., kafka_topic accepts `partitions`, `messages_hint`, `consumer_groups`).

## Subskill Loading

Read `keywords.yaml` in this directory. If detected technologies match keywords for a subskill, read that subskill's .md file from the `subskills/` directory and apply its:
- **Decisions** (always apply)
- **Patterns** (suggest when relevant)
- **Symbol Overrides** (modify default rendering)

## Output Schema (Context Envelope)

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
    "preferences": {}
  },
  "architecture": {
    "title": "string — diagram title",
    "mode": "stage_diagram | animated_flow | step_by_step | mental_map",
    "nodes": [
      {
        "id": "string — unique node ID",
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
        "source_port": "top | top-right | right | bottom | bottom-left | left",
        "target": "string — target node ID",
        "target_port": "top | top-right | right | bottom | bottom-left | left",
        "label": "string — protocol/direction label",
        "style": "solid | animated | dotted",
        "color": "string — hex color"
      }
    ],
    "flows": [
      {
        "id": "string",
        "name": "string — flow name",
        "steps": ["node_id_1", "node_id_2"],
        "color": "string — hex color"
      }
    ]
  }
}
```

## Layout Rules

- Positions are 0.0-1.0 fractions. Spread nodes well. Never overlap.
- layer: 0 = top (client/user-facing), higher = deeper (infra/DB)
- Label every edge with protocol and direction
- Fill in symbol-specific props (partitions for Kafka, tables for Postgres, endpoints for API, etc.)
