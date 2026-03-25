# Decision: Docker Must Be Running Before Skill Executes

**Date:** 2026-03-25
**Status:** Accepted

The skill MUST call `check_app_health()` MCP tool before `push_architecture()`. If the app is not running, the skill tells the user to run `docker compose up` and stops.

This prevents silent failures where the skill generates an architecture but has nowhere to send it. The MCP server's health check tool calls GET /health on the backend.
