import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Architecture, ClaudeReview, Skill, get_db
from app.services.claude_service import (
    apply_preference_change,
    generate_architecture,
    stream_review,
)

router = APIRouter(prefix="/api/claude", tags=["claude"])


class ReviewRequest(BaseModel):
    architecture_id: str
    question: Optional[str] = None


class ApplyPreferenceRequest(BaseModel):
    architecture_id: str
    instruction: str


class ApproveSkillRequest(BaseModel):
    name: str
    description: str
    prompt_snippet: str
    trigger_pattern: list[str] = []


@router.post("/review/stream")
async def review_stream(body: ReviewRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Architecture).where(Architecture.id == body.architecture_id)
    )
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    arch_dict = {
        "id": str(arch.id),
        "nodes": arch.nodes or [],
        "edges": arch.edges or [],
        "mode": arch.mode,
        "theme": arch.theme or {},
    }

    accumulated: list[str] = []

    async def event_generator():
        nonlocal accumulated
        async for chunk in stream_review(db, arch_dict, body.question):
            accumulated.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        full_text = "".join(accumulated)
        try:
            feedback = json.loads(full_text)
        except json.JSONDecodeError:
            feedback = {"raw": full_text}

        review = ClaudeReview(
            architecture_id=body.architecture_id,
            prompt=body.question or "general review",
            feedback=feedback,
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)

        yield f"data: {json.dumps({'review_id': str(review.id), 'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/apply-preference")
async def apply_preference(body: ApplyPreferenceRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Architecture).where(Architecture.id == body.architecture_id)
    )
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    arch_dict = {
        "id": str(arch.id),
        "nodes": arch.nodes or [],
        "edges": arch.edges or [],
        "mode": arch.mode,
        "theme": arch.theme or {},
    }

    updated = await apply_preference_change(db, arch_dict, body.instruction)

    if updated.get("nodes"):
        arch.nodes = updated["nodes"]
    if updated.get("edges"):
        arch.edges = updated["edges"]
    if updated.get("mode"):
        arch.mode = updated["mode"]
    if updated.get("theme"):
        arch.theme = updated["theme"]

    from datetime import datetime, timezone
    arch.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(arch)

    return {
        **updated,
        "architecture_id": str(arch.id),
    }


@router.post("/approve-skill")
async def approve_skill(body: ApproveSkillRequest, db: AsyncSession = Depends(get_db)):
    skill = Skill(
        name=body.name,
        description=body.description,
        prompt_snippet=body.prompt_snippet,
        trigger_pattern=body.trigger_pattern,
        approved_by="user",
    )
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return {
        "id": str(skill.id),
        "name": skill.name,
        "description": skill.description,
        "prompt_snippet": skill.prompt_snippet,
        "trigger_pattern": skill.trigger_pattern or [],
        "scope": skill.scope,
        "approved_by": skill.approved_by,
        "active": skill.active,
    }
