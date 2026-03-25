import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.sessions import router as sessions_router
from app.api.skills import router as skills_router
from app.api.symbols import router as symbols_router
from app.api.auth import router as auth_router
from app.api.diagrams import router as diagrams_router
from app.api.ai import router as ai_router
from app.api.ws import router as ws_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Auth mode: %s", settings.claude_auth_mode)
    logger.info("Model: %s", settings.resolved_model or "latest (CLI)")
    await init_db()
    yield


app = FastAPI(title="arch-viewer", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(skills_router)
app.include_router(symbols_router)
app.include_router(auth_router)
app.include_router(diagrams_router)
app.include_router(ai_router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "auth_mode": settings.claude_auth_mode,
    }
