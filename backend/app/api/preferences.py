from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import UserPreference, get_db

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


class PreferenceUpsert(BaseModel):
    scope: str = "global"
    key: str
    value: Any


@router.get("/")
async def get_preferences(scope: str = "global", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserPreference).where(UserPreference.scope == scope)
    )
    return {row.key: row.value for row in result.scalars().all()}


@router.put("/")
async def upsert_preference(body: PreferenceUpsert, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserPreference).where(
            UserPreference.scope == body.scope,
            UserPreference.key == body.key,
        )
    )
    pref = result.scalar_one_or_none()

    if pref:
        pref.value = body.value
    else:
        pref = UserPreference(scope=body.scope, key=body.key, value=body.value)
        db.add(pref)

    await db.commit()
    await db.refresh(pref)
    return {"scope": pref.scope, "key": pref.key, "value": pref.value}
