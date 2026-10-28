import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    DATABASE_URL: str = "sqlite:///./urban_infra.db"
    JWT_SECRET: str = "dev_secret_key_change_in_production_998877665544332211"
    ACCESS_TOKEN_MINUTES: int = 120
    REFRESH_TOKEN_DAYS: int = 7

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_UPLOAD_MB: int = 10

    STUDY_AREA_NAME: str = "Bengaluru Pilot Zones (Koramangala, Indiranagar, HSR Layout)"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    ENABLE_IMAGE_MODEL: bool = False
    ENABLE_SYNTHETIC_DATA_BANNER: bool = True

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
