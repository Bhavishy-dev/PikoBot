import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    BOT_TOKEN: str = Field(..., description="Telegram Bot Token from BotFather")
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./pikobot.db",
        description="Async database connection string"
    )
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    MINI_APP_URL: str = Field(default="https://pikobot-app.pages.dev", description="Cloudflare Pages Mini App URL")
    BOT_USERNAME: str = Field(default="Piko_Officialbot", description="Telegram Bot Username")
    MINI_APP_SHORT_NAME: str = Field(default="app", description="BotFather Web App Short Name")
    
    # Game Economy Defaults
    STARTING_GOLD: int = 1000
    STARTING_DIAMONDS: int = 25
    DAILY_GOLD_REWARD: int = 500
    DAILY_DIAMOND_REWARD: int = 5
    
    # Battle & Base Defaults
    ATTACK_COOLDOWN_MINUTES: int = 15
    DEFAULT_SHIELD_HOURS: int = 12
    SHIELD_COST_DIAMONDS: int = 10
    VIP_MEMBERSHIP_DAYS: int = 30
    VIP_COST_DIAMONDS: int = 50
    VIP_COST_GOLD: int = 50000

    @field_validator("DATABASE_URL", mode="before")
    def fix_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            # Render PostgreSQL URLs start with postgres:// or postgresql://
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
