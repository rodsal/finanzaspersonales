"""
Router de endpoints para ingresos.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from app.services.income_service import IncomeService
from app.utils import get_db_session

income_bp = Blueprint("income", __name__, url_prefix="/api/incomes")


@income_bp.route("", methods=["GET"])
def get_incomes():
    """
    Obtiene todos los ingresos con filtros opcionales.

    Query params:
    - skip: offset para paginación (default: 0)
    - limit: límite de resultados
    - income_type: filtrar por tipo (fixed, variable, sporadic)
    - is_active: filtrar por estado activo (true/false)
    - start_date: fecha de inicio (ISO format)
    - end_date: fecha de fin (ISO format)
    """
    try:
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", None, type=int)
        income_type = request.args.get("income_type", None)
        is_active_str = request.args.get("is_active", None)
        start_date_str = request.args.get("start_date", None)
        end_date_str = request.args.get("end_date", None)

        is_active = None
        if is_active_str is not None:
            is_active = is_active_str.lower() == "true"

        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None

        with get_db_session() as db:
            incomes, total = IncomeService.get_all_incomes(
                db=db,
                skip=skip,
                limit=limit,
                income_type=income_type,
                is_active=is_active,
                start_date=start_date,
                end_date=end_date,
            )

            return jsonify({
                "success": True,
                "data": [income.to_dict() for income in incomes],
                "total": total,
                "skip": skip,
                "limit": limit,
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("/<int:income_id>", methods=["GET"])
def get_income(income_id: int):
    """Obtiene un ingreso por ID."""
    try:
        with get_db_session() as db:
            income = IncomeService.get_income_by_id(db, income_id)

            if not income:
                return jsonify({"success": False, "error": "Ingreso no encontrado"}), 404

            return jsonify({"success": True, "data": income.to_dict()}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("", methods=["POST"])
def create_income():
    """
    Crea un nuevo ingreso.

    Body JSON:
    {
        "description": "Salario mensual",
        "amount": 500000,
        "income_type": "fixed",          // fixed, variable, sporadic
        "frequency": "monthly",          // weekly, biweekly, monthly (solo fixed/variable)
        "date": "2026-02-01T00:00:00",   // opcional
        "notes": "Notas",                // opcional
        "is_active": true                // opcional, default true
    }
    """
    try:
        data = request.get_json()

        # Validar campos requeridos
        for field in ["description", "amount", "income_type"]:
            if field not in data:
                return jsonify({"success": False, "error": f"Campo requerido: {field}"}), 400

        # Validar income_type
        if data["income_type"] not in ("fixed", "variable", "sporadic", "one_time", "commission"):
            return jsonify({"success": False, "error": "income_type debe ser: fixed, variable, sporadic, one_time o commission"}), 400

        # Validar frecuencia solo para fixed y variable (recurrentes)
        if data["income_type"] in ("fixed", "variable"):
            if "frequency" not in data or not data["frequency"]:
                return jsonify({"success": False, "error": "Se requiere frecuencia para ingresos fijos o variables"}), 400
            if data["frequency"] not in ("weekly", "biweekly", "monthly"):
                return jsonify({"success": False, "error": "frequency debe ser: weekly, biweekly o monthly"}), 400

        date = datetime.fromisoformat(data["date"]) if data.get("date") else None

        with get_db_session() as db:
            income = IncomeService.create_income(
                db=db,
                description=data["description"],
                amount=float(data["amount"]),
                income_type=data["income_type"],
                frequency=data.get("frequency"),
                date=date,
                notes=data.get("notes"),
                is_active=data.get("is_active", True),
            )

            return jsonify({
                "success": True,
                "data": income.to_dict(),
                "message": "Ingreso creado exitosamente",
            }), 201

    except ValueError as e:
        return jsonify({"success": False, "error": f"Error de validación: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("/<int:income_id>", methods=["PUT"])
def update_income(income_id: int):
    """Actualiza un ingreso existente."""
    try:
        data = request.get_json()

        date = datetime.fromisoformat(data["date"]) if data.get("date") else None

        with get_db_session() as db:
            income = IncomeService.update_income(
                db=db,
                income_id=income_id,
                description=data.get("description"),
                amount=float(data["amount"]) if "amount" in data else None,
                income_type=data.get("income_type"),
                frequency=data.get("frequency"),
                date=date,
                notes=data.get("notes"),
                is_active=data.get("is_active"),
            )

            if not income:
                return jsonify({"success": False, "error": "Ingreso no encontrado"}), 404

            return jsonify({
                "success": True,
                "data": income.to_dict(),
                "message": "Ingreso actualizado exitosamente",
            }), 200

    except ValueError as e:
        return jsonify({"success": False, "error": f"Error de validación: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("/<int:income_id>", methods=["DELETE"])
def delete_income(income_id: int):
    """Elimina un ingreso."""
    try:
        with get_db_session() as db:
            success = IncomeService.delete_income(db, income_id)

            if not success:
                return jsonify({"success": False, "error": "Ingreso no encontrado"}), 404

            return jsonify({"success": True, "message": "Ingreso eliminado exitosamente"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("/summary", methods=["GET"])
def get_summary():
    """
    Resumen de ingresos por tipo.

    Query params:
    - start_date: fecha de inicio (ISO format)
    - end_date: fecha de fin (ISO format)
    """
    try:
        start_date_str = request.args.get("start_date", None)
        end_date_str = request.args.get("end_date", None)

        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None

        with get_db_session() as db:
            summary = IncomeService.get_summary(db=db, start_date=start_date, end_date=end_date)

            return jsonify({"success": True, "data": summary}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@income_bp.route("/monthly-estimate", methods=["GET"])
def get_monthly_estimate():
    """Calcula la estimación mensual basada en ingresos activos recurrentes."""
    try:
        with get_db_session() as db:
            estimate = IncomeService.get_monthly_estimate(db)

            return jsonify({"success": True, "data": estimate}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
