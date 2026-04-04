"""Módulo de utilidades."""
from functools import wraps
from flask import request, jsonify, g
from .database import get_db, get_db_session, init_db, reset_database


def login_required(f):
    """Decorator que valida el token Bearer y carga g.current_user_id."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
        if not token:
            return jsonify({"success": False, "error": "No autenticado"}), 401

        from app.models.user import User
        from app.utils.database import get_db_session as _session
        with _session() as db:
            user = db.query(User).filter(User.token == token).first()
            if not user:
                return jsonify({"success": False, "error": "Token inválido"}), 401
            g.current_user_id = user.id

        return f(*args, **kwargs)
    return decorated


__all__ = ["get_db", "get_db_session", "init_db", "reset_database", "login_required"]