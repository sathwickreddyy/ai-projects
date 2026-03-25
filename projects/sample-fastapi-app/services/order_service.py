import json
import os
from typing import Any

import asyncpg
from aiokafka import AIOKafkaProducer


async def create_order(pool: asyncpg.Pool, data: dict[str, Any]) -> dict:
    row = await pool.fetchrow(
        """
        INSERT INTO orders (customer_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING id, customer_id, product_id, quantity, status, created_at
        """,
        data.get("customer_id", "unknown"),
        data.get("product_id", "unknown"),
        int(data.get("quantity", 1)),
    )
    order = dict(row)
    order["created_at"] = order["created_at"].isoformat()

    producer = AIOKafkaProducer(
        bootstrap_servers=os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
    )
    await producer.start()
    try:
        await producer.send_and_wait(
            "orders",
            json.dumps(order).encode("utf-8"),
        )
    finally:
        await producer.stop()

    return order


async def get_order(pool: asyncpg.Pool, order_id: int) -> asyncpg.Record | None:
    return await pool.fetchrow(
        "SELECT id, customer_id, product_id, quantity, status, created_at FROM orders WHERE id = $1",
        order_id,
    )
