"""
Modelos de base de datos para gastos.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class ExpenseCategoryEnum(str, enum.Enum):
    """Categorías predefinidas de gastos."""
    ALIMENTACION = "Alimentación"
    TRANSPORTE = "Transporte"
    VIVIENDA = "Vivienda"
    SERVICIOS = "Servicios"
    SALUD = "Salud"
    EDUCACION = "Educación"
    ENTRETENIMIENTO = "Entretenimiento"
    ROPA = "Ropa"
    TECNOLOGIA = "Tecnología"
    OTROS = "Otros"


class ExpenseCategory(Base):
    """Modelo para categorías de gastos personalizadas."""
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    color = Column(String(7), nullable=True)  # Formato hexadecimal #RRGGBB
    icon = Column(String(50), nullable=True)
    max_spend = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relación con gastos
    expenses = relationship("Expense", back_populates="category_obj")

    def to_dict(self):
        """Convierte el objeto a diccionario."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "max_spend": self.max_spend,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Expense(Base):
    """Modelo para gastos personales."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    date = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    notes = Column(String(500), nullable=True)
    payment_method = Column(String(50), nullable=True)  # Efectivo, Tarjeta, Transferencia, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relación con categoría
    category_obj = relationship("ExpenseCategory", back_populates="expenses")

    def to_dict(self):
        """Convierte el objeto a diccionario."""
        return {
            "id": self.id,
            "description": self.description,
            "amount": self.amount,
            "category": self.category,
            "category_id": self.category_id,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
