from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db, Session, Diagram

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# Request/Response models
class ArchitectureData(BaseModel):
    title: str
    mode: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    flows: List[Dict[str, Any]]
    theme: Dict[str, Any] = {}


class PushArchitectureRequest(BaseModel):
    context: Dict[str, Any]
    architecture: ArchitectureData


class SessionResponse(BaseModel):
    id: str
    url: str
    title: str


class SessionListItem(BaseModel):
    id: str
    title: str
    status: str
    created_at: str


class SessionWithDiagram(BaseModel):
    id: str
    title: str
    status: str
    context: Dict[str, Any]
    created_at: str
    updated_at: str
    diagram: Dict[str, Any]


class LatestDiagramState(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    flows: List[Dict[str, Any]]
    mode: str
    theme: Dict[str, Any]
    version: int
    diff_summary: Dict[str, Any]


@router.post("/", response_model=SessionResponse)
async def push_architecture(
    payload: PushArchitectureRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new session with its initial diagram (v1).
    Accepts context envelope and architecture data.
    """
    # Create session
    session = Session(
        title=payload.architecture.title,
        context=payload.context,
        status="active",
    )
    db.add(session)
    await db.flush()  # Get the session ID

    # Create initial diagram (version 1)
    diagram = Diagram(
        session_id=session.id,
        version=1,
        nodes=payload.architecture.nodes,
        edges=payload.architecture.edges,
        flows=payload.architecture.flows,
        mode=payload.architecture.mode,
        theme=payload.architecture.theme,
    )
    db.add(diagram)
    await db.commit()

    return SessionResponse(
        id=session.id,
        url=f"http://localhost:13000/session/{session.id}",
        title=session.title,
    )


@router.get("/", response_model=List[SessionListItem])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    """
    List all sessions ordered by created_at desc.
    """
    result = await db.execute(
        select(Session).order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    return [
        SessionListItem(
            id=s.id,
            title=s.title,
            status=s.status,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionWithDiagram)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get session by ID with its latest diagram.
    """
    # Get session
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get latest diagram
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == session_id)
        .order_by(Diagram.version.desc())
        .limit(1)
    )
    diagram = result.scalar_one_or_none()

    diagram_data = {}
    if diagram:
        diagram_data = {
            "id": diagram.id,
            "version": diagram.version,
            "nodes": diagram.nodes,
            "edges": diagram.edges,
            "flows": diagram.flows,
            "mode": diagram.mode,
            "theme": diagram.theme,
            "created_at": diagram.created_at,
        }

    return SessionWithDiagram(
        id=session.id,
        title=session.title,
        status=session.status,
        context=session.context,
        created_at=session.created_at,
        updated_at=session.updated_at,
        diagram=diagram_data,
    )


@router.get("/{session_id}/latest", response_model=LatestDiagramState)
async def get_latest_state(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get just the latest diagram state with a diff summary.
    Compares node count vs v1.
    """
    # Get latest diagram
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == session_id)
        .order_by(Diagram.version.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()

    if not latest:
        raise HTTPException(status_code=404, detail="No diagram found for session")

    # Get v1 for diff comparison
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == session_id)
        .where(Diagram.version == 1)
    )
    v1 = result.scalar_one_or_none()

    # Calculate diff summary
    diff_summary = {}
    if v1:
        v1_node_count = len(v1.nodes) if v1.nodes else 0
        latest_node_count = len(latest.nodes) if latest.nodes else 0
        diff_summary = {
            "v1_node_count": v1_node_count,
            "current_node_count": latest_node_count,
            "node_diff": latest_node_count - v1_node_count,
        }

    return LatestDiagramState(
        nodes=latest.nodes,
        edges=latest.edges,
        flows=latest.flows,
        mode=latest.mode,
        theme=latest.theme,
        version=latest.version,
        diff_summary=diff_summary,
    )
