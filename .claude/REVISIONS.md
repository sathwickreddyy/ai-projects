# REVISIONS.md — changes made after initial implementation (append-only)

## [REVISION] Added dual auth mode to claude_service.py
File: backend/app/services/claude_service.py
Original approach: only direct Anthropic API key (single anthropic.Anthropic client)
New approach: runtime mode detection — CLI subprocess | Bedrock | direct API key, routed via _complete()/_stream() based on settings.claude_auth_mode
Reason: laptop uses Pro subscription (CLI), mac mini uses Bedrock or direct API key
---

## [REVISION] Settings class — new fields and validate_auth()
File: backend/app/core/config.py
Original approach: ANTHROPIC_API_KEY + DATABASE_URL + basic fields
New approach: claude_auth_mode + bedrock/aws fields + validate_auth() startup check
Reason: support multi-machine auth without code changes; fail fast with clear errors
---

## [REVISION] docker-compose.yml — backend auth env vars + CLI volume
File: docker-compose.yml
Original approach: no Claude auth env vars in backend service
New approach: CLAUDE_AUTH_MODE, AWS_* vars, PATH override, ~/.npm-global volume mount for CLI mode
Reason: CLI subprocess needs `claude` binary accessible inside the container
---
