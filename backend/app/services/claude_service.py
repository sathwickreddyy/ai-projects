"""
Claude service — dual/triple auth mode.

CLAUDE_AUTH_MODE controls which driver is used:
  cli     -> subprocess call to `claude` CLI (Pro/Max subscription)
  bedrock -> AWS Bedrock boto3 client
  api     -> direct Anthropic SDK (ANTHROPIC_API_KEY)

All three drivers expose the same interface so callers never need to know
which mode is active.
"""

import asyncio
import json
import queue
import threading
from typing import AsyncIterator, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import Skill, UserPreference

# ─── Model IDs ────────────────────────────────────────────────────────────────

API_MODEL = "claude-sonnet-4-20250514"
BEDROCK_MODEL = settings.bedrock_model_id

# ─── System prompts ───────────────────────────────────────────────────────────

ARCH_SYSTEM_BASE = """You are an expert system design architect embedded in an architecture visualization platform.
Analyze project files and produce a structured architecture diagram as JSON only.
No markdown. No explanation outside JSON.

Mode selection rules:
- animated_flow: request-response cycles, Kafka pipelines, WebSocket flows
- step_by_step:  sequential processes, algorithms, deployment flows (3-8 steps)
- stage_diagram: layered microservices, infra stacks — best default for most projects
- mental_map:    conceptual overviews, first-look summaries

Layout rules:
- x, y are 0.0-1.0 fractions of canvas space. Spread nodes well. Never overlap.
- layer: 0=top (client/user-facing), increasing numbers = deeper (infra/DB)
- Label every edge with protocol and direction (e.g. "HTTP POST ->", "Kafka ->", "SQL <-")
- component_name must exactly match a name in the component library when applicable
- Always include exactly 3 insights
"""

REVIEW_SYSTEM = """You are a senior systems architect reviewing an architecture diagram.
Return JSON only. No markdown. No explanation outside JSON.
{
  "score": 1-10,
  "summary": "one paragraph overall assessment",
  "issues": [{"severity":"critical|warning|suggestion","component":"node_id","message":"","fix":""}],
  "missing_components": [{"name":"","reason":"","type":"queue|database|api|infrastructure"}],
  "approved_changes": [{"type":"add_node|remove_node|add_edge|change_label","payload":{}}],
  "new_skill_suggestion": {"name":"","description":"","prompt_snippet":"","trigger_pattern":[]}
}"""

# ─── DB helpers ───────────────────────────────────────────────────────────────


async def load_active_skills(
    db: AsyncSession, detected_stack: Optional[list[str]] = None
) -> str:
    result = await db.execute(select(Skill).where(Skill.active == True))  # noqa: E712
    skills = result.scalars().all()
    injected = []
    for skill in skills:
        if not skill.trigger_pattern or not detected_stack:
            injected.append(skill.prompt_snippet)
        elif any(kw in detected_stack for kw in skill.trigger_pattern):
            injected.append(skill.prompt_snippet)
    if not injected:
        return ""
    return "\n\n## Active Architecture Skills (always follow these)\n" + "\n".join(
        f"- {s}" for s in injected
    )


async def load_preferences(
    db: AsyncSession, project_id: Optional[str] = None
) -> dict:
    prefs: dict = {}
    scopes = ["global"]
    if project_id:
        scopes.append(str(project_id))
    for scope in scopes:
        result = await db.execute(
            select(UserPreference).where(UserPreference.scope == scope)
        )
        for p in result.scalars().all():
            prefs[p.key] = p.value
    return prefs


def _clean_json(raw: str) -> dict:
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


# ─── Driver: CLI subprocess ───────────────────────────────────────────────────


async def _cli_complete(system: str, user_message: str) -> str:
    cmd = [
        "claude",
        "--print",
        "--system-prompt", system,
        "--model", API_MODEL,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate(input=user_message.encode())
    if proc.returncode != 0:
        raise RuntimeError(
            f"claude CLI failed (exit {proc.returncode}): {stderr.decode()[:500]}"
        )
    return stdout.decode()


async def _cli_stream(system: str, user_message: str) -> AsyncIterator[str]:
    cmd = [
        "claude",
        "--print",
        "--stream",
        "--system-prompt", system,
        "--model", API_MODEL,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    assert proc.stdin is not None
    proc.stdin.write(user_message.encode())
    await proc.stdin.drain()
    proc.stdin.close()

    assert proc.stdout is not None
    while True:
        chunk = await proc.stdout.read(256)
        if not chunk:
            break
        yield chunk.decode(errors="replace")

    await proc.wait()


# ─── Driver: AWS Bedrock ──────────────────────────────────────────────────────


def _get_bedrock_client():
    import boto3  # type: ignore[import]
    return boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


async def _bedrock_complete(system: str, user_message: str) -> str:
    def _call() -> str:
        client = _get_bedrock_client()
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": system,
            "messages": [{"role": "user", "content": user_message}],
        })
        response = client.invoke_model(
            modelId=BEDROCK_MODEL,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]  # type: ignore[no-any-return]

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _call)


