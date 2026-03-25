# Project Memory Index

## Decisions
- [001 Clean slate rebuild](decisions/001-clean-slate-rebuild.md) — why we rebuilt from scratch
- [002 Monolith + MCP bridge](decisions/002-monolith-plus-mcp-bridge.md) — architecture approach chosen
- [003 Custom SVG not React Flow](decisions/003-custom-svg-not-reactflow.md) — why we built a custom canvas
- [004 symbols.yaml shared contract](decisions/004-symbols-yaml-shared-contract.md) — single source of truth for symbols
- [005 Auth CLI or API key](decisions/005-auth-cli-or-apikey.md) — no OAuth, no hardcoded models
- [006 Skill/subskill learning](decisions/006-skill-subskill-learning.md) — adaptation flow with explicit approval
- [007 Review modal 4 steps](decisions/007-review-modal-4-steps.md) — full-screen over inline panel
- [008 Horizontal cylinders vertical stack](decisions/008-horizontal-cylinders-vertical-stack.md) — proper infra symbols, not emojis
- [009 Docker prerequisite](decisions/009-docker-prerequisite-for-skill.md) — skill checks health before push
- [010 SQLite default](decisions/010-sqlite-default-postgres-optional.md) — PostgreSQL deferred to v2
- [011 ELK.js layout](decisions/011-elk-js-layout-engine.md) — layered + force algorithms

## Design
- [Architecture](design/architecture.md) — 4-component system overview + data flow
- [Canvas](design/canvas.md) — SVG stack, coordinates, edge routing, ELK layout
- [Skill system](design/skill-system.md) — file structure, subskill loading, adaptation flow
- [Symbol system](design/symbol-system.md) — symbols.yaml structure, adding new symbols

## Constraints
- [Constraints](CONSTRAINTS.md) — 10 hard rules
