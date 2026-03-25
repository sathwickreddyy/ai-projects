# Hard Constraints

1. No hardcoded Claude model versions — CLI uses latest, API uses CLAUDE_MODEL env var
2. Symbol types defined ONLY in symbols.yaml — both skill and app read from this file
3. App NEVER auto-saves to skill files — explicit approval required
4. Skill must check app health before push_architecture
5. All edges/connections always visible — never hidden behind nodes
6. Node positions stored as 0.0-1.0 fractions in DB, converted to pixels on canvas
7. 6 connection ports per node: top, top-right, right, bottom, bottom-left, left
8. SSE/WebSocket for streaming — no polling
9. TypeScript strict mode, no implicit any
10. SQLite default, PostgreSQL optional
