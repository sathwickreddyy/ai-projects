from fastapi import APIRouter
from app.services.skill_manager import SkillManager
from app.core.config import settings

router = APIRouter(prefix="/api/skills", tags=["skills"])


def _get_manager() -> SkillManager:
    skill_dir = settings.skills_dir + "/intelligent-arch-creator"
    return SkillManager(skill_dir)


@router.get("/tree")
async def get_skill_tree():
    mgr = _get_manager()
    return mgr.read_skill_tree()


@router.post("/adapt")
async def save_adaptation(body: dict):
    mgr = _get_manager()
    path = mgr.save_adaptation(
        target_subskill=body["target_subskill"],
        decisions=body.get("decisions", []),
        keywords=body.get("keywords", []),
    )
    return {"saved_to": path, "status": "approved"}


@router.post("/impact")
async def preview_impact(body: dict):
    # This will be wired to AI engine later
    return {"impacts": [], "affected_keywords": []}
