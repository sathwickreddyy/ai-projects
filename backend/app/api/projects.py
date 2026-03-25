import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import Architecture, Project, get_db
from app.services.claude_service import generate_architecture
from app.services.scanner import scan_and_save

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    path: str
    description: Optional[str] = None


class GenerateRequest(BaseModel):
    instruction: Optional[str] = None
    name: Optional[str] = None


@router.get("/")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "path": p.path,
            "description": p.description,
            "last_scanned": p.last_scanned.isoformat() if p.last_scanned else None,
            "metadata": p.metadata_ or {},
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.post("/")
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project_path = str(Path(settings.projects_dir) / body.path)
    if not Path(project_path).is_dir():
        raise HTTPException(status_code=400, detail=f"Path does not exist: {project_path}")

    existing = await db.execute(select(Project).where(Project.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Project name already exists")

    project = Project(
        name=body.name,
        path=project_path,
        description=body.description,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {
        "id": str(project.id),
        "name": project.name,
        "path": project.path,
        "description": project.description,
        "metadata": project.metadata_ or {},
    }


@router.get("/volume/list")
async def list_volume_dirs():
    base = Path(settings.projects_dir)
    if not base.is_dir():
        return []
    return [
        {"name": d.name, "path": d.name}
        for d in sorted(base.iterdir())
        if d.is_dir()
    ]


@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": str(project.id),
        "name": project.name,
        "path": project.path,
        "description": project.description,
        "last_scanned": project.last_scanned.isoformat() if project.last_scanned else None,
        "metadata": project.metadata_ or {},
        "file_index": project.file_index or {},
    }


@router.post("/{project_id}/scan")
async def scan_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    context = await scan_and_save(project_id, project.path, db)
    detected = context.get("detected", {})
    return {
        "detected": detected,
        "files_scanned": context.get("total_files_scanned", 0),
        "file_list": list(context.get("files", {}).keys()),
    }


@router.post("/{project_id}/generate")
async def generate_project_architecture(
    project_id: str,
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    context = await scan_and_save(project_id, project.path, db)
    arch_data = await generate_architecture(db, context, project_id, body.instruction)

    arch = Architecture(
        project_id=project_id,
        name=body.name or arch_data.get("title", "Default"),
        nodes=arch_data.get("nodes", []),
        edges=arch_data.get("edges", []),
        mode=arch_data.get("mode", "stage_diagram"),
        theme=arch_data.get("theme", {}),
        layout={},
    )
    db.add(arch)
    await db.commit()
    await db.refresh(arch)

    return {
        **arch_data,
        "architecture_id": str(arch.id),
    }
