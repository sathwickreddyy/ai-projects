import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Diagram, Session as DbSession, get_db
from app.services.ai_engine import AIEngine

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/review/{diagram_id}")
async def ws_review(diagram_id: str, websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        question = data.get("question")

        # Get diagram and context from DB
        from app.db.session import _session_factory
        async with _session_factory() as db:
            result = await db.execute(select(Diagram).where(Diagram.id == diagram_id))
            diagram = result.scalar_one_or_none()
            if not diagram:
                await websocket.send_json({"error": "Diagram not found"})
                await websocket.close()
                return

            sess_result = await db.execute(select(DbSession).where(DbSession.id == diagram.session_id))
            session = sess_result.scalar_one_or_none()
            context = session.context if session else {}

        engine = AIEngine()
        async for chunk in engine.stream_review(
            diagram={"nodes": diagram.nodes, "edges": diagram.edges},
            context=context,
        ):
            await websocket.send_json({"chunk": chunk})

        await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        pass
