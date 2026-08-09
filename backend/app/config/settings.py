import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Brain Tumor Detection & Monitoring System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///../../database/brain_tumor.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_SWITCH: str = os.getenv("GEMINI_SWITCH", "ON")
    STORAGE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))

    class Config:
        env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))

settings = Settings()
