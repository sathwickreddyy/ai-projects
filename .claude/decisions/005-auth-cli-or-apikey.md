# Decision: CLI or API Key Auth (No OAuth)

**Date:** 2026-03-25
**Status:** Accepted

Two auth modes for the app's Claude integration:
- **CLI mode**: detects `claude` CLI on PATH, uses user's Pro/Max subscription. No API key needed. CLI always uses latest model.
- **API mode**: user pastes Anthropic API key. Model configurable via CLAUDE_MODEL env var.

Rejected OAuth (registering with Anthropic as OAuth app) — too complex for v1. The auth gate on first launch offers both options.

No hardcoded model versions anywhere. CLI omits --model flag (uses latest). API defaults to SDK default if CLAUDE_MODEL is empty.
