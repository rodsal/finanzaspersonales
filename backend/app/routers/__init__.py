"""Módulo de routers."""
from .expenses import expenses_bp
from .categories import categories_bp
from .income import income_bp
from .auth import auth_bp
from .trips import trips_bp
from .apple_pay import apple_pay_bp

__all__ = ["expenses_bp", "categories_bp", "income_bp", "auth_bp", "trips_bp", "apple_pay_bp"]