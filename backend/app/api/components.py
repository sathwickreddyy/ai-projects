from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import ComponentLibrary, get_db

router = APIRouter(prefix="/api/components", tags=["components"])


@router.get("/")
async def list_components(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ComponentLibrary).order_by(ComponentLibrary.sort_order)
    )
    components = result.scalars().all()

    grouped: dict[str, list] = {}
    for c in components:
        entry = {
            "id": str(c.id),
            "name": c.name,
            "category": c.category,
            "icon": c.icon,
            "color": c.color,
            "border_color": c.border_color,
            "keywords": c.keywords or [],
            "default_props": c.default_props or {},
            "sort_order": c.sort_order,
        }
        grouped.setdefault(c.category, []).append(entry)
    return grouped
