"""
Endpoint para registrar gastos desde Apple Pay via iOS Shortcuts.

Uso desde Shortcut:
  POST http://TU_IP:8000/api/apple-pay
  Header: X-API-Key: finanzas-shortcut-key-2024
  Body JSON: { "description": "Walmart", "amount": 5000, "category": "Alimentación" }
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from app.config import settings
from app.services import ExpenseService
from app.utils import get_db_session

apple_pay_bp = Blueprint("apple_pay", __name__, url_prefix="/api/apple-pay")

# Mapa de palabras clave en nombre de comercio → categoría automática
MERCHANT_CATEGORY_MAP = {
    "walmart": "Alimentación",
    "super": "Alimentación",
    "mas x menos": "Alimentación",
    "automercado": "Alimentación",
    "maxi": "Alimentación",
    "fresh market": "Alimentación",
    "mcdonalds": "Restaurantes",
    "burger": "Restaurantes",
    "subway": "Restaurantes",
    "pizza": "Restaurantes",
    "kfc": "Restaurantes",
    "restaurant": "Restaurantes",
    "uber eats": "Restaurantes",
    "rappi": "Restaurantes",
    "uber": "Transporte",
    "didi": "Transporte",
    "gasolina": "Transporte",
    "shell": "Transporte",
    "delta": "Transporte",
    "netflix": "Subscripciones",
    "spotify": "Subscripciones",
    "apple": "Subscripciones",
    "amazon": "Subscripciones",
    "farmacia": "Salud",
    "caja": "Salud",
    "clinica": "Salud",
    "hospital": "Salud",
}


def _guess_category(merchant: str) -> str:
    """Intenta adivinar la categoría basado en el nombre del comercio."""
    merchant_lower = merchant.lower()
    for keyword, category in MERCHANT_CATEGORY_MAP.items():
        if keyword in merchant_lower:
            return category
    return "Otros"


@apple_pay_bp.route("", methods=["POST"])
def register_apple_pay():
    """
    Registra un gasto desde Apple Pay via iOS Shortcuts.

    Headers:
      X-API-Key: <tu api key>

    Body JSON:
      {
        "description": "Walmart Tibás",   ← nombre del comercio (requerido)
        "amount": 5000.0,                 ← monto (requerido)
        "category": "Alimentación",       ← opcional, se autodetecta si no se envía
        "date": "2024-03-21T10:30:00",    ← opcional, usa fecha actual si no se envía
        "notes": "Compra del super"       ← opcional
      }
    """
    # Validar API key
    api_key = request.headers.get("X-API-Key", "")
    if api_key != settings.SHORTCUT_API_KEY:
        return jsonify({"success": False, "error": "API key inválida"}), 401

    data = request.get_json() or {}

    description = data.get("description", "").strip()
    amount = data.get("amount")

    if not description:
        return jsonify({"success": False, "error": "Campo requerido: description"}), 400
    if amount is None:
        return jsonify({"success": False, "error": "Campo requerido: amount"}), 400

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "El monto debe ser un número"}), 400

    # Categoría: usa la enviada, o autodetecta, o "Otros"
    category = data.get("category") or _guess_category(description)

    # Fecha: usa la enviada o la actual
    date = None
    if data.get("date"):
        try:
            date = datetime.fromisoformat(data["date"])
        except ValueError:
            date = datetime.utcnow()

    notes = data.get("notes", "Registrado via Apple Pay")

    try:
        from app.models.user import User
        with get_db_session() as db:
            # App personal: usar el primer usuario registrado
            user = db.query(User).first()
            user_id = user.id if user else None

            expense = ExpenseService.create_expense(
                db=db,
                description=description,
                amount=amount,
                category=category,
                date=date,
                notes=notes,
                payment_method="Apple Pay",
                user_id=user_id,
            )
            return jsonify({
                "success": True,
                "message": f"✅ Gasto registrado: {description} — ₡{amount:,.0f}",
                "data": expense.to_dict(),
            }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500