from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Architecture, ChangeLog, get_db

router = APIRouter(prefix="/api/architectures", tags=["architectures"])


class ArchPatch(BaseModel):
    nodes: Optional[list] = None
    edges: Optional[list] = None
    layout: Optional[dict] = None
    mode: Optional[str] = None
    theme: Optional[dict] = None
    name: Optional[str] = None


def _arch_to_dict(a: Architecture) -> dict:
    return {
        "id": str(a.id),
        "project_id": str(a.project_id),
        "name": a.name,
        "nodes": a.nodes or [],
        "edges": a.edges or [],
        "layout": a.layout or {},
        "mode": a.mode,
        "theme": a.theme or {},
        "version": a.version,
        "is_active": a.is_active,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }


@router.get("/project/{project_id}")
async def list_architectures(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Architecture)
        .where(Architecture.project_id == project_id)
        .order_by(Architecture.updated_at.desc())
    )
    return [_arch_to_dict(a) for a in result.scalars().all()]


@router.get("/{arch_id}")
async def get_architecture(arch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Architecture).where(Architecture.id == arch_id))
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")
    return _arch_to_dict(arch)


@router.patch("/{arch_id}")
async def update_architecture(
    arch_id: str, body: ArchPatch, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Architecture).where(Architecture.id == arch_id))
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    if body.nodes is not None:
        arch.nodes = body.nodes
    if body.edges is not None:
        arch.edges = body.edges
    if body.layout is not None:
        arch.layout = body.layout
    if body.mode is not None:
        arch.mode = body.mode
    if body.theme is not None:
        arch.theme = body.theme
    if body.name is not None:
        arch.name = body.name

    from sqlalchemy.sql import text
    from datetime import datetime, timezone
    arch.updated_at = datetime.now(timezone.utc)

    log = ChangeLog(
        architecture_id=arch_id,
        change_type="layout_changed",
        payload=body.model_dump(exclude_none=True),
    )
    db.add(log)
    await db.commit()
    await db.refresh(arch)
    return _arch_to_dict(arch)


@router.get("/{arch_id}/export/mermaid", response_class=PlainTextResponse)
async def export_mermaid(arch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Architecture).where(Architecture.id == arch_id))
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    lines = ["graph TD"]
    for node in (arch.nodes or []):
        nid = node.get("id", "unknown")
        label = node.get("label", nid)
        icon = node.get("icon", "")
        lines.append(f'    {nid}["{icon} {label}"]')
    for edge in (arch.edges or []):
        src = edge.get("source", "")
        tgt = edge.get("target", "")
        lbl = edge.get("label", "")
        lines.append(f'    {src} -->|"{lbl}"| {tgt}')

    return "\n".join(lines)


@router.get("/{arch_id}/export/drawio", response_class=PlainTextResponse)
async def export_drawio(arch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Architecture).where(Architecture.id == arch_id))
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']

    for i, node in enumerate(arch.nodes or []):
        nid = node.get("id", f"n{i}")
        label = node.get("label", nid)
        icon = node.get("icon", "")
        x = int(node.get("x", 0) * 800)
        y = int(node.get("y", 0) * 600)
        cells.append(
            f'<mxCell id="{nid}" value="{icon} {label}" style="rounded=1;" '
            f'vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="120" height="60" as="geometry"/></mxCell>'
        )

    for i, edge in enumerate(arch.edges or []):
        eid = edge.get("id", f"e{i}")
        src = edge.get("source", "")
        tgt = edge.get("target", "")
        lbl = edge.get("label", "")
        cells.append(
            f'<mxCell id="{eid}" value="{lbl}" edge="1" source="{src}" target="{tgt}" parent="1">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    inner = "\n  ".join(cells)
    return f'<mxfile><diagram><mxGraphModel><root>\n  {inner}\n</root></mxGraphModel></diagram></mxfile>'
