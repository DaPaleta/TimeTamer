from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, List, Union
import os


class Settings(BaseSettings):
    # Application
    app_name: str = Field("Task Planner API", validation_alias="APP_NAME")
    app_version: str = Field("0.1.0", validation_alias="APP_VERSION")
    debug: bool = Field(False, validation_alias="DEBUG")
    
    # Database
    database_url: str = Field(..., validation_alias="DATABASE_URL")
    database_echo: bool = Field(False, validation_alias="DATABASE_ECHO")
    
    # Redis
    redis_url: str = Field("redis://localhost:6379", validation_alias="REDIS_URL")
    
    # Security
    secret_key: str = Field("your-secret-key-change-in-production", validation_alias="SECRET_KEY")
    algorithm: str = Field("HS256", validation_alias="ALGORITHM")
    access_token_expire_minutes: int = Field(30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # CORS - Handle as string first, then convert to list
    allowed_origins_raw: Optional[str] = Field(None, validation_alias="ALLOWED_ORIGINS")
    
    @property
    def allowed_origins(self) -> List[str]:
        if self.allowed_origins_raw:
            return [origin.strip() for origin in self.allowed_origins_raw.split(',') if origin.strip()]
        return ["http://localhost:5173", "http://localhost:3000"]
    
    # Rate Limiting
    rate_limit_requests: int = Field(100, validation_alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(60, validation_alias="RATE_LIMIT_WINDOW")  # seconds
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


# Global settings instance
settings = Settings() 