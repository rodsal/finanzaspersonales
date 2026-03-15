"""Módulo de routers."""
from .expenses import expenses_bp
from .categories import categories_bp
from .income import income_bp
<<<<<<< Updated upstream

__all__ = ["expenses_bp", "categories_bp", "income_bp"]
=======
from .auth import auth_bp
from .tasks import tasks_bp
from .trips import trips_bp

__all__ = ["expenses_bp", "categories_bp", "income_bp", "auth_bp", "tasks_bp", "trips_bp"]
>>>>>>> Stashed changes
