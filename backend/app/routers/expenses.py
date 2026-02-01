"""
Router de endpoints para gastos.
"""
from datetime import datetime
from typing import List, Optional
from flask import Blueprint, request, jsonify

from app.services import ExpenseService
from app.utils import get_db_session

# Crear blueprint
expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")


@expenses_bp.route("", methods=["GET"])
def get_expenses():
    """
    Obtiene todos los gastos con filtros opcionales.

    Query params:
    - skip: offset para paginación (default: 0)
    - limit: límite de resultados (default: 100)
    - category: filtrar por categoría
    - start_date: fecha de inicio (ISO format)
    - end_date: fecha de fin (ISO format)
    """
    try:
        # Obtener parámetros
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", 100, type=int)
        category = request.args.get("category", None)
        start_date_str = request.args.get("start_date", None)
        end_date_str = request.args.get("end_date", None)

        # Parsear fechas
        start_date = None
        end_date = None
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str)

        # Obtener gastos
        with get_db_session() as db:
            expenses, total = ExpenseService.get_all_expenses(
                db=db,
                skip=skip,
                limit=limit,
                category=category,
                start_date=start_date,
                end_date=end_date,
            )

            return jsonify({
                "success": True,
                "data": [expense.to_dict() for expense in expenses],
                "total": total,
                "skip": skip,
                "limit": limit,
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/<int:expense_id>", methods=["GET"])
def get_expense(expense_id: int):
    """Obtiene un gasto por ID."""
    try:
        with get_db_session() as db:
            expense = ExpenseService.get_expense_by_id(db, expense_id)

            if not expense:
                return jsonify({
                    "success": False,
                    "error": "Gasto no encontrado",
                }), 404

            return jsonify({
                "success": True,
                "data": expense.to_dict(),
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("", methods=["POST"])
def create_expense():
    """
    Crea un nuevo gasto.

    Body JSON:
    {
        "description": "Descripción del gasto",
        "amount": 1000.0,
        "category": "Alimentación",
        "date": "2024-01-31T10:00:00",  // opcional
        "notes": "Notas adicionales",  // opcional
        "payment_method": "Tarjeta",  // opcional
        "category_id": 1  // opcional
    }
    """
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ["description", "amount", "category"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Campo requerido: {field}",
                }), 400

        # Parsear fecha si existe
        date = None
        if "date" in data and data["date"]:
            date = datetime.fromisoformat(data["date"])

        # Crear gasto
        with get_db_session() as db:
            expense = ExpenseService.create_expense(
                db=db,
                description=data["description"],
                amount=float(data["amount"]),
                category=data["category"],
                date=date,
                notes=data.get("notes"),
                payment_method=data.get("payment_method"),
                category_id=data.get("category_id"),
            )

            return jsonify({
                "success": True,
                "data": expense.to_dict(),
                "message": "Gasto creado exitosamente",
            }), 201

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": f"Error de validación: {str(e)}",
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id: int):
    """
    Actualiza un gasto existente.

    Body JSON: mismos campos que POST, todos opcionales.
    """
    try:
        data = request.get_json()

        # Parsear fecha si existe
        date = None
        if "date" in data and data["date"]:
            date = datetime.fromisoformat(data["date"])

        # Actualizar gasto
        with get_db_session() as db:
            expense = ExpenseService.update_expense(
                db=db,
                expense_id=expense_id,
                description=data.get("description"),
                amount=float(data["amount"]) if "amount" in data else None,
                category=data.get("category"),
                date=date,
                notes=data.get("notes"),
                payment_method=data.get("payment_method"),
                category_id=data.get("category_id"),
            )

            if not expense:
                return jsonify({
                    "success": False,
                    "error": "Gasto no encontrado",
                }), 404

            return jsonify({
                "success": True,
                "data": expense.to_dict(),
                "message": "Gasto actualizado exitosamente",
            }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": f"Error de validación: {str(e)}",
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id: int):
    """Elimina un gasto."""
    try:
        with get_db_session() as db:
            success = ExpenseService.delete_expense(db, expense_id)

            if not success:
                return jsonify({
                    "success": False,
                    "error": "Gasto no encontrado",
                }), 404

            return jsonify({
                "success": True,
                "message": "Gasto eliminado exitosamente",
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/summary/category", methods=["GET"])
def get_summary_by_category():
    """
    Obtiene resumen de gastos agrupados por categoría.

    Query params:
    - start_date: fecha de inicio (ISO format)
    - end_date: fecha de fin (ISO format)
    """
    try:
        start_date_str = request.args.get("start_date", None)
        end_date_str = request.args.get("end_date", None)

        # Parsear fechas
        start_date = None
        end_date = None
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str)

        # Obtener resumen
        with get_db_session() as db:
            summary = ExpenseService.get_summary_by_category(
                db=db,
                start_date=start_date,
                end_date=end_date,
            )

            # Calcular total general
            total_general = sum(item["total"] for item in summary)

            # Calcular porcentajes
            for item in summary:
                item["percentage"] = (item["total"] / total_general * 100) if total_general > 0 else 0

            return jsonify({
                "success": True,
                "data": summary,
                "total": total_general,
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/summary/month", methods=["GET"])
def get_summary_by_month():
    """
    Obtiene resumen de gastos agrupados por mes.

    Query params:
    - year: año a filtrar (opcional)
    """
    try:
        year = request.args.get("year", None, type=int)

        # Obtener resumen
        with get_db_session() as db:
            summary = ExpenseService.get_summary_by_month(db=db, year=year)

            return jsonify({
                "success": True,
                "data": summary,
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@expenses_bp.route("/total", methods=["GET"])
def get_total():
    """
    Obtiene el total de gastos.

    Query params:
    - start_date: fecha de inicio (ISO format)
    - end_date: fecha de fin (ISO format)
    """
    try:
        start_date_str = request.args.get("start_date", None)
        end_date_str = request.args.get("end_date", None)

        # Parsear fechas
        start_date = None
        end_date = None
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str)

        # Obtener total
        with get_db_session() as db:
            total = ExpenseService.get_total_expenses(
                db=db,
                start_date=start_date,
                end_date=end_date,
            )

            return jsonify({
                "success": True,
                "total": total,
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500
