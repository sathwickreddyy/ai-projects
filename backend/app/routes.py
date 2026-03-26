from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.db import Session, async_session

router = APIRouter(prefix="/api")


class CreateSessionRequest(BaseModel):
    title: str = "Untitled"
    data: dict
    detected_stack: list[str] = []


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    data: dict | None = None


class SessionResponse(BaseModel):
    id: UUID
    title: str
    data: dict
    detected_stack: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create_session(req: CreateSessionRequest):
    async with async_session() as db:
        session = Session(
            title=req.title,
            data=req.data,
            detected_stack=req.detected_stack,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions():
    async with async_session() as db:
        result = await db.execute(
            select(Session).order_by(Session.created_at.desc())
        )
        return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: UUID):
    async with async_session() as db:
        session = await db.get(Session, session_id)
        if not session:
            raise HTTPException(404, "Session not found")
        return session


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: UUID, req: UpdateSessionRequest):
    async with async_session() as db:
        session = await db.get(Session, session_id)
        if not session:
            raise HTTPException(404, "Session not found")
        if req.title is not None:
            session.title = req.title
        if req.data is not None:
            session.data = req.data
        session.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)
        return session
