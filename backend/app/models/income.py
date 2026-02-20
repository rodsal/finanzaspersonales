"""
Modelos de base de datos para ingresos.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
import enum

from app.models.expense import Base


class IncomeType(str, enum.Enum):
    """Tipos de ingreso."""
    FIXED = "fixed"         # Salario fijo recurrente
    VARIABLE = "variable"   # Salario variable recurrente
    SPORADIC = "sporadic"   # Ingreso único esporádico
    ONE_TIME = "one_time"   # Ingreso único mensual
    COMMISSION = "commission"  # Comisión por ventas


class IncomeFrequency(str, enum.Enum):
    """Frecuencia de ingresos recurrentes."""
    WEEKLY = "weekly"       # Semanal
    BIWEEKLY = "biweekly"   # Quincenal
    MONTHLY = "monthly"     # Mensual


class Income(Base):
    """Modelo para ingresos personales."""
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    income_type = Column(String(20), nullable=False, index=True)   # fixed, variable, sporadic
    frequency = Column(String(20), nullable=True)                  # weekly, biweekly, monthly (solo fixed/variable)
    date = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    notes = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)      # aplica a fixed y variable
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convierte el objeto a diccionario."""
        return {
            "id": self.id,
            "description": self.description,
            "amount": self.amount,
            "income_type": self.income_type,
            "frequency": self.frequency,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
