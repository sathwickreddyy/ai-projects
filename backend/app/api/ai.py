import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Diagram, get_db, Session as DbSession
from app.services.ai_engine import AIEngine

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ReviewRequest(BaseModel):
    diagram_id: str
    question: Optional[str] = None

class FollowupRequest(BaseModel):
    diagram_id: str
    qa_history: list[dict]

class AdaptationRequest(BaseModel):
    session_id: str

class ImpactRequest(BaseModel):
    adaptation: dict

@router.post("/review")
async def review(body: ReviewRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Diagram).where(Diagram.id == body.diagram_id))
    diagram = result.scalar_one_or_none()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    # Get session context
    sess_result = await db.execute(select(DbSession).where(DbSession.id == diagram.session_id))
    session = sess_result.scalar_one_or_none()
    context = session.context if session else {}

    engine = AIEngine()
    feedback = await engine.review(
        diagram={"nodes": diagram.nodes, "edges": diagram.edges, "flows": diagram.flows},
        context=context,
    )
    return feedback

@router.post("/review/stream")
async def review_stream(body: ReviewRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Diagram).where(Diagram.id == body.diagram_id))
    diagram = result.scalar_one_or_none()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    sess_result = await db.execute(select(DbSession).where(DbSession.id == diagram.session_id))
    session = sess_result.scalar_one_or_none()
    context = session.context if session else {}

    engine = AIEngine()

    async def event_generator():
        async for chunk in engine.stream_review(
            diagram={"nodes": diagram.nodes, "edges": diagram.edges},
            context=context,
        ):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/followup")
async def followup(body: FollowupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Diagram).where(Diagram.id == body.diagram_id))
    diagram = result.scalar_one_or_none()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    sess_result = await db.execute(select(DbSession).where(DbSession.id == diagram.session_id))
    session = sess_result.scalar_one_or_none()
    context = session.context if session else {}

    engine = AIEngine()
    return await engine.answer_followup(
        diagram={"nodes": diagram.nodes, "edges": diagram.edges},
        context=context,
        qa_history=body.qa_history,
    )

@router.post("/adaptation")
async def generate_adaptation(body: AdaptationRequest, db: AsyncSession = Depends(get_db)):
    # Get v1 and latest diagram for this session
    v1_result = await db.execute(
        select(Diagram).where(Diagram.session_id == body.session_id, Diagram.version == 1)
    )
    v1 = v1_result.scalar_one_or_none()
    if not v1:
        raise HTTPException(status_code=404, detail="Session not found")

    latest_result = await db.execute(
        select(Diagram).where(Diagram.session_id == body.session_id).order_by(Diagram.version.desc())
    )
    latest = latest_result.scalar_one_or_none()

    sess_result = await db.execute(select(DbSession).where(DbSession.id == body.session_id))
    session = sess_result.scalar_one_or_none()
    context = session.context if session else {}

    engine = AIEngine()
    return await engine.generate_adaptation(
        diagram_v1={"nodes": v1.nodes, "edges": v1.edges},
        diagram_v2={"nodes": latest.nodes, "edges": latest.edges},
        context=context,
    )

@router.post("/impact")
async def preview_impact(body: ImpactRequest):
    from app.services.skill_manager import SkillManager
    from app.core.config import settings

    mgr = SkillManager(settings.skills_dir + "/intelligent-arch-creator")
    skill_tree = mgr.read_skill_tree()

    engine = AIEngine()
    return await engine.preview_impact(
        adaptation=body.adaptation,
        skill_tree=skill_tree,
    )
