# Decision: SQLite Default, PostgreSQL Deferred to v2

**Date:** 2026-03-25
**Status:** Accepted

SQLite (via aiosqlite) for v1. Single file at data/arch_viewer.db. Schema auto-created on startup. No migrations.

PostgreSQL reserved for v2 when team/multi-user features are needed. Port 15432 allocated but not used yet. Docker compose has no Postgres service in v1.
