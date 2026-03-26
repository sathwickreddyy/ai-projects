from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://arch:dev@localhost:5432/arch_viewer"

    model_config = {"env_prefix": ""}


settings = Settings()
