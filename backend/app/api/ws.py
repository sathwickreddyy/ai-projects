import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Architecture, get_db
from app.services.claude_service import stream_review

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/review/{arch_id}")
async def ws_review(arch_id: str, websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        question = data.get("question")

        result = await db.execute(
            select(Architecture).where(Architecture.id == arch_id)
        )
        arch = result.scalar_one_or_none()
        if not arch:
            await websocket.send_json({"error": "Architecture not found"})
            await websocket.close()
            return

        arch_dict = {
            "id": str(arch.id),
            "nodes": arch.nodes or [],
            "edges": arch.edges or [],
            "mode": arch.mode,
            "theme": arch.theme or {},
        }

        async for chunk in stream_review(db, arch_dict, question):
            await websocket.send_json({"chunk": chunk})

        await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        pass
