import json
import logging
import os

import aioredis
from aiokafka import AIOKafkaConsumer

logger = logging.getLogger(__name__)


async def start_notification_consumer() -> None:
    kafka_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    redis_url = os.environ.get("REDIS_URL", "redis://redis:6379")

    consumer = AIOKafkaConsumer(
        "orders",
        bootstrap_servers=kafka_servers,
        group_id="notification-service",
        auto_offset_reset="earliest",
    )
    await consumer.start()

    redis = await aioredis.from_url(redis_url)

    logger.info("Notification consumer started, listening on topic 'orders'")
    try:
        async for msg in consumer:
            try:
                order = json.loads(msg.value.decode("utf-8"))
                payload = json.dumps({
                    "event": "order_created",
                    "order_id": order.get("id"),
                    "customer_id": order.get("customer_id"),
                })
                await redis.publish("order_notifications", payload)
                logger.info("Published notification for order %s", order.get("id"))
            except Exception as e:
                logger.error("Error processing message: %s", e)
    finally:
        await consumer.stop()
        await redis.close()
