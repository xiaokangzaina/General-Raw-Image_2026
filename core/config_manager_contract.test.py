from __future__ import annotations

import sys

if sys.path and sys.path[0].replace("\\", "/").endswith("/core"):
    sys.path.pop(0)

import asyncio
import importlib.util
import types
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLUGIN_PARENT = ROOT.parent
PACKAGE = ROOT.name


def load_config_migrator():
    class Logger:
        def info(self, *args, **kwargs): pass
        def warning(self, *args, **kwargs): pass
        def error(self, *args, **kwargs): pass
        def exception(self, *args, **kwargs): pass

    astrbot = types.ModuleType("astrbot")
    api = types.ModuleType("astrbot.api")
    api.logger = Logger()
    core = types.ModuleType("astrbot.core")
    config = types.ModuleType("astrbot.core.config")
    astrbot_config = types.ModuleType("astrbot.core.config.astrbot_config")
    astrbot_config.AstrBotConfig = dict
    sys.modules.update({
        "astrbot": astrbot,
        "astrbot.api": api,
        "astrbot.core": core,
        "astrbot.core.config": config,
        "astrbot.core.config.astrbot_config": astrbot_config,
    })

    package = types.ModuleType(PACKAGE)
    package.__path__ = [str(ROOT)]
    core_package_name = f"{PACKAGE}.core"
    core_package = types.ModuleType(core_package_name)
    core_package.__path__ = [str(ROOT / "core")]
    sys.modules[PACKAGE] = package
    sys.modules[core_package_name] = core_package
    sys.path.insert(0, str(PLUGIN_PARENT))

    module_name = f"{core_package_name}.config_manager"
    spec = importlib.util.spec_from_file_location(
        module_name,
        ROOT / "core" / "config_manager.py",
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module.ConfigMigrator


def load_config_manager():
    load_config_migrator()
    return sys.modules[f"{PACKAGE}.core.config_manager"].ConfigManager


def load_web_controller():
    api_star = types.ModuleType("astrbot.api.star")
    api_star.Context = object
    astrbot_path = types.ModuleType("astrbot.core.utils.astrbot_path")
    astrbot_path.get_astrbot_plugin_data_path = lambda: str(ROOT / "data")
    sys.modules["astrbot.api.star"] = api_star
    sys.modules["astrbot.core.utils"] = types.ModuleType("astrbot.core.utils")
    sys.modules["astrbot.core.utils.astrbot_path"] = astrbot_path

    spec = importlib.util.spec_from_file_location(
        "raw_image_web_contract",
        ROOT / "web.py",
    )
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


def test_template_provider_enabled_survives_schema_normalize():
    ConfigMigrator = load_config_migrator()
    schema = {
        "api_providers": {
            "type": "template_list",
            "templates": {
                "gemini": {
                    "items": {
                        "name": {"type": "string", "default": ""},
                        "available_models": {"type": "list", "default": []},
                    },
                },
            },
        },
    }
    config = {
        "api_providers": [{
            "__template_key": "gemini",
            "name": "Gemini",
            "available_models": ["gemini-image"],
            "enabled": False,
        }],
    }

    ConfigMigrator(schema).migrate(config)

    assert config["api_providers"][0]["enabled"] is False


def test_settings_save_refreshes_live_generator_adapter():
    load_config_migrator()
    web = load_web_controller()

    class FakeRequest:
        async def get_json(self, **_kwargs):
            return {"config": {"generation": {}, "api_providers": []}}

    class FakeConfig(dict):
        def save_config(self, **_kwargs): pass

    class FakeManager:
        adapter_config = "old"

        def reload(self):
            self.adapter_config = "Ruoli"

    class FakeGenerator:
        updated = None

        async def update_adapter(self, adapter_config):
            self.updated = adapter_config

    class FakePlugin:
        config = FakeConfig({"generation": {}, "api_providers": []})
        config_manager = FakeManager()
        generator = FakeGenerator()

    web.quart_request_obj = FakeRequest()
    web.quart_jsonify = lambda payload: payload
    plugin = FakePlugin()

    asyncio.run(web.RawImageWebController(None, plugin).page_save_config())

    assert plugin.generator.updated == "Ruoli"


def test_disabled_selected_provider_falls_back_to_next_enabled():
    ConfigManager = load_config_manager()

    class FakeConfig(dict):
        def save_config(self): pass

    manager = ConfigManager(FakeConfig({
        "generation": {"model": "pk/gpt-image-2"},
        "api_providers": [
            {
                "__template_key": "openai",
                "name": "pk",
                "available_models": ["gpt-image-2"],
                "enabled": False,
            },
            {
                "__template_key": "openai",
                "name": "Ruoli",
                "available_models": ["gpt-image-2"],
                "enabled": True,
            },
        ],
    }))

    assert manager.adapter_config.name == "Ruoli"
    assert manager.adapter_config.model == "gpt-image-2"
    assert manager.adapter_config.available_models == ["Ruoli/gpt-image-2"]


def test_bare_model_with_disabled_first_provider_uses_next_enabled():
    ConfigManager = load_config_manager()

    class FakeConfig(dict):
        def save_config(self): pass

    manager = ConfigManager(FakeConfig({
        "generation": {"model": "gpt-image-2"},
        "api_providers": [
            {
                "__template_key": "openai",
                "name": "pk",
                "available_models": ["gpt-image-2"],
                "enabled": False,
            },
            {
                "__template_key": "openai",
                "name": "Ruoli",
                "available_models": ["gpt-image-2"],
                "enabled": True,
            },
        ],
    }))

    assert manager.adapter_config.name == "Ruoli"
    assert manager.adapter_config.model == "gpt-image-2"


def test_generation_entry_refreshes_stale_runtime_adapter():
    source = (ROOT / "main.py").read_text(encoding="utf-8")
    method = source.split("async def _generate_and_send_image_async", 1)[1]
    guard = method.split("if not task_id:", 1)[0]

    assert "adapter_config = self.config_manager.adapter_config" in guard
    assert "self.generator.adapter_config != adapter_config" in guard
    assert "await self.generator.update_adapter(adapter_config)" in guard


if __name__ == "__main__":
    test_template_provider_enabled_survives_schema_normalize()
    test_settings_save_refreshes_live_generator_adapter()
    test_disabled_selected_provider_falls_back_to_next_enabled()
    test_bare_model_with_disabled_first_provider_uses_next_enabled()
    test_generation_entry_refreshes_stale_runtime_adapter()
    print("config manager contract passed")
