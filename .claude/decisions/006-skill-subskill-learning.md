# Decision: Skill/Subskill Learning System

**Date:** 2026-03-25
**Status:** Accepted

Main skill (`intelligent-arch-creator`) has a keyword index (keywords.yaml) that maps detected technology patterns to subskills. Subskills store:
- Decisions (always apply to matching architectures)
- Patterns (suggest when relevant)
- Symbol overrides (modify default rendering)

User modifies a diagram → app extracts decisions → proposes adaptation → user explicitly approves with impact preview → adaptation saved to target subskill file.

Key rule: app NEVER auto-saves to skill files. Every write requires explicit approval through the UI (Adapt Skill tab with "Approve & Save" button). User can manually target which subskill receives the adaptation via the Skill Tree tab.
