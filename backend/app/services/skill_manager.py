import re
from datetime import date
from pathlib import Path
from typing import Optional
import yaml


class SkillManager:
    def __init__(self, skill_dir: str):
        """skill_dir resolved from context envelope's skill_path, falling back to settings.skills_dir."""
        self._dir = Path(skill_dir)

    def read_skill_tree(self) -> dict:
        skill_md = self._dir / "skill.md"
        name = "unknown"
        if skill_md.exists():
            content = skill_md.read_text()
            match = re.search(r"name:\s*(.+)", content)
            if match:
                name = match.group(1).strip()

        subskills = []
        sub_dir = self._dir / "subskills"
        if sub_dir.is_dir():
            for f in sorted(sub_dir.glob("*.md")):
                content = f.read_text()
                sub_name = f.stem
                version = 1
                learned_from = 0
                match_name = re.search(r"name:\s*(.+)", content)
                if match_name:
                    sub_name = match_name.group(1).strip()
                match_ver = re.search(r"version:\s*(\d+)", content)
                if match_ver:
                    version = int(match_ver.group(1))
                match_learned = re.search(r"learned_from:\s*(\d+)", content)
                if match_learned:
                    learned_from = int(match_learned.group(1))

                subskills.append({
                    "name": sub_name,
                    "file": f.name,
                    "version": version,
                    "learned_from": learned_from,
                    "content": content,
                })

        keywords = self.read_keywords()
        return {
            "name": name,
            "subskills": subskills,
            "keywords": keywords,
        }

    def read_keywords(self) -> list[dict]:
        kw_file = self._dir / "keywords.yaml"
        if not kw_file.exists():
            return []
        data = yaml.safe_load(kw_file.read_text()) or {}
        return data.get("mappings", [])

    def save_adaptation(
        self,
        target_subskill: str,
        decisions: list[str],
        keywords: list[str],
    ) -> str:
        sub_dir = self._dir / "subskills"
        sub_dir.mkdir(exist_ok=True)
        sub_file = sub_dir / f"{target_subskill}.md"

        if sub_file.exists():
            content = sub_file.read_text()
            # Append decisions
            for d in decisions:
                if d not in content:
                    content += f"\n- {d}"
            # Bump version
            content = re.sub(
                r"version:\s*(\d+)",
                lambda m: f"version: {int(m.group(1)) + 1}",
                content,
            )
            sub_file.write_text(content)
        else:
            decisions_text = "\n".join(f"- {d}" for d in decisions)
            content = (
                f"---\nname: {target_subskill}\n"
                f"version: 1\nlearned_from: 1\n"
                f"last_updated: {date.today().isoformat()}\n---\n\n"
                f"## Decisions\n{decisions_text}\n"
            )
            sub_file.write_text(content)

        # Update keywords.yaml
        self._add_keywords(target_subskill, keywords)
        return str(sub_file)

    def _add_keywords(self, subskill: str, keywords: list[str]):
        if not keywords:
            return
        kw_file = self._dir / "keywords.yaml"
        data = {"mappings": []}
        if kw_file.exists():
            data = yaml.safe_load(kw_file.read_text()) or {"mappings": []}

        # Check if mapping exists for this subskill
        for mapping in data["mappings"]:
            if mapping["subskill"] == subskill:
                if keywords not in mapping["match_any"]:
                    mapping["match_any"].append(keywords)
                kw_file.write_text(yaml.dump(data, default_flow_style=False))
                return

        data["mappings"].append({
            "subskill": subskill,
            "match_any": [keywords],
        })
        kw_file.write_text(yaml.dump(data, default_flow_style=False))
