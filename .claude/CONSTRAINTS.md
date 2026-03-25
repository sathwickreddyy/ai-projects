# CONSTRAINTS.md — hard constraints (reference copy from Section 9)

1.  All files live inside arch-platform/. Never write outside this root folder.
2.  .claude/ files are append-only. Never overwrite an existing entry — only add new ones.
3.  TypeScript strict mode. No implicit `any`. All API responses typed via types/index.ts.
4.  Node position storage: x/y are fractions (0.0-1.0) in DB.
    Canvas load: multiply by 1200 (width) and 700 (height) for pixel position.
    Drag end: divide pixel position by 1200/700 back to fractions before PATCH.
5.  SSE streaming: use fetch() + response.body.getReader(), NOT EventSource.
    EventSource does not support POST. Accumulate all chunks. On "done":true event,
    attempt JSON.parse of full text. Show raw text while streaming.
6.  No hardcoded API keys in any file. Keys only from .env via pydantic-settings (backend)
    or import.meta.env (frontend).
7.  Palette drag to canvas: use onDrop + onDragOver on React Flow wrapper.
    dataTransfer key = 'component-name'. On drop, look up component from store by name,
    create node with that component's color/icon/type.
8.  PNG export: html-to-image toPng() on div#arch-canvas-wrapper.
    Pass filter function that returns false for elements with class
    'react-flow__controls' or 'react-flow__minimap'.
9.  All HTTP calls from frontend components go through src/api/client.ts only.
    No inline fetch() or axios calls in component files.
10. Zustand store is single source of truth for nodes/edges.
    Components read from store. Local React state only for ephemeral UI (hover, input).
11. MCP server transport is stdio. Must start with `python server.py` and communicate
    over stdin/stdout per MCP protocol spec.
12. Sample project Python files must be syntactically valid.
    detect_stack() must return True for: fastapi, kafka, redis, postgres.
13. Backend Dockerfile: FROM python:3.12-slim
    Frontend Dockerfile: FROM node:20-alpine
14. All Claude API calls use model: claude-sonnet-4-20250514
