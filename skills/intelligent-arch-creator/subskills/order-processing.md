---
name: order-processing
description: Learned patterns for event-driven order processing systems
version: 1
learned_from: 1
last_updated: 2026-03-25
---

## Decisions (always apply these)

- Always include a DLQ (dead letter queue) topic per consumer group in the Kafka broker
- Separate the write path (API → Kafka → DB) from the notification path (Kafka → notification service → Redis pub/sub)
- Use Redis pub/sub for real-time consumer notifications, Kafka for durable event sourcing

## Patterns (suggest these when relevant)

- CQRS: separate read model (cache/replica) from write model (primary DB)
- Saga orchestrator for multi-step order workflows
- Event sourcing on the orders topic for audit trail
- Read replica for PostgreSQL when read:write ratio > 5:1

## Symbol Overrides

- kafka_broker: auto-include a DLQ topic (color: #6b7280) for each main topic
- Edge colors: write-path edges in #ef4444, notification-path edges in #f97316
