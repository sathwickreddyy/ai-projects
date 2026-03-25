from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db, Diagram

router = APIRouter(prefix="/api/diagrams", tags=["diagrams"])


# Request/Response models
class DiagramVersion(BaseModel):
    id: str
    version: int
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    flows: List[Dict[str, Any]]
    mode: str
    theme: Dict[str, Any]
    created_at: str


class PatchDiagramRequest(BaseModel):
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    flows: Optional[List[Dict[str, Any]]] = None
    mode: Optional[str] = None
    theme: Optional[Dict[str, Any]] = None


class NodeChange(BaseModel):
    id: str
    name: Optional[str] = None


class EdgeChange(BaseModel):
    id: str
    source: Optional[str] = None
    target: Optional[str] = None


class DiagramDiff(BaseModel):
    added_nodes: List[NodeChange]
    removed_nodes: List[NodeChange]
    modified_nodes: List[Dict[str, Any]]
    added_edges: List[EdgeChange]
    removed_edges: List[EdgeChange]


@router.get("/{session_id}", response_model=List[DiagramVersion])
async def list_diagram_versions(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    List all diagram versions for a session, ordered by version desc.
    """
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == session_id)
        .order_by(Diagram.version.desc())
    )
    diagrams = result.scalars().all()

    if not diagrams:
        raise HTTPException(status_code=404, detail="No diagrams found for session")

    return [
        DiagramVersion(
            id=d.id,
            version=d.version,
            nodes=d.nodes,
            edges=d.edges,
            flows=d.flows,
            mode=d.mode,
            theme=d.theme,
            created_at=d.created_at,
        )
        for d in diagrams
    ]


@router.patch("/{diagram_id}", response_model=DiagramVersion)
async def patch_diagram(
    diagram_id: str,
    patch: PatchDiagramRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a diagram. Creates a NEW Diagram row with version+1 (same session_id).
    Accepts partial: nodes, edges, flows, mode, theme. Returns the new version.
    """
    # Get the existing diagram
    result = await db.execute(
        select(Diagram).where(Diagram.id == diagram_id)
    )
    existing = result.scalar_one_or_none()

    if not existing:
        raise HTTPException(status_code=404, detail="Diagram not found")

    # Get the current max version for this session
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == existing.session_id)
        .order_by(Diagram.version.desc())
        .limit(1)
    )
    max_version_diagram = result.scalar_one_or_none()
    new_version = max_version_diagram.version + 1 if max_version_diagram else 1

    # Create new diagram with updated fields
    new_diagram = Diagram(
        session_id=existing.session_id,
        version=new_version,
        nodes=patch.nodes if patch.nodes is not None else existing.nodes,
        edges=patch.edges if patch.edges is not None else existing.edges,
        flows=patch.flows if patch.flows is not None else existing.flows,
        mode=patch.mode if patch.mode is not None else existing.mode,
        theme=patch.theme if patch.theme is not None else existing.theme,
    )

    db.add(new_diagram)
    await db.commit()
    await db.refresh(new_diagram)

    return DiagramVersion(
        id=new_diagram.id,
        version=new_diagram.version,
        nodes=new_diagram.nodes,
        edges=new_diagram.edges,
        flows=new_diagram.flows,
        mode=new_diagram.mode,
        theme=new_diagram.theme,
        created_at=new_diagram.created_at,
    )


@router.get("/{diagram_id}/diff", response_model=DiagramDiff)
async def get_diagram_diff(
    diagram_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Compute diff between this diagram and v1 of the same session.
    Returns added_nodes, removed_nodes, modified_nodes, added_edges, removed_edges.
    """
    # Get the current diagram
    result = await db.execute(
        select(Diagram).where(Diagram.id == diagram_id)
    )
    current = result.scalar_one_or_none()

    if not current:
        raise HTTPException(status_code=404, detail="Diagram not found")

    # Get v1 of the same session
    result = await db.execute(
        select(Diagram)
        .where(Diagram.session_id == current.session_id)
        .where(Diagram.version == 1)
    )
    v1 = result.scalar_one_or_none()

    if not v1:
        raise HTTPException(status_code=404, detail="Version 1 not found for this session")

    # Build node ID maps
    v1_nodes = {node["id"]: node for node in v1.nodes}
    current_nodes = {node["id"]: node for node in current.nodes}

    # Calculate node differences
    added_nodes = [
        NodeChange(id=node_id, name=current_nodes[node_id].get("name"))
        for node_id in current_nodes
        if node_id not in v1_nodes
    ]

    removed_nodes = [
        NodeChange(id=node_id, name=v1_nodes[node_id].get("name"))
        for node_id in v1_nodes
        if node_id not in current_nodes
    ]

    modified_nodes = []
    for node_id in current_nodes:
        if node_id in v1_nodes:
            v1_node = v1_nodes[node_id]
            current_node = current_nodes[node_id]
            # Check if any properties changed
            changes = {}
            for key in current_node:
                if key in v1_node and v1_node[key] != current_node[key]:
                    changes[key] = {
                        "old": v1_node[key],
                        "new": current_node[key],
                    }
            # Check for new keys
            for key in current_node:
                if key not in v1_node:
                    changes[key] = {
                        "old": None,
                        "new": current_node[key],
                    }
            if changes:
                modified_nodes.append({
                    "id": node_id,
                    "changes": changes,
                })

    # Build edge ID maps
    v1_edges = {edge["id"]: edge for edge in v1.edges}
    current_edges = {edge["id"]: edge for edge in current.edges}

    # Calculate edge differences
    added_edges = [
        EdgeChange(
            id=edge_id,
            source=current_edges[edge_id].get("source"),
            target=current_edges[edge_id].get("target"),
        )
        for edge_id in current_edges
        if edge_id not in v1_edges
    ]

    removed_edges = [
        EdgeChange(
            id=edge_id,
            source=v1_edges[edge_id].get("source"),
            target=v1_edges[edge_id].get("target"),
        )
        for edge_id in v1_edges
        if edge_id not in current_edges
    ]

    return DiagramDiff(
        added_nodes=added_nodes,
        removed_nodes=removed_nodes,
        modified_nodes=modified_nodes,
        added_edges=added_edges,
        removed_edges=removed_edges,
    )
