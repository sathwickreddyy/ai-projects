from fastapi import APIRouter
from app.services.symbol_registry import SymbolRegistry
from app.core.config import settings

router = APIRouter(prefix="/api/symbols", tags=["symbols"])


def _get_registry() -> SymbolRegistry:
    import os
    path = os.path.join(settings.skills_dir, "intelligent-arch-creator", "symbols.yaml")
    if not os.path.isabs(path):
        # Resolve relative to project root (parent of backend/)
        here = os.path.dirname(os.path.abspath(__file__))  # backend/app/api/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(here)))  # up 3 levels
        path = os.path.join(project_root, path)
    return SymbolRegistry(path)


@router.get("/")
async def get_symbols():
    reg = _get_registry()
    return {"symbols": reg.get_all_symbols(), "meta": reg.get_meta()}


@router.get("/palette")
async def get_palette():
    reg = _get_registry()
    return reg.get_palette_items()
