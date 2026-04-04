"""
Servicio de lógica de negocio para gastos.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.expense import Expense, ExpenseCategory


class ExpenseService:
    """Servicio para manejar lógica de negocio de gastos."""

    @staticmethod
    def create_expense(
        db: Session,
        description: str,
        amount: float,
        category: str,
        date: Optional[datetime] = None,
        notes: Optional[str] = None,
        payment_method: Optional[str] = None,
        category_id: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> Expense:
        """Crea un nuevo gasto."""
        expense = Expense(
            description=description,
            amount=amount,
            category=category,
            category_id=category_id,
            user_id=user_id,
            date=date or datetime.utcnow(),
            notes=notes,
            payment_method=payment_method,
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def get_expense_by_id(db: Session, expense_id: int) -> Optional[Expense]:
        """Obtiene un gasto por ID."""
        return db.query(Expense).filter(Expense.id == expense_id).first()

    @staticmethod
    def get_all_expenses(
        db: Session,
        skip: int = 0,
        limit: Optional[int] = None,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[Expense], int]:
        """
        Obtiene todos los gastos con filtros opcionales.
        Retorna (lista de gastos, total de registros).
        """
        query = db.query(Expense)

        # Aplicar filtros
        if category:
            query = query.filter(Expense.category == category)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)

        # Ordenar por fecha descendente
        query = query.order_by(Expense.date.desc())

        # Contar total
        total = query.count()

        # Aplicar paginación
        query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)
        expenses = query.all()

        return expenses, total

    @staticmethod
    def update_expense(
        db: Session,
        expense_id: int,
        description: Optional[str] = None,
        amount: Optional[float] = None,
        category: Optional[str] = None,
        date: Optional[datetime] = None,
        notes: Optional[str] = None,
        payment_method: Optional[str] = None,
        category_id: Optional[int] = None,
    ) -> Optional[Expense]:
        """Actualiza un gasto existente."""
        expense = ExpenseService.get_expense_by_id(db, expense_id)
        if not expense:
            return None

        if description is not None:
            expense.description = description
        if amount is not None:
            expense.amount = amount
        if category is not None:
            expense.category = category
        if category_id is not None:
            expense.category_id = category_id
        if date is not None:
            expense.date = date
        if notes is not None:
            expense.notes = notes
        if payment_method is not None:
            expense.payment_method = payment_method

        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> bool:
        """Elimina un gasto."""
        expense = ExpenseService.get_expense_by_id(db, expense_id)
        if not expense:
            return False

        db.delete(expense)
        db.commit()
        return True

    @staticmethod
    def delete_all_expenses(db: Session) -> int:
        """
        Elimina todos los gastos.
        Retorna el número de gastos eliminados.
        """
        count = db.query(Expense).count()
        db.query(Expense).delete()
        db.commit()
        return count

    @staticmethod
    def get_summary_by_category(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """
        Obtiene un resumen de gastos agrupados por categoría.
        """
        query = db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
            func.avg(Expense.amount).label("average"),
        )

        # Aplicar filtros de fecha
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)

        # Agrupar por categoría
        query = query.group_by(Expense.category)

        # Ordenar por total descendente
        query = query.order_by(func.sum(Expense.amount).desc())
        
        # Join with ExpenseCategory to get max_spend
        # Since we are grouping by Expense.category (string), and ExpenseCategory.name is the join key
        # But we need to be careful with the join.
        # Actually, let's fetch the summary first, then enrich it with category details, OR do a join.
        # A join is better. 
        # But wait, the query currently selects Expense.category (string).
        # Let's adjust the query to join.
        
        query = db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
            func.avg(Expense.amount).label("average"),
            ExpenseCategory.max_spend
        ).outerjoin(ExpenseCategory, Expense.category == ExpenseCategory.name)
        
        # Apply filters again on the new query object
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
            
        query = query.group_by(Expense.category, ExpenseCategory.max_spend)
        query = query.order_by(func.sum(Expense.amount).desc())

        results = query.all()

        return [
            {
                "category": row.category,
                "total": float(row.total),
                "count": row.count,
                "average": float(row.average),
                "max_spend": float(row.max_spend) if row.max_spend is not None else None,
            }
            for row in results
        ]

    @staticmethod
    def get_summary_by_month(
        db: Session,
        year: Optional[int] = None,
    ) -> List[Dict]:
        """
        Obtiene un resumen de gastos agrupados por mes.
        """
        query = db.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        )

        # Filtrar por año si se especifica
        if year:
            query = query.filter(extract("year", Expense.date) == year)

        # Agrupar por año y mes
        query = query.group_by(
            extract("year", Expense.date),
            extract("month", Expense.date),
        )

        # Ordenar por año y mes
        query = query.order_by(
            extract("year", Expense.date).desc(),
            extract("month", Expense.date).desc(),
        )

        results = query.all()

        return [
            {
                "year": int(row.year),
                "month": int(row.month),
                "total": float(row.total),
                "count": row.count,
            }
            for row in results
        ]

    @staticmethod
    def get_total_expenses(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> float:
        """Obtiene el total de gastos en un rango de fechas."""
        query = db.query(func.sum(Expense.amount))

        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)

        total = query.scalar()
        return float(total) if total else 0.0


class CategoryService:
    """Servicio para manejar categorías personalizadas."""

    @staticmethod
    def create_category(
        db: Session,
        name: str,
        description: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None,
        max_spend: Optional[float] = None,
    ) -> ExpenseCategory:
        """Crea una nueva categoría personalizada."""
        category = ExpenseCategory(
            name=name,
            description=description,
            color=color,
            icon=icon,
            max_spend=max_spend,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_all_categories(db: Session) -> List[ExpenseCategory]:
        """Obtiene todas las categorías."""
        return db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()

    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[ExpenseCategory]:
        """Obtiene una categoría por ID."""
        return db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()

    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None,
        max_spend: Optional[float] = None,
    ) -> Optional[ExpenseCategory]:
        """Actualiza una categoría."""
        category = CategoryService.get_category_by_id(db, category_id)
        if not category:
            return None

        if name is not None:
            category.name = name
        if description is not None:
            category.description = description
        if color is not None:
            category.color = color
        if icon is not None:
            category.icon = icon
        if max_spend is not None:
            category.max_spend = max_spend

        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: int) -> bool:
        """Elimina una categoría."""
        category = CategoryService.get_category_by_id(db, category_id)
        if not category:
            return False

        db.delete(category)
        db.commit()
        return True
