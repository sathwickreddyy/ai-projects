import pytest
from app.services.symbol_registry import SymbolRegistry

@pytest.fixture
def registry():
    return SymbolRegistry("../skills/intelligent-arch-creator/symbols.yaml")

def test_loads_symbols(registry):
    symbols = registry.get_all_symbols()
    assert "kafka_broker" in symbols
    assert "api_service" in symbols
    assert len(symbols) >= 10

def test_symbol_has_required_fields(registry):
    kafka = registry.get_symbol("kafka_broker")
    assert kafka["category"] == "messaging"
    assert kafka["shape"] == "container_box"
    assert "props_schema" in kafka

def test_get_palette_items(registry):
    items = registry.get_palette_items()
    categories = {item["category"] for item in items}
    assert "messaging" in categories
    assert "database" in categories

def test_get_meta(registry):
    meta = registry.get_meta()
    assert "shapes" in meta
    assert "internal_elements" in meta
    assert "ports" in meta

def test_get_compact_type_list(registry):
    compact = registry.get_compact_type_list()
    assert "kafka_broker" in compact
    assert "api_service" in compact

def test_get_nonexistent_symbol(registry):
    result = registry.get_symbol("does_not_exist")
    assert result is None
