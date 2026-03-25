# MEMORY.md — arch-platform decision log (append-only)

## [DECISION] Project initialization
Date: 2026-03-25
File(s): arch-platform/ (root)
Decision: Created arch-platform/ as the single root for all project files. All 5 .claude/ tracking files created before any application code.
Why: Rule 0 requires .claude/ memory system to exist before implementation begins so decisions are captured from the start.
Alternatives rejected: Starting with application code immediately — rejected because it violates Rule 0.
---

## [DECISION] SQLAlchemy column naming for metadata
Date: 2026-03-25
File(s): backend/app/db/session.py
Decision: Named the column attribute `metadata_` (with underscore) but kept DB column name `metadata` via the `Column("metadata", ...)` explicit name parameter.
Why: `metadata` is a reserved attribute name on SQLAlchemy's DeclarativeBase. Using `metadata_` avoids collision while keeping the DB schema column named `metadata` as specified.
Alternatives rejected: Renaming the DB column — rejected to keep init.sql schema unchanged.
---

## [DECISION] Watcher uses asyncio.run_coroutine_threadsafe
Date: 2026-03-25
File(s): backend/app/services/watcher.py
Decision: Watchdog runs in a thread; DB updates use run_coroutine_threadsafe to submit coroutines to the asyncio event loop.
Why: Watchdog's Observer is synchronous/threaded. SQLAlchemy async sessions must run on an event loop. Bridge via run_coroutine_threadsafe is the correct pattern.
Alternatives rejected: Running sync SQLAlchemy — rejected because rest of app uses async engine.
---

## [DECISION] MCP server uses FastMCP from mcp.server.fastmcp
Date: 2026-03-25
File(s): mcp-server/server.py
Decision: Used FastMCP with @mcp.tool() decorators and `mcp.run(transport="stdio")`.
Why: FastMCP is the high-level API provided by the mcp>=1.0 SDK that cleanly maps to stdio transport required by the spec.
Alternatives rejected: Low-level mcp.Server — more verbose, unnecessary for this use case.
---

## [DECISION] Frontend ArchCanvas uses useReactFlow for screenToFlowPosition
Date: 2026-03-25
File(s): frontend/src/components/canvas/ArchCanvas.tsx
Decision: Wrapped ArchCanvas in ReactFlowProvider in App.tsx so that useReactFlow() hook is available for screenToFlowPosition on drag-drop.
Why: screenToFlowPosition requires ReactFlowProvider to be an ancestor. Without the provider the hook throws. The provider is placed in App.tsx so all canvas components have access.
Alternatives rejected: Passing position manually — more complex, violates clean abstraction.
---

## [DECISION] Layer 7 complete — all 26 frontend files written
Date: 2026-03-25
File(s): frontend/src/**
Decision: All files created per spec. CSS grid layout in AppShell, SSE streaming via fetch+ReadableStream in client.ts, Zustand single source of truth for nodes/edges.
Why: Followed Section 6 and all hard constraints from Section 9.
Alternatives rejected: N/A — spec was authoritative.
---

## [DECISION] Dual auth mode — CLI subprocess vs Bedrock SDK vs direct API key
Date: 2026-03-25
File(s): .env.example, backend/app/core/config.py, backend/app/services/claude_service.py
Decision: Three-driver architecture behind a unified _complete()/_stream() router, mode selected at runtime via CLAUDE_AUTH_MODE env var. CLI uses `claude --print --stream` subprocess; Bedrock uses boto3 invoke_model_with_response_stream in a thread with asyncio.run_in_executor; api uses AsyncAnthropic SDK directly.
Why: Laptop runs Pro subscription via CLI (no API key needed, no cost). Mac Mini uses AWS Bedrock. Any machine can fall back to direct API key. A single env var switch at runtime with no code changes needed.
Alternatives rejected: (1) Separate docker-compose files per machine — too much duplication. (2) Conditional imports at module level — harder to test and validate at startup. (3) Anthropic Bedrock SDK wrapper — boto3 is sufficient and already listed as a new dependency.
---
