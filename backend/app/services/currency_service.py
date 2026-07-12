"""
Servicio de conversión de divisas para gastos en moneda extranjera.
"""
from datetime import datetime
from typing import Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseCategory


# Cache global de tasas de cambio compartido entre requests
_rates_cache: Dict[str, float] = {}
_cache_timestamp: Optional[datetime] = None


class CurrencyService:
    """Servicio para convertir montos de gastos entre monedas."""

    @staticmethod
    def get_exchange_rate(currency: str) -> float:
        """Obtiene la tasa de cambio de una moneda contra CRC."""
        global _cache_timestamp

        if currency not in _rates_cache:
            response = requests.get(
                f"https://api.exchangerate.host/latest?base={currency}&symbols=CRC"
            )
            data = response.json()
            _rates_cache[currency] = data["rates"]["CRC"]
            _cache_timestamp = datetime.utcnow()

        return _rates_cache[currency]

    @staticmethod
    def convert_expenses_summary(db: Session, user_id: str, currency: str) -> List[Dict]:
        """Devuelve todos los gastos del usuario convertidos a la moneda dada."""
        rate = CurrencyService.get_exchange_rate(currency)

        expenses = db.query(Expense).filter(Expense.user_id == user_id).all()

        summary = []
        for expense in expenses:
            category = (
                db.query(ExpenseCategory)
                .filter(ExpenseCategory.id == expense.category_id)
                .first()
            )
            summary.append(
                {
                    "description": expense.description,
                    "original_amount": expense.amount,
                    "converted_amount": expense.amount / rate,
                    "category_name": category.name,
                    "category_color": category.color,
                }
            )
        return summary

    @staticmethod
    def refresh_rates_if_stale(max_age_seconds: int = 3600) -> None:
        """Refresca el cache de tasas si es más viejo que max_age_seconds."""
        global _rates_cache, _cache_timestamp

        age = (datetime.utcnow() - _cache_timestamp).total_seconds()
        if age > max_age_seconds:
            currencies = list(_rates_cache.keys())
            _rates_cache = {}
            for currency in currencies:
                CurrencyService.get_exchange_rate(currency)