async def _bedrock_stream(system: str, user_message: str) -> AsyncIterator[str]:
    q: queue.Queue[Optional[str]] = queue.Queue()

    def _call() -> None:
        client = _get_bedrock_client()
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "system": system,
            "messages": [{"role": "user", "content": user_message}],
        })
        response = client.invoke_model_with_response_stream(
            modelId=BEDROCK_MODEL,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        for event in response["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            if chunk.get("type") == "content_block_delta":
                q.put(chunk["delta"].get("text", ""))
        q.put(None)

    thread = threading.Thread(target=_call, daemon=True)
    thread.start()

    loop = asyncio.get_event_loop()
    while True:
        text = await loop.run_in_executor(None, q.get)
        if text is None:
            break
        yield text


# ─── Driver: Direct Anthropic API ────────────────────────────────────────────


def _get_api_client():
    import anthropic  # type: ignore[import]
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def _api_complete(system: str, user_message: str) -> str:
    client = _get_api_client()
    response = await client.messages.create(
        model=API_MODEL,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text  # type: ignore[union-attr]


async def _api_stream(system: str, user_message: str) -> AsyncIterator[str]:
    client = _get_api_client()
    async with client.messages.stream(
        model=API_MODEL,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ─── Unified router ──────────────────────────────────────────────────────────


async def _complete(system: str, user_message: str) -> str:
    mode = settings.claude_auth_mode
    if mode == "cli":
        return await _cli_complete(system, user_message)
    elif mode == "bedrock":
        return await _bedrock_complete(system, user_message)
    else:
        return await _api_complete(system, user_message)


async def _stream(system: str, user_message: str) -> AsyncIterator[str]:
    mode = settings.claude_auth_mode
    if mode == "cli":
        async for chunk in _cli_stream(system, user_message):
            yield chunk
    elif mode == "bedrock":
        async for chunk in _bedrock_stream(system, user_message):
            yield chunk
    else:
        async for chunk in _api_stream(system, user_message):
            yield chunk


# ─── Public interface (unchanged signatures) ─────────────────────────────────


async def generate_architecture(
    db: AsyncSession,
    project_context: dict,
    project_id: Optional[str] = None,
    extra_instruction: Optional[str] = None,
) -> dict:
    detected = [k for k, v in project_context.get("detected", {}).items() if v]
    skills_text = await load_active_skills(db, detected)
    prefs = await load_preferences(db, project_id)

    system = ARCH_SYSTEM_BASE + skills_text

    files_summary = "\n\n".join(
        f"### {rel}\n```\n{content[:3000]}\n```"
        for rel, content in list(project_context.get("files", {}).items())[:20]
    )
    pref_text = f"\n\nUser preferences: {json.dumps(prefs)}" if prefs else ""
    extra_text = f"\n\nAdditional instruction: {extra_instruction}" if extra_instruction else ""

    user_message = (
        f"Analyze this project and generate an architecture diagram.\n\n"
        f"Detected stack: {', '.join(detected) or 'unknown'}"
        f"{pref_text}{extra_text}\n\n"
        f"## Project Files\n{files_summary}"
    )

    raw = await _complete(system, user_message)
    return _clean_json(raw)


async def stream_review(
    db: AsyncSession,
    architecture: dict,
    question: Optional[str] = None,
) -> AsyncIterator[str]:
    arch_json = json.dumps(architecture, indent=2)
    prompt = question or "Please review this architecture and provide detailed feedback."
    user_message = f"{prompt}\n\nArchitecture:\n```json\n{arch_json}\n```"

    async for chunk in _stream(REVIEW_SYSTEM, user_message):
        yield chunk


async def apply_preference_change(
    db: AsyncSession,
    architecture: dict,
    preference_instruction: str,
) -> dict:
    detected = [n.get("component_name", "").lower() for n in architecture.get("nodes", [])]
    skills_text = await load_active_skills(db, detected)
    system = ARCH_SYSTEM_BASE + skills_text

    user_message = (
        f"Update this architecture based on the user's preference change.\n"
        f"Preference change: {preference_instruction}\n\n"
        f"Return the full updated architecture JSON.\n\n"
        f"Current architecture:\n{json.dumps(architecture, indent=2)}"
    )

    raw = await _complete(system, user_message)
    return _clean_json(raw)
