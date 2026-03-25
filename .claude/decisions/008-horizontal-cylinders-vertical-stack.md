# Decision: Horizontal Cylinders Stacked Vertically

**Date:** 2026-03-25
**Status:** Accepted

Infrastructure symbols use proper technical representations, not emojis:
- Kafka topics: horizontal cylinders (lying on side) with partition lanes and message blocks inside
- Kafka broker: container box with topic cylinders stacked vertically inside
- Redis pub/sub: container box with channel cylinders stacked vertically, animated messages flowing through
- Redis cache: diamond stack shape with key patterns
- PostgreSQL: horizontal cylinder with table row lines
- API services: hexagon with endpoint text
- Load balancer: rounded rectangle with status indicator
- Clients: circle
- External services: cloud

Cylinders are always horizontal (left ellipse cap + body + right ellipse cap) and stacked vertically when inside a container. All symbols are dynamic — adapt to names, partition counts, channel names via props.
