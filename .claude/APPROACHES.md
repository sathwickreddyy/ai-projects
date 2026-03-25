# APPROACHES.md — alternative approaches considered (append-only)

## [APPROACH] Implementation order
Options considered:
  A) Top-down: start with frontend, mock backend — fast to see UI early
  B) Bottom-up: infra → DB → backend → frontend (Section 10 order)
Chosen: B
Reason: Backend services are dependencies of frontend. Building in dependency order means each layer is testable before the next is added.
---
