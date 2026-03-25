# Decision: symbols.yaml as Shared Contract

**Date:** 2026-03-25
**Status:** Accepted

The symbol instruction set (symbols.yaml) is the single source of truth for what infrastructure symbols exist and how they render. Both the Claude Code skill and the app frontend read from this file.

Structure: self-describing meta-schema (shapes, internal elements, ports, animations, colors, prop types) + symbol definitions. Any AI model can read meta: section to understand the building blocks, then add new symbols.

Adding a new symbol requires ONLY editing symbols.yaml — no code changes needed.
