import os
from pathlib import Path

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


@router.get("/bundle")
async def get_skill_bundle():
    """Return all skill files for installation into .claude/commands/."""
    skill_dir = Path(settings.skills_dir) / "intelligent-arch-creator"
    if not skill_dir.is_absolute():
        here = Path(os.path.abspath(__file__))
        project_root = here.parent.parent.parent.parent
        skill_dir = project_root / settings.skills_dir / "intelligent-arch-creator"

    files = {}
    for f in skill_dir.rglob("*"):
        if f.is_file() and not f.name.startswith("."):
            rel = str(f.relative_to(skill_dir))
            files[rel] = f.read_text()

    return {
        "skill_name": "intelligent-arch-creator",
        "files": files,
    }
