from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Skill, get_db

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillCreate(BaseModel):
    name: str
    description: str
    prompt_snippet: str
    trigger_pattern: list[str] = []
    scope: str = "global"


def _skill_to_dict(s: Skill) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "description": s.description,
        "prompt_snippet": s.prompt_snippet,
        "trigger_pattern": s.trigger_pattern or [],
        "scope": s.scope,
        "approved_at": s.approved_at.isoformat() if s.approved_at else None,
        "approved_by": s.approved_by,
        "active": s.active,
    }


@router.get("/")
async def list_skills(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).order_by(Skill.approved_at.desc()))
    return [_skill_to_dict(s) for s in result.scalars().all()]


@router.post("/")
async def create_skill(body: SkillCreate, db: AsyncSession = Depends(get_db)):
    skill = Skill(
        name=body.name,
        description=body.description,
        prompt_snippet=body.prompt_snippet,
        trigger_pattern=body.trigger_pattern,
        scope=body.scope,
    )
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return _skill_to_dict(skill)


@router.patch("/{skill_id}/toggle")
async def toggle_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.active = not skill.active
    await db.commit()
    await db.refresh(skill)
    return _skill_to_dict(skill)


@router.delete("/{skill_id}")
async def delete_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    await db.delete(skill)
    await db.commit()
    return {"deleted": skill_id}
