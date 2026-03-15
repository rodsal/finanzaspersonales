"""
Modelos de base de datos para viajes y presupuestos de viaje.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey

from app.models.expense import Base


class Trip(Base):
    """Modelo para viajes con presupuesto."""
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    currency = Column(String(10), nullable=False, default="CRC")
    total_budget = Column(Float, nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convierte el objeto a diccionario."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "currency": self.currency,
            "total_budget": self.total_budget,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TripExpense(Base):
    """Modelo para gastos dentro de un viaje."""
    __tablename__ = "trip_expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    payment_method = Column(String(50), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convierte el objeto a diccionario."""
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "user_id": self.user_id,
            "description": self.description,
            "amount": self.amount,
            "category": self.category,
            "date": self.date.isoformat() if self.date else None,
            "payment_method": self.payment_method,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
