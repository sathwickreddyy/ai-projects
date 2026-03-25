import asyncio
import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException

from services.order_service import create_order, get_order
from services.notification_service import start_notification_consumer

_pool: asyncpg.Pool | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pool
    _pool = await asyncpg.create_pool(
        os.environ["DATABASE_URL"],
        min_size=2,
        max_size=10,
    )
    await _pool.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    consumer_task = asyncio.create_task(start_notification_consumer())
    yield
    consumer_task.cancel()
    await _pool.close()


app = FastAPI(title="Order Service", lifespan=lifespan)


@app.post("/orders")
async def post_order(payload: dict[str, Any]):
    if _pool is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    order = await create_order(_pool, payload)
    return order


@app.get("/orders/{order_id}")
async def fetch_order(order_id: int):
    if _pool is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    order = await get_order(_pool, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(order)
