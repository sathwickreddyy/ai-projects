import pytest
from pathlib import Path
from app.services.skill_manager import SkillManager

@pytest.fixture
def skill_dir(tmp_path):
    # Minimal skill structure
    (tmp_path / "skill.md").write_text("---\nname: test-skill\n---\n# Test")
    (tmp_path / "keywords.yaml").write_text(
        "mappings:\n  - subskill: test-sub\n    match_any:\n      - [kafka, order]\n"
    )
    sub_dir = tmp_path / "subskills"
    sub_dir.mkdir()
    (sub_dir / "test-sub.md").write_text(
        "---\nname: test-sub\nversion: 1\nlearned_from: 1\n---\n## Decisions\n- Always use DLQ\n"
    )
    return tmp_path

def test_read_skill_tree(skill_dir):
    mgr = SkillManager(str(skill_dir))
    tree = mgr.read_skill_tree()
    assert tree["name"] == "test-skill"
    assert len(tree["subskills"]) == 1
    assert tree["subskills"][0]["name"] == "test-sub"

def test_read_keywords(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mappings = mgr.read_keywords()
    assert len(mappings) == 1
    assert mappings[0]["subskill"] == "test-sub"

def test_save_adaptation_creates_new_subskill(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mgr.save_adaptation(
        target_subskill="new-sub",
        decisions=["Use circuit breaker"],
        keywords=["circuit", "resilience"],
    )
    new_file = skill_dir / "subskills" / "new-sub.md"
    assert new_file.exists()
    content = new_file.read_text()
    assert "Use circuit breaker" in content

def test_save_adaptation_updates_existing_subskill(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mgr.save_adaptation(
        target_subskill="test-sub",
        decisions=["Add read replica"],
        keywords=["kafka", "order"],
    )
    content = (skill_dir / "subskills" / "test-sub.md").read_text()
    assert "Add read replica" in content
    assert "version: 2" in content

def test_save_adaptation_updates_keywords_yaml(skill_dir):
    mgr = SkillManager(str(skill_dir))
    mgr.save_adaptation(
        target_subskill="new-sub",
        decisions=["Test decision"],
        keywords=["circuit", "resilience"],
    )
    import yaml
    data = yaml.safe_load((skill_dir / "keywords.yaml").read_text())
    subskill_names = [m["subskill"] for m in data["mappings"]]
    assert "new-sub" in subskill_names

def test_read_skill_tree_version_and_learned_from(skill_dir):
    mgr = SkillManager(str(skill_dir))
    tree = mgr.read_skill_tree()
    sub = tree["subskills"][0]
    assert sub["version"] == 1
    assert sub["learned_from"] == 1
