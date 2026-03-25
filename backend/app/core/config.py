from typing import Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    claude_auth_mode: Literal["cli", "api"] = "cli"
    anthropic_api_key: str = ""
    claude_model: str = ""  # empty = latest for CLI, SDK default for API
    database_path: str = "./data/arch_viewer.db"
    skills_dir: str = "./skills"

    def validate_auth(self):
        if self.claude_auth_mode == "api" and not self.anthropic_api_key:
            raise ValueError("CLAUDE_AUTH_MODE=api requires ANTHROPIC_API_KEY")
        if self.claude_auth_mode == "cli":
            import shutil
            if not shutil.which("claude"):
                raise ValueError("CLAUDE_AUTH_MODE=cli requires claude CLI on PATH")

    @property
    def resolved_model(self) -> Optional[str]:
        """Return model for API mode. None for CLI (uses latest)."""
        if self.claude_auth_mode == "cli":
            return None
        return self.claude_model or None  # SDK picks default if None


settings = Settings()
