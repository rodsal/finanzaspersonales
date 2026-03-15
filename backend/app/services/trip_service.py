"""
Servicio de lógica de negocio para viajes y presupuestos de viaje.
"""
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.trip import Trip, TripExpense

TRIP_CATEGORIES = [
    "Transporte",
    "Alojamiento",
    "Alimentación",
    "Entretenimiento",
    "Compras",
    "Salud",
    "Otros",
]


class TripService:
    """Servicio para manejar lógica de negocio de viajes."""

    @staticmethod
    def create_trip(
        db: Session,
        user_id: int,
        name: str,
        start_date,
        end_date,
        currency: str,
        total_budget: float,
        notes: Optional[str] = None,
    ) -> Trip:
        """Crea un nuevo viaje."""
        trip = Trip(
            user_id=user_id,
            name=name,
            start_date=start_date,
            end_date=end_date,
            currency=currency,
            total_budget=total_budget,
            notes=notes,
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def get_all_trips(db: Session, user_id: int) -> List[Trip]:
        """Obtiene todos los viajes del usuario."""
        return db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.start_date.desc()).all()

    @staticmethod
    def get_trip_by_id(db: Session, user_id: int, trip_id: int) -> Optional[Trip]:
        """Obtiene un viaje por ID."""
        return db.query(Trip).filter(
            Trip.id == trip_id,
            Trip.user_id == user_id,
        ).first()

    @staticmethod
    def update_trip(
        db: Session,
        user_id: int,
        trip_id: int,
        name: Optional[str] = None,
        start_date=None,
        end_date=None,
        currency: Optional[str] = None,
        total_budget: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> Optional[Trip]:
        """Actualiza un viaje existente."""
        trip = TripService.get_trip_by_id(db, user_id, trip_id)
        if not trip:
            return None

        if name is not None:
            trip.name = name
        if start_date is not None:
            trip.start_date = start_date
        if end_date is not None:
            trip.end_date = end_date
        if currency is not None:
            trip.currency = currency
        if total_budget is not None:
            trip.total_budget = total_budget
        if notes is not None:
            trip.notes = notes

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def delete_trip(db: Session, user_id: int, trip_id: int) -> bool:
        """Elimina un viaje y todos sus gastos (cascade)."""
        trip = TripService.get_trip_by_id(db, user_id, trip_id)
        if not trip:
            return False

        # Eliminar gastos del viaje primero
        db.query(TripExpense).filter(TripExpense.trip_id == trip_id).delete()
        db.delete(trip)
        db.commit()
        return True

    @staticmethod
    def get_trip_summary(db: Session, user_id: int, trip_id: int) -> Optional[Dict]:
        """
        Calcula el resumen del viaje: total gastado vs presupuesto y desglose por categoría.
        """
        trip = TripService.get_trip_by_id(db, user_id, trip_id)
        if not trip:
            return None

        # Total gastado
        total_spent_row = db.query(func.sum(TripExpense.amount)).filter(
            TripExpense.trip_id == trip_id,
        ).scalar()
        total_spent = float(total_spent_row or 0)

        # Desglose por categoría
        rows = db.query(
            TripExpense.category,
            func.sum(TripExpense.amount).label("total"),
            func.count(TripExpense.id).label("count"),
        ).filter(
            TripExpense.trip_id == trip_id,
        ).group_by(TripExpense.category).all()

        by_category = [
            {"category": r.category, "total": float(r.total), "count": int(r.count)}
            for r in rows
        ]

        return {
            "trip_id": trip_id,
            "currency": trip.currency,
            "total_budget": trip.total_budget,
            "total_spent": total_spent,
            "remaining": trip.total_budget - total_spent,
            "percentage_used": (total_spent / trip.total_budget * 100) if trip.total_budget > 0 else 0,
            "by_category": by_category,
        }


class TripExpenseService:
    """Servicio para manejar gastos dentro de un viaje."""

    @staticmethod
    def create_expense(
        db: Session,
        trip_id: int,
        user_id: int,
        description: str,
        amount: float,
        category: str,
        date: Optional[datetime] = None,
        payment_method: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> TripExpense:
        """Crea un nuevo gasto de viaje."""
        expense = TripExpense(
            trip_id=trip_id,
            user_id=user_id,
            description=description,
            amount=amount,
            category=category,
            date=date or datetime.utcnow(),
            payment_method=payment_method,
            notes=notes,
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def get_all_expenses(db: Session, trip_id: int) -> List[TripExpense]:
        """Obtiene todos los gastos de un viaje."""
        return db.query(TripExpense).filter(
            TripExpense.trip_id == trip_id,
        ).order_by(TripExpense.date.desc()).all()

    @staticmethod
    def get_expense_by_id(db: Session, trip_id: int, expense_id: int) -> Optional[TripExpense]:
        """Obtiene un gasto por ID."""
        return db.query(TripExpense).filter(
            TripExpense.id == expense_id,
            TripExpense.trip_id == trip_id,
        ).first()

    @staticmethod
    def update_expense(
        db: Session,
        trip_id: int,
        expense_id: int,
        description: Optional[str] = None,
        amount: Optional[float] = None,
        category: Optional[str] = None,
        date: Optional[datetime] = None,
        payment_method: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[TripExpense]:
        """Actualiza un gasto de viaje."""
        expense = TripExpenseService.get_expense_by_id(db, trip_id, expense_id)
        if not expense:
            return None

        if description is not None:
            expense.description = description
        if amount is not None:
            expense.amount = amount
        if category is not None:
            expense.category = category
        if date is not None:
            expense.date = date
        if payment_method is not None:
            expense.payment_method = payment_method
        if notes is not None:
            expense.notes = notes

        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def delete_expense(db: Session, trip_id: int, expense_id: int) -> bool:
        """Elimina un gasto de viaje."""
        expense = TripExpenseService.get_expense_by_id(db, trip_id, expense_id)
        if not expense:
            return False

        db.delete(expense)
        db.commit()
        return True
