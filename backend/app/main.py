from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import init_db
from app.core.config import settings
from app.api import projects, architectures, components, preferences, skills, claude, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_auth()
    await init_db()
    yield


app = FastAPI(title="arch-platform", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(architectures.router)
app.include_router(components.router)
app.include_router(preferences.router)
app.include_router(skills.router)
app.include_router(claude.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "auth_mode": settings.claude_auth_mode,
        "model": settings.bedrock_model_id
        if settings.claude_auth_mode == "bedrock"
        else "claude-sonnet-4-20250514",
    }
