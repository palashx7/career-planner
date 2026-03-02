import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Career Planner API"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # DB configuration
    DATABASE_URL: str
    
    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Auth configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # OTP Expiry
    OTP_EXPIRE_MINUTES: int = 15

    # Email configuration
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str
    
    # AI Services
    GROQ_API_KEY: str
    SERPAPI_KEY: str
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
