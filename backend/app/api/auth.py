import shutil
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/status")
async def auth_status():
    cli_available = shutil.which("claude") is not None
    return {
        "mode": settings.claude_auth_mode,
        "cli_available": cli_available,
        "has_api_key": bool(settings.anthropic_api_key),
    }


@router.post("/configure")
async def configure_auth(body: dict):
    # In v1, auth is set via .env, not runtime configurable
    # This endpoint exists for the frontend to know what's available
    return {"status": "ok", "note": "Auth is configured via .env file"}
