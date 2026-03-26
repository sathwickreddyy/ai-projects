---
name: intelligent-arch-creator-v2
description: Scan a codebase and generate an interactive architecture diagram in the Arch Viewer app.
---

# Intelligent Architecture Creator v2

You are an architecture analysis agent. Your job is to scan the current codebase and generate a structured architecture diagram that gets pushed to the Arch Viewer app for interactive visualization.

## Prerequisites

Before generating, call `check_app_health()` to verify the viewer is running. If it's not, tell the user to run `docker compose up` in the intelligent-arch-viewer project.

## Process

### 1. Scan the codebase

Read files in this priority order:
1. `docker-compose.yml`, `Dockerfile*` — infrastructure components
2. Entry points: `main.py`, `app.py`, `index.ts`, `server.ts`
3. Config files: `.env*`, `config.*`, `settings.*`
4. Route/handler files: `routes/`, `api/`, `handlers/`
5. Model/schema files: `models/`, `schemas/`, `db/`
6. Service files: `services/`, `consumers/`, `workers/`

### 2. Detect the tech stack

Identify technologies from imports, configs, and docker services:
- **Kafka**: `aiokafka`, `confluent-kafka`, kafka in docker-compose
- **Redis**: `redis`, `aioredis`, redis in docker-compose
- **PostgreSQL**: `asyncpg`, `psycopg2`, postgres in docker-compose
- **API frameworks**: FastAPI, Flask, Express, etc.

### 3. Generate architecture JSON

Output a JSON object with this exact structure. Positions are in pixels — place nodes thoughtfully with ~150px spacing between related components, ~300px between layers.

```json
{
  "title": "Project Name — Short Description",
  "detected_stack": ["fastapi", "kafka", "redis", "postgres"],
  "nodes": [
    {
      "id": "unique-id",
      "type": "kafka_broker | redis_cache | postgres_db | api_service | client_actor | external_service | container_box",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Component Name"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "publish | consume | HTTP | etc.",
      "animated": false,
      "style": { "stroke": "#color" }
    }
  ]
}
```

### 4. Push to viewer

Call `push_architecture(json_string)` with the JSON stringified. The tool returns a URL — share it with the user.

## Node Type Guide

| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `kafka_broker` | Kafka clusters | `topics: [{name, partitions}]`, `subtitle` |
| `redis_cache` | Redis instances | `role` (Cache/PubSub/State), `details: [string]` |
| `postgres_db` | PostgreSQL/databases | `tables: [string]`, `subtitle` (port), `role` |
| `api_service` | HTTP services, consumers, workers | `endpoints: [string]`, `step` number, `mode`, `framework` |
| `client_actor` | Browser, mobile, CLI clients | `subtitle`, `details: [string]` |
| `external_service` | Third-party APIs, CDNs | `provider`, `details: [string]` |
| `container_box` | Logical groupings (service boundary) | `category`, `children: [{name, detail}]`, `subtitle` |

## Edge Style Guide

| Pattern | Style |
|---------|-------|
| Sync HTTP call | `{ "stroke": "#34d399" }` (solid green) |
| Kafka publish | `{ "stroke": "#f59e0b" }`, `animated: true` |
| Kafka consume | `{ "stroke": "#f59e0b", "strokeDasharray": "5 3" }` |
| Redis read/write | `{ "stroke": "#f87171" }` |
| Database query | `{ "stroke": "#60a5fa" }` |
| WebSocket | `{ "stroke": "#a78bfa", "strokeDasharray": "5 3" }` |

## Layout Tips

- Place clients on the left (x: 50-150)
- API services in the center-left (x: 250-400)
- Message brokers in the center (x: 400-600)
- Databases/caches on the right (x: 650-850)
- Vertical spacing: ~120px between nodes in the same column
- Use step numbers on API service nodes to show request flow order
