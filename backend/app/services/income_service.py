"""
Servicio de lógica de negocio para ingresos.
"""
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.income import Income


class IncomeService:
    """Servicio para manejar lógica de negocio de ingresos."""

    @staticmethod
    def create_income(
        db: Session,
        description: str,
        amount: float,
        income_type: str,
        frequency: Optional[str] = None,
        date: Optional[datetime] = None,
        notes: Optional[str] = None,
        is_active: bool = True,
    ) -> Income:
        """Crea un nuevo ingreso."""
        income = Income(
            description=description,
            amount=amount,
            income_type=income_type,
            frequency=frequency,
            date=date or datetime.utcnow(),
            notes=notes,
            is_active=is_active,
        )
        db.add(income)
        db.commit()
        db.refresh(income)
        return income

    @staticmethod
    def get_income_by_id(db: Session, income_id: int) -> Optional[Income]:
        """Obtiene un ingreso por ID."""
        return db.query(Income).filter(Income.id == income_id).first()

    @staticmethod
    def get_all_incomes(
        db: Session,
        skip: int = 0,
        limit: Optional[int] = None,
        income_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[Income], int]:
        """Obtiene todos los ingresos con filtros opcionales."""
        query = db.query(Income)

        if income_type:
            query = query.filter(Income.income_type == income_type)
        if is_active is not None:
            query = query.filter(Income.is_active == is_active)
        if start_date:
            query = query.filter(Income.date >= start_date)
        if end_date:
            query = query.filter(Income.date <= end_date)

        query = query.order_by(Income.date.desc())

        total = query.count()

        query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)

        return query.all(), total

    @staticmethod
    def update_income(
        db: Session,
        income_id: int,
        description: Optional[str] = None,
        amount: Optional[float] = None,
        income_type: Optional[str] = None,
        frequency: Optional[str] = None,
        date: Optional[datetime] = None,
        notes: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Income]:
        """Actualiza un ingreso existente."""
        income = IncomeService.get_income_by_id(db, income_id)
        if not income:
            return None

        if description is not None:
            income.description = description
        if amount is not None:
            income.amount = amount
        if income_type is not None:
            income.income_type = income_type
        if frequency is not None:
            income.frequency = frequency
        if date is not None:
            income.date = date
        if notes is not None:
            income.notes = notes
        if is_active is not None:
            income.is_active = is_active

        db.commit()
        db.refresh(income)
        return income

    @staticmethod
    def delete_income(db: Session, income_id: int) -> bool:
        """Elimina un ingreso."""
        income = IncomeService.get_income_by_id(db, income_id)
        if not income:
            return False

        db.delete(income)
        db.commit()
        return True

    @staticmethod
    def get_monthly_estimate(db: Session) -> Dict:
        """
        Calcula la estimación mensual basada en ingresos activos recurrentes.
        - fixed semanal  -> amount * 4
        - fixed quincenal -> amount * 2
        - fixed mensual  -> amount * 1
        - variable con misma lógica de frecuencia
        """
        active_incomes = db.query(Income).filter(
            Income.is_active == True,
            Income.income_type.in_(["fixed", "variable"]),
        ).all()

        total_fixed = 0.0
        total_variable = 0.0

        for income in active_incomes:
            multiplier = 1.0
            if income.frequency == "weekly":
                multiplier = 4.0
            elif income.frequency == "biweekly":
                multiplier = 2.0
            elif income.frequency == "monthly":
                multiplier = 1.0

            monthly_amount = income.amount * multiplier

            if income.income_type == "fixed":
                total_fixed += monthly_amount
            else:
                total_variable += monthly_amount

        return {
            "fixed": total_fixed,
            "variable": total_variable,
            "total": total_fixed + total_variable,
        }

    @staticmethod
    def get_summary_by_month(db: Session, user_id: int, year: int) -> List[Dict]:
        """
        Resumen de ingresos agrupados por mes para un año dado.
        - Ingresos recurrentes activos (fixed/variable): se proyectan en todos los meses.
        - Ingresos no recurrentes (sporadic/one_time/commission): solo en su mes de fecha.
        """
        # Ingreso mensual recurrente
        recurrent = db.query(Income).filter(
            Income.user_id == user_id,
            Income.is_active == True,
            Income.income_type.in_(["fixed", "variable"]),
        ).all()

        monthly_recurrent = 0.0
        for inc in recurrent:
            multiplier = {"weekly": 4.0, "biweekly": 2.0, "monthly": 1.0}.get(inc.frequency, 1.0)
            monthly_recurrent += inc.amount * multiplier

        # Ingresos no recurrentes agrupados por mes
        sporadic_rows = db.query(
            extract('month', Income.date).label('month'),
            func.sum(Income.amount).label('total'),
        ).filter(
            Income.user_id == user_id,
            Income.income_type.in_(["sporadic", "one_time", "commission"]),
            extract('year', Income.date) == year,
        ).group_by(
            extract('month', Income.date),
        ).all()

        sporadic_by_month = {int(r.month): float(r.total) for r in sporadic_rows}

        # Proyectar hasta el mes actual si es el año en curso, sino diciembre
        current = datetime.now()
        max_month = current.month if current.year == year else 12

        return [
            {
                'month': m,
                'year': year,
                'total': monthly_recurrent + sporadic_by_month.get(m, 0.0),
                'count': 1,
            }
            for m in range(1, max_month + 1)
            if monthly_recurrent > 0 or m in sporadic_by_month
        ]

    @staticmethod
    def get_summary(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict:
        """
        Resumen de ingresos por tipo.
        - Recurrentes (fixed, variable): siempre incluye los activos con su monto mensual equivalente.
        - No recurrentes (sporadic, one_time, commission): filtra por rango de fechas.
        """
        summary = {"fixed": 0.0, "variable": 0.0, "sporadic": 0.0, "one_time": 0.0, "commission": 0.0}

        # Ingresos recurrentes activos: siempre se incluyen con su equivalente mensual
        recurrent_incomes = db.query(Income).filter(
            Income.is_active == True,
            Income.income_type.in_(["fixed", "variable"]),
        ).all()

        for income in recurrent_incomes:
            multiplier = 1.0
            if income.frequency == "weekly":
                multiplier = 4.0
            elif income.frequency == "biweekly":
                multiplier = 2.0
            summary[income.income_type] += income.amount * multiplier

        # Ingresos no recurrentes: filtrar por rango de fechas
        non_recurrent_query = db.query(
            Income.income_type,
            func.sum(Income.amount).label("total"),
        ).filter(
            Income.income_type.in_(["sporadic", "one_time", "commission"]),
        )

        if start_date:
            non_recurrent_query = non_recurrent_query.filter(Income.date >= start_date)
        if end_date:
            non_recurrent_query = non_recurrent_query.filter(Income.date <= end_date)

        non_recurrent_query = non_recurrent_query.group_by(Income.income_type)
        for row in non_recurrent_query.all():
            if row.income_type in summary:
                summary[row.income_type] = float(row.total)

        summary["total"] = sum(summary.values())
        return summary
