# Decision: Monolith Web App + MCP Bridge

**Date:** 2026-03-25
**Status:** Accepted

Three approaches evaluated:
- A) Monolith (FastAPI + React) with MCP bridge — recommended
- B) Split frontend + AI microservice — premature for v1
- C) Frontend-heavy with edge AI — API key in browser is insecure

Chose A: single deployable unit. Backend handles auth routing, AI calls, skill management. MCP server is a thin HTTP pass-through (5 tools, zero logic). Frontend is a custom SVG canvas (not React Flow — too opinionated for our symbol system).
