# Decision: Clean Slate Rebuild

**Date:** 2026-03-25
**Status:** Accepted

Previous implementation was a standalone web platform for architecture diagrams.
New design is fundamentally different: MCP-server-backed intelligent viewer with
skill adaptation, proper SVG infrastructure symbols, and AI review flow.
Rewriting from scratch is cleaner than adapting — no shared code between old and new.
