# System Architecture

Four components:
- MCP Server (stdio, thin bridge) → 5 tools
- Backend (FastAPI + SQLite) → sessions, AI engine, skill manager
- Frontend (React + custom SVG canvas) → symbols, layout, review
- Skill files (on disk) → skill.md, symbols.yaml, keywords.yaml, subskills/

See full spec: docs/superpowers/specs/2026-03-25-intelligent-arch-viewer-design.md
