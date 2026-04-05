"""Utilidades para manejo de base de datos."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from app.config import settings
from app.models.expense import Base
from app.models.income import Income  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.trip import Trip, TripExpense  # noqa: F401

engine = create_engine(
    settings.get_database_url(),
    pool_pre_ping=True,
    echo=settings.is_development(),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Inicializa la base de datos creando todas las tablas."""
    Base.metadata.create_all(bind=engine)
    seed_default_categories()
    print("✅ Base de datos inicializada correctamente")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def reset_database():
    """Elimina y recrea todas las tablas. ⚠️ SOLO PARA DESARROLLO."""
    if not settings.is_development():
        raise RuntimeError("reset_database() solo puede usarse en desarrollo")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos reiniciada correctamente")


def seed_default_categories():
    """Crea las categorías por defecto si no existen."""
    from app.models.expense import ExpenseCategory, ExpenseCategoryEnum

    with get_db_session() as db:
        for category_enum in ExpenseCategoryEnum:
            existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == category_enum.value).first()
            if not existing:
                print(f"📌 Creando categoría por defecto: {category_enum.value}")
                new_category = ExpenseCategory(
                    name=category_enum.value,
                    description=f"Categoría predefinida: {category_enum.value}",
                    icon="🏷️",
                    color="#6b7280"
                )
                db.add(new_category)
        db.commit()
    print("✅ Categorías por defecto verificadas")