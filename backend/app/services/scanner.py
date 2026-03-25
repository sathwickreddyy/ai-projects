import os
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import Project

RELEVANT_FILES = {
    "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
    "requirements.txt", "pyproject.toml", "package.json",
    "go.mod", "README.md", ".env.example",
}
RELEVANT_EXTENSIONS = {".py", ".ts", ".go", ".yaml", ".yml", ".toml", ".json"}
SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv", "dist", "build", ".next"}
MAX_FILE_SIZE = 50000
MAX_FILES = 40
MAX_CONTEXT = 120000


def walk_project(path: str) -> list[dict]:
    result = []
    base = Path(path)

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        rel_root = Path(root).relative_to(base)
        depth = len(rel_root.parts)

        for fname in files:
            fpath = Path(root) / fname
            score = 0
            if fname in RELEVANT_FILES:
                score += 10
            elif fpath.suffix in RELEVANT_EXTENSIONS:
                score += 5
            else:
                continue
            if depth == 0:
                score += 3
            result.append({
                "path": str(fpath),
                "rel_path": str(rel_root / fname),
                "priority": score,
            })

    result.sort(key=lambda x: x["priority"], reverse=True)
    return result[:MAX_FILES]


async def read_file_safe(path: str) -> Optional[str]:
    try:
        size = os.path.getsize(path)
        if size > MAX_FILE_SIZE:
            return None
        async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
            return await f.read()
    except Exception as e:
        return f"[error reading file: {e}]"


def detect_stack(text: str) -> dict[str, bool]:
    t = text.lower()
    checks = {
        "fastapi":       ["fastapi", "uvicorn", "@app.get", "@app.post"],
        "kafka":         ["kafka", "confluent", "aiokafka", "topic"],
        "redis":         ["redis", "aioredis", "redisearch"],
        "postgres":      ["postgres", "asyncpg", "sqlalchemy", "alembic"],
        "mongodb":       ["mongo", "pymongo", "beanie", "motor"],
        "rabbitmq":      ["rabbitmq", "amqp", "pika"],
        "celery":        ["celery", "@task", "beat"],
        "docker":        ["dockerfile", "docker-compose", "image:"],
        "nginx":         ["nginx", "proxy_pass"],
        "kubernetes":    ["kubernetes", "k8s", "helm"],
        "graphql":       ["graphql", "strawberry", "ariadne"],
        "grpc":          ["grpc", "protobuf", ".proto"],
        "websocket":     ["websocket", "ws://", "socket.io"],
        "sqs":           ["sqs", "boto3", "aws_sqs"],
        "elasticsearch": ["elasticsearch", "opensearch"],
    }
    return {tech: any(kw in t for kw in kws) for tech, kws in checks.items()}


async def build_project_context(path: str) -> dict:
    files_meta = walk_project(path)
    files: dict[str, str] = {}
    total_chars = 0
    all_text_parts: list[str] = []

    for meta in files_meta:
        content = await read_file_safe(meta["path"])
        if content is None:
            files[meta["rel_path"]] = "[file too large, skipped]"
            continue
        if total_chars + len(content) > MAX_CONTEXT:
            files[meta["rel_path"]] = "[truncated: context limit reached]"
            continue
        files[meta["rel_path"]] = content
        total_chars += len(content)
        all_text_parts.append(content)

    combined = "\n".join(all_text_parts)
    detected = detect_stack(combined)

    return {
        "files": files,
        "detected": detected,
        "total_files_scanned": len(files_meta),
        "total_chars": total_chars,
    }


async def scan_and_save(project_id: str, path: str, db: AsyncSession) -> dict:
    context = await build_project_context(path)

    file_index = {
        rel_path: os.path.getmtime(
            str(Path(path) / rel_path)
        )
        for rel_path in context["files"]
        if not context["files"][rel_path].startswith("[")
    }

    await db.execute(
        update(Project)
        .where(Project.id == project_id)
        .values(
            last_scanned=datetime.now(timezone.utc),
            file_index=file_index,
            metadata_={
                "detected": context["detected"],
                "file_count": context["total_files_scanned"],
                "stale": False,
            },
        )
    )
    await db.commit()
    return context
