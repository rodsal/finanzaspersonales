"""Router de autenticación."""
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.utils import get_db_session
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_token_from_header():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"success": False, "error": "Nombre, email y contraseña son requeridos"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    with get_db_session() as db:
        if db.query(User).filter(User.email == email).first():
            return jsonify({"success": False, "error": "El email ya está registrado"}), 409

        token = str(uuid.uuid4())
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            token=token,
        )
        db.add(user)
        db.flush()

        return jsonify({
            "success": True,
            "data": {"token": token, "user": user.to_dict()},
        }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    with get_db_session() as db:
        user = db.query(User).filter(User.email == email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"success": False, "error": "Credenciales incorrectas"}), 401

        token = str(uuid.uuid4())
        user.token = token

        return jsonify({
            "success": True,
            "data": {"token": token, "user": user.to_dict()},
        })


@auth_bp.route("/me", methods=["GET"])
def me():
    token = _get_token_from_header()
    if not token:
        return jsonify({"success": False, "error": "No autenticado"}), 401

    with get_db_session() as db:
        user = db.query(User).filter(User.token == token).first()
        if not user:
            return jsonify({"success": False, "error": "Token inválido"}), 401

        return jsonify({"success": True, "data": user.to_dict()})