# Decision: ELK.js for Auto-Layout

**Date:** 2026-03-25
**Status:** Accepted

ELK (Eclipse Layout Kernel) compiled to JS. Handles hierarchical/layered layouts which map perfectly to architecture diagrams (clients at top → APIs → messaging → databases at bottom).

Two algorithms:
- `layered` for stage_diagram, step_by_step modes (default)
- `force` for mental_map mode

Edge routing uses orthogonal paths with obstacle avoidance, L/Z-shaped bends, and bezier smoothing. Auto-layout triggers on initial load, auto-arrange button, and after drag-drop of new components.
