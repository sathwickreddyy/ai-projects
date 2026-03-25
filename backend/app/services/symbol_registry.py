from pathlib import Path
from typing import Optional
import yaml


class SymbolRegistry:
    def __init__(self, yaml_path: str):
        self._path = Path(yaml_path)
        self._data = {}
        self._load()

    def _load(self):
        if self._path.exists():
            with open(self._path) as f:
                self._data = yaml.safe_load(f) or {}

    def reload(self):
        self._load()

    def get_meta(self) -> dict:
        return self._data.get("meta", {})

    def get_all_symbols(self) -> dict:
        return self._data.get("symbols", {})

    def get_symbol(self, symbol_type: str) -> Optional[dict]:
        return self._data.get("symbols", {}).get(symbol_type)

    def get_palette_items(self) -> list[dict]:
        items = []
        palette = self.get_meta().get("color_palette", {})
        for name, defn in self.get_all_symbols().items():
            category = defn.get("category", "other")
            colors = palette.get(category, {})
            items.append({
                "symbol_type": name,
                "label": defn.get("label", name),
                "category": category,
                "shape": defn.get("shape", "rounded_rect"),
                "keywords": defn.get("keywords", []),
                "color": colors.get("primary", "#6b7280"),
                "border_color": colors.get("border", "#9ca3af"),
                "props_schema": defn.get("props_schema", {}),
            })
        return items

    def get_compact_type_list(self) -> str:
        """Compact summary for Claude prompts — saves tokens."""
        lines = []
        for name, defn in self.get_all_symbols().items():
            props = list(defn.get("props_schema", {}).keys())
            lines.append(f"- {name} ({defn.get('label', name)}): props={props}")
        return "\n".join(lines)
