import pytest
from app.services.ai_engine import AIEngine

def test_build_review_prompt():
    engine = AIEngine.__new__(AIEngine)
    engine._mode = "cli"
    prompt = engine._build_review_prompt(
        diagram={"nodes": [{"id": "n1", "name": "API"}], "edges": []},
        context={"detected_stack": ["fastapi"]},
    )
    assert "architecture" in prompt.lower() or "review" in prompt.lower()
    assert "n1" in prompt
    assert "fastapi" in prompt

def test_build_followup_prompt_includes_qa_history():
    engine = AIEngine.__new__(AIEngine)
    engine._mode = "cli"
    prompt = engine._build_followup_prompt(
        diagram={"nodes": [], "edges": []},
        context={},
        qa_history=[{"q": "Expected msgs/sec?", "a": "<100/sec"}],
    )
    assert "Expected msgs/sec?" in prompt
    assert "<100/sec" in prompt

def test_build_adaptation_prompt():
    engine = AIEngine.__new__(AIEngine)
    engine._mode = "cli"
    prompt = engine._build_adaptation_prompt(
        diagram_v1={"nodes": [{"id": "n1"}]},
        diagram_v2={"nodes": [{"id": "n1"}, {"id": "n2"}]},
        context={"detected_stack": ["kafka"]},
    )
    assert "n1" in prompt
    assert "n2" in prompt

def test_build_impact_prompt():
    engine = AIEngine.__new__(AIEngine)
    engine._mode = "cli"
    prompt = engine._build_impact_prompt(
        adaptation={"decisions": ["Always add DLQ"]},
        skill_tree={"name": "test-skill", "subskills": []},
    )
    assert "DLQ" in prompt
    assert "test-skill" in prompt
