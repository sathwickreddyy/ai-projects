from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Auth mode — determines which Claude client is used
    claude_auth_mode: Literal["cli", "bedrock", "api"] = "cli"

    # Direct API key — only required when claude_auth_mode=api
    anthropic_api_key: str = ""

    # AWS Bedrock — only required when claude_auth_mode=bedrock
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "anthropic.claude-sonnet-4-5-v1"

    # Postgres
    database_url: str = "postgresql+asyncpg://arch:arch_secret@postgres:5432/arch_platform"
    projects_dir: str = "/projects"

    # App
    secret_key: str = "changeme"
    environment: str = "development"

    class Config:
        env_file = ".env"

    def validate_auth(self):
        """Call this at startup to fail fast with a clear error."""
        if self.claude_auth_mode == "api" and not self.anthropic_api_key:
            raise ValueError("CLAUDE_AUTH_MODE=api requires ANTHROPIC_API_KEY to be set")
        if self.claude_auth_mode == "bedrock" and not self.aws_access_key_id:
            raise ValueError("CLAUDE_AUTH_MODE=bedrock requires AWS_ACCESS_KEY_ID to be set")
        if self.claude_auth_mode == "cli":
            import shutil
            if not shutil.which("claude"):
                raise ValueError(
                    "CLAUDE_AUTH_MODE=cli requires the `claude` CLI to be installed and on PATH. "
                    "Run: npm install -g @anthropic-ai/claude-code"
                )


settings = Settings()
