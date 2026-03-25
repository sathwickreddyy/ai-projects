# Decision: Custom SVG Canvas Instead of React Flow

**Date:** 2026-03-25
**Status:** Accepted

React Flow's node model is too opinionated for our symbol system. We need:
- 7 distinct SVG shape types with internal elements (partition lanes, animated messages, key patterns)
- Container shapes that hold child shapes (Kafka broker with topic cylinders)
- 6 custom connection ports per node
- Proper z-ordering (edges always visible above background, below nodes)

Custom SVG canvas with pan/zoom gives full control. ELK.js handles layout computation.
