import asyncio
import json
from typing import AsyncIterator, Optional
from app.core.config import settings

REVIEW_SYSTEM = """You are a senior systems architect reviewing an architecture diagram.
Return JSON only. No markdown. No explanation outside JSON.
{
  "score": 1-10,
  "summary": "one paragraph overall assessment",
  "issues": [{"severity":"critical|warning|suggestion","component":"node_id","message":"","fix":""}],
  "missing_components": [{"name":"","reason":"","type":"","symbol_type":""}],
  "follow_up_questions": [{"question":"","options":["a","b","c"]}],
  "suggested_adaptations": [{"decision":"","reason":""}]
}"""

ADAPTATION_SYSTEM = """You are analyzing architecture modifications to extract learned decisions.
Return JSON only. No markdown.
{
  "decisions": ["decision 1", "decision 2"],
  "patterns": ["pattern 1"],
  "symbol_overrides": ["override 1"]
}"""

IMPACT_SYSTEM = """You are predicting how a skill adaptation will affect future architecture generations.
Return JSON only. No markdown.
{
  "impacts": ["impact 1", "impact 2"],
  "affected_keywords": ["keyword1", "keyword2"]
}"""


class AIEngine:
    def __init__(self):
        self._mode = settings.claude_auth_mode

    # ── Prompt builders ──────────────────────────────────────

    def _build_review_prompt(self, diagram: dict, context: dict) -> str:
        stack = ", ".join(context.get("detected_stack", []))
        return (
            f"Review this architecture.\n"
            f"Detected stack: {stack}\n\n"
            f"Architecture:\n```json\n{json.dumps(diagram, indent=2)}\n```"
        )

    def _build_followup_prompt(self, diagram: dict, context: dict, qa_history: list) -> str:
        qa_text = "\n".join(f"Q: {qa['q']}\nA: {qa['a']}" for qa in qa_history)
        return (
            f"Update your review based on these answers:\n\n{qa_text}\n\n"
            f"Architecture:\n```json\n{json.dumps(diagram, indent=2)}\n```"
        )

    def _build_adaptation_prompt(self, diagram_v1: dict, diagram_v2: dict, context: dict) -> str:
        return (
            f"Compare these two architecture versions and extract the key decisions "
            f"the user made when modifying the original.\n\n"
            f"Original:\n```json\n{json.dumps(diagram_v1, indent=2)}\n```\n\n"
            f"Modified:\n```json\n{json.dumps(diagram_v2, indent=2)}\n```"
        )

    def _build_impact_prompt(self, adaptation: dict, skill_tree: dict) -> str:
        return (
            f"Given this proposed skill adaptation:\n"
            f"```json\n{json.dumps(adaptation, indent=2)}\n```\n\n"
            f"And the current skill tree:\n"
            f"```json\n{json.dumps(skill_tree, indent=2)}\n```\n\n"
            f"Predict what changes future architecture generations would see."
        )

    # ── Drivers ──────────────────────────────────────────────

    async def _cli_stream(self, system: str, user_msg: str) -> AsyncIterator[str]:
        cmd = ["claude", "--print", "--stream", "--system-prompt", system]
        model = settings.resolved_model
        if model:
            cmd.extend(["--model", model])
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        assert proc.stdin is not None
        proc.stdin.write(user_msg.encode())
        await proc.stdin.drain()
        proc.stdin.close()
        assert proc.stdout is not None
        while True:
            chunk = await proc.stdout.read(256)
            if not chunk:
                break
            yield chunk.decode(errors="replace")
        await proc.wait()

    async def _api_stream(self, system: str, user_msg: str) -> AsyncIterator[str]:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        kwargs = {
            "max_tokens": 4096,
            "system": system,
            "messages": [{"role": "user", "content": user_msg}],
        }
        model = settings.resolved_model
        if model:
            kwargs["model"] = model
        async with client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

    async def _stream(self, system: str, user_msg: str) -> AsyncIterator[str]:
        streamer = self._cli_stream if self._mode == "cli" else self._api_stream
        async for chunk in streamer(system, user_msg):
            yield chunk

    async def _complete(self, system: str, user_msg: str) -> dict:
        chunks = []
        async for chunk in self._stream(system, user_msg):
            chunks.append(chunk)
        raw = "".join(chunks)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)

    # ── Public interface ─────────────────────────────────────

    async def stream_review(self, diagram: dict, context: dict) -> AsyncIterator[str]:
        user_msg = self._build_review_prompt(diagram, context)
        async for chunk in self._stream(REVIEW_SYSTEM, user_msg):
            yield chunk

    async def review(self, diagram: dict, context: dict) -> dict:
        user_msg = self._build_review_prompt(diagram, context)
        return await self._complete(REVIEW_SYSTEM, user_msg)

    async def answer_followup(self, diagram: dict, context: dict, qa_history: list) -> dict:
        user_msg = self._build_followup_prompt(diagram, context, qa_history)
        return await self._complete(REVIEW_SYSTEM, user_msg)

    async def generate_adaptation(self, diagram_v1: dict, diagram_v2: dict, context: dict) -> dict:
        user_msg = self._build_adaptation_prompt(diagram_v1, diagram_v2, context)
        return await self._complete(ADAPTATION_SYSTEM, user_msg)

    async def preview_impact(self, adaptation: dict, skill_tree: dict) -> dict:
        user_msg = self._build_impact_prompt(adaptation, skill_tree)
        return await self._complete(IMPACT_SYSTEM, user_msg)
