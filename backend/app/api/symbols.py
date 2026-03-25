from fastapi import APIRouter
from app.services.symbol_registry import SymbolRegistry
from app.core.config import settings

router = APIRouter(prefix="/api/symbols", tags=["symbols"])


def _get_registry() -> SymbolRegistry:
    return SymbolRegistry(settings.skills_dir + "/intelligent-arch-creator/symbols.yaml")


@router.get("/")
async def get_symbols():
    reg = _get_registry()
    return {"symbols": reg.get_all_symbols(), "meta": reg.get_meta()}


@router.get("/palette")
async def get_palette():
    reg = _get_registry()
    return reg.get_palette_items()
