# Skill System Design

## File Structure

```
skills/intelligent-arch-creator/
  skill.md          — main skill instructions for Claude Code
  symbols.yaml      — shared symbol instruction set (meta + 10 definitions)
  keywords.yaml     — keyword → subskill mapping index
  subskills/
    order-processing.md  — learned patterns for event-driven order systems
```

## How Subskills Load

1. Skill detects project's technology stack
2. Reads keywords.yaml — match_any groups (AND within group, OR between groups)
3. If match found, reads subskill .md and applies its decisions/patterns/overrides

## Adaptation Flow

1. User finalizes modified diagram in app
2. App extracts decisions by comparing v1 vs current (via AI engine)
3. User reviews proposed adaptation in the Adapt Skill tab
4. User selects target subskill (dropdown or new name) in the Skill Tree tab
5. User cherry-picks decisions and keywords
6. User clicks "Approve & Save" → backend writes to skill file on disk
7. keywords.yaml updated if new keywords provided

## Safety

- App NEVER auto-saves to skill files
- Every write requires explicit approval button click
- Impact preview shows what changes for future generations
