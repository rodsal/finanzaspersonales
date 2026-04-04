"""
Configuración centralizada de la aplicación.
Carga variables de entorno y define constantes del sistema.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


class Settings:
    """Clase de configuración de la aplicación."""

    # Configuración de Flask
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")

    # Configuración de Base de Datos PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/finanzas_personales"
    )

    # Configuración de CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    # Configuración de API
    API_PREFIX: str = "/api"
    API_VERSION: str = "v1"

    # Configuración de paginación
    DEFAULT_PAGE_SIZE: int = int(os.getenv("DEFAULT_PAGE_SIZE", "50"))
    MAX_PAGE_SIZE: int = int(os.getenv("MAX_PAGE_SIZE", "100"))

    # Configuración de timezone
    TIMEZONE: str = os.getenv("TIMEZONE", "America/Costa_Rica")

    # API Key para integraciones externas (ej. Apple Pay Shortcuts)
    SHORTCUT_API_KEY: str = os.getenv("SHORTCUT_API_KEY", "finanzas-shortcut-key-2024")

    @classmethod
    def get_database_url(cls) -> str:
        """
        Retorna la URL de la base de datos.
        Convierte postgresql:// a postgresql+psycopg:// si es necesario.
        """
        url = cls.DATABASE_URL
        # Si usa psycopg3, asegurarse de que la URL tenga el dialecto correcto
        if url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @classmethod
    def is_development(cls) -> bool:
        """Verifica si está en modo desarrollo."""
        return cls.FLASK_ENV == "development"


# Instancia global de configuración
settings = Settings()
