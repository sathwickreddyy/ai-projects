import json
import os

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

mcp = FastMCP("arch-platform")


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=BACKEND_URL, timeout=60.0)


@mcp.tool()
async def list_projects() -> str:
    """List all registered projects in the architecture platform."""
    try:
        async with _client() as client:
            resp = await client.get("/api/projects/")
            resp.raise_for_status()
            return json.dumps(resp.json(), indent=2)
    except Exception as e:
        return f"Error listing projects: {e}"


@mcp.tool()
async def scan_project(project_id: str) -> str:
    """Scan a project directory and detect its technology stack."""
    try:
        async with _client() as client:
            resp = await client.post(f"/api/projects/{project_id}/scan")
            resp.raise_for_status()
            data = resp.json()
            detected = [k for k, v in data.get("detected", {}).items() if v]
            return (
                f"Detected stack: {', '.join(detected) or 'none'}\n"
                f"Files scanned: {data.get('files_scanned', 0)}\n"
                f"Files: {', '.join(data.get('file_list', []))}"
            )
    except Exception as e:
        return f"Error scanning project: {e}"


@mcp.tool()
async def generate_architecture(project_id: str, instruction: str = "") -> str:
    """Generate a Claude-powered architecture diagram for a project."""
    try:
        async with _client() as client:
            resp = await client.post(
                f"/api/projects/{project_id}/generate",
                json={"instruction": instruction},
            )
            resp.raise_for_status()
            data = resp.json()
            return json.dumps(
                {
                    "architecture_id": data.get("architecture_id"),
                    "mode": data.get("mode"),
                    "title": data.get("title"),
                    "nodes_count": len(data.get("nodes", [])),
                    "edges_count": len(data.get("edges", [])),
                },
                indent=2,
            )
    except Exception as e:
        return f"Error generating architecture: {e}"


@mcp.tool()
async def get_architecture(architecture_id: str, format: str = "json") -> str:
    """Retrieve a saved architecture. format: json | mermaid | drawio"""
    try:
        async with _client() as client:
            if format in ("mermaid", "drawio"):
                resp = await client.get(
                    f"/api/architectures/{architecture_id}/export/{format}"
                )
            else:
                resp = await client.get(f"/api/architectures/{architecture_id}")
            resp.raise_for_status()
            if format == "json":
                return json.dumps(resp.json(), indent=2)
            return resp.text
    except Exception as e:
        return f"Error retrieving architecture: {e}"


@mcp.tool()
async def apply_preference(architecture_id: str, instruction: str) -> str:
    """Apply a style or layout change to an architecture using Claude."""
    try:
        async with _client() as client:
            resp = await client.post(
                "/api/claude/apply-preference",
                json={"architecture_id": architecture_id, "instruction": instruction},
            )
            resp.raise_for_status()
            data = resp.json()
            return f"Applied: {instruction}\nUpdated architecture: {data.get('architecture_id')}"
    except Exception as e:
        return f"Error applying preference: {e}"


@mcp.tool()
async def list_skills() -> str:
    """List all active architecture skills injected into Claude prompts."""
    try:
        async with _client() as client:
            resp = await client.get("/api/skills/")
            resp.raise_for_status()
            skills = [s for s in resp.json() if s.get("active")]
            if not skills:
                return "No active skills."
            lines = []
            for s in skills:
                triggers = ", ".join(s.get("trigger_pattern") or []) or "always"
                lines.append(f"- {s['name']} (triggers: {triggers})\n  {s['description']}")
            return "\n".join(lines)
    except Exception as e:
        return f"Error listing skills: {e}"


@mcp.tool()
async def approve_skill(
    name: str,
    description: str,
    prompt_snippet: str,
    trigger_pattern: list[str],
) -> str:
    """Save a new reusable skill that improves all future architecture generation."""
    try:
        async with _client() as client:
            resp = await client.post(
                "/api/claude/approve-skill",
                json={
                    "name": name,
                    "description": description,
                    "prompt_snippet": prompt_snippet,
                    "trigger_pattern": trigger_pattern,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return f"Skill approved: {data['name']} (id: {data['id']})"
    except Exception as e:
        return f"Error approving skill: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
