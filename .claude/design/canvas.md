# Canvas & Rendering Design

## SVG Canvas Stack (z-order bottom to top)

1. Background (dot grid pattern, 24px spacing, #1e2430)
2. Edge layer (SVG paths with orthogonal routing)
3. Node layer (SVG symbol components)
4. Port overlay (6 ports per node, visible on hover/select)
5. HUD overlay (mode toggle, minimap — HTML positioned over SVG)

## Coordinate System

- Positions stored as 0.0-1.0 fractions in DB
- Canvas: CANVAS_W=1200, CANVAS_H=700
- Render: multiply fractions by canvas dims
- Save: divide pixels by canvas dims

## Edge Routing

- Orthogonal routing with L/Z-shaped bends
- Auto-assigns nearest port pair when ports not specified
- Bezier smoothing at bend points
- 20px minimum clearance from node borders
- Styles: solid (sync calls), animated dash (async/events), dotted (optional)

## Layout Engine (ELK.js)

- layered algorithm for stage_diagram, step_by_step
- force algorithm for mental_map
- Triggers: auto-arrange button, initial load, new node drop
