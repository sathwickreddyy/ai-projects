# Sample FastAPI Order Processing System

This system demonstrates a production-ready microservice pattern for order processing. When a customer places an order via the REST API, it is persisted to PostgreSQL and simultaneously published to a Kafka topic, decoupling the write path from downstream event consumers.

## Technology Stack

FastAPI serves as the HTTP layer for its async-first design and automatic OpenAPI docs generation. PostgreSQL (via asyncpg) stores orders with ACID guarantees. Kafka (via aiokafka) acts as the event bus — chosen over direct service calls to enable durable, replayable event streams. Redis pub/sub (via aioredis) provides a lightweight channel for real-time frontend notifications without polling.

## Service Interaction

The `order_service` handles the write path: on POST /orders it inserts the row into PostgreSQL and then produces a message to the `orders` Kafka topic. The `notification_service` runs as a background async consumer: it reads from the `orders` topic, transforms each message into a notification payload, and publishes it to the Redis `order_notifications` pub/sub channel. Downstream WebSocket handlers or server-sent event streams can subscribe to this channel to push real-time updates to clients.
