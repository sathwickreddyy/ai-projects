# Symbol System Design

## symbols.yaml Structure

Two sections:
- `meta:` — defines building blocks (shapes, internal elements, ports, animations, colors, prop types)
- `symbols:` — 10 symbol definitions that follow the meta-schema

## Adding New Symbols (5-step recipe)

1. Pick a shape from meta.shapes
2. Pick internal_elements from meta.internal_elements (if shape supports them)
3. Pick a category from meta.color_palette (sets default colors)
4. Define props_schema using meta.prop_types
5. If shape supports_children, define children.type and children.layout

## Current Symbols (10)

kafka_broker (container_box), kafka_topic (horizontal_cylinder), redis_cache (diamond_stack), redis_pubsub (container_box), pubsub_channel (horizontal_cylinder), postgres_db (horizontal_cylinder), api_service (hexagon), load_balancer (rounded_rect), client_actor (circle), external_service (cloud)

## Visual Convention

- Horizontal cylinders stacked vertically inside containers
- Category colors: messaging=#ef4444, database=#3b82f6, cache=#ef4444, api=#059669, infra=#0ea5e9, client=#8b5cf6, external=#6b7280
- Dark theme: bg=#0a0a0f, surface=#0f1117, panel=#161b27, border=#1e2430
