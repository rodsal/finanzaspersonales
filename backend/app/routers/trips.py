"""
Router de endpoints para viajes y presupuestos de viaje.
"""
from datetime import datetime, date
from flask import Blueprint, request, jsonify, g

from app.services.trip_service import TripService, TripExpenseService
from app.utils import get_db_session, login_required

trips_bp = Blueprint("trips", __name__, url_prefix="/api/trips")


# ─── TRIPS ────────────────────────────────────────────────────────────────────

@trips_bp.route("", methods=["GET"])
@login_required
def get_trips():
    """Obtiene todos los viajes del usuario."""
    try:
        with get_db_session() as db:
            trips = TripService.get_all_trips(db, g.current_user_id)
            return jsonify({
                "success": True,
                "data": [t.to_dict() for t in trips],
            }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("", methods=["POST"])
@login_required
def create_trip():
    """Crea un nuevo viaje."""
    try:
        data = request.get_json()

        required = ["name", "start_date", "end_date", "currency", "total_budget"]
        for field in required:
            if field not in data or data[field] is None:
                return jsonify({"success": False, "error": f"Campo requerido: {field}"}), 400

        start_date = date.fromisoformat(data["start_date"])
        end_date = date.fromisoformat(data["end_date"])

        with get_db_session() as db:
            trip = TripService.create_trip(
                db=db,
                user_id=g.current_user_id,
                name=data["name"],
                start_date=start_date,
                end_date=end_date,
                currency=data["currency"],
                total_budget=float(data["total_budget"]),
                notes=data.get("notes"),
            )
            return jsonify({
                "success": True,
                "data": trip.to_dict(),
                "message": "Viaje creado exitosamente",
            }), 201

    except ValueError as e:
        return jsonify({"success": False, "error": f"Error de validación: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>", methods=["GET"])
@login_required
def get_trip(trip_id: int):
    """Obtiene un viaje por ID."""
    try:
        with get_db_session() as db:
            trip = TripService.get_trip_by_id(db, g.current_user_id, trip_id)
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404
            return jsonify({"success": True, "data": trip.to_dict()}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>", methods=["PUT"])
@login_required
def update_trip(trip_id: int):
    """Actualiza un viaje existente."""
    try:
        data = request.get_json()

        start_date = date.fromisoformat(data["start_date"]) if "start_date" in data and data["start_date"] else None
        end_date = date.fromisoformat(data["end_date"]) if "end_date" in data and data["end_date"] else None

        with get_db_session() as db:
            trip = TripService.update_trip(
                db=db,
                user_id=g.current_user_id,
                trip_id=trip_id,
                name=data.get("name"),
                start_date=start_date,
                end_date=end_date,
                currency=data.get("currency"),
                total_budget=float(data["total_budget"]) if "total_budget" in data else None,
                notes=data.get("notes"),
            )
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404
            return jsonify({
                "success": True,
                "data": trip.to_dict(),
                "message": "Viaje actualizado exitosamente",
            }), 200

    except ValueError as e:
        return jsonify({"success": False, "error": f"Error de validación: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>", methods=["DELETE"])
@login_required
def delete_trip(trip_id: int):
    """Elimina un viaje y todos sus gastos."""
    try:
        with get_db_session() as db:
            success = TripService.delete_trip(db, g.current_user_id, trip_id)
            if not success:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404
            return jsonify({"success": True, "message": "Viaje eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>/summary", methods=["GET"])
@login_required
def get_trip_summary(trip_id: int):
    """Obtiene el resumen financiero del viaje."""
    try:
        with get_db_session() as db:
            summary = TripService.get_trip_summary(db, g.current_user_id, trip_id)
            if not summary:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404
            return jsonify({"success": True, "data": summary}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─── TRIP EXPENSES ────────────────────────────────────────────────────────────

@trips_bp.route("/<int:trip_id>/expenses", methods=["GET"])
@login_required
def get_trip_expenses(trip_id: int):
    """Obtiene todos los gastos de un viaje."""
    try:
        # Verificar que el viaje pertenece al usuario
        with get_db_session() as db:
            trip = TripService.get_trip_by_id(db, g.current_user_id, trip_id)
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404

            expenses = TripExpenseService.get_all_expenses(db, trip_id)
            return jsonify({
                "success": True,
                "data": [e.to_dict() for e in expenses],
            }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>/expenses", methods=["POST"])
@login_required
def create_trip_expense(trip_id: int):
    """Agrega un gasto a un viaje."""
    try:
        with get_db_session() as db:
            trip = TripService.get_trip_by_id(db, g.current_user_id, trip_id)
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404

            data = request.get_json()
            required = ["description", "amount", "category"]
            for field in required:
                if field not in data or data[field] is None:
                    return jsonify({"success": False, "error": f"Campo requerido: {field}"}), 400

            expense_date = None
            if "date" in data and data["date"]:
                expense_date = datetime.fromisoformat(data["date"])

            expense = TripExpenseService.create_expense(
                db=db,
                trip_id=trip_id,
                user_id=g.current_user_id,
                description=data["description"],
                amount=float(data["amount"]),
                category=data["category"],
                date=expense_date,
                payment_method=data.get("payment_method"),
                notes=data.get("notes"),
            )
            return jsonify({
                "success": True,
                "data": expense.to_dict(),
                "message": "Gasto agregado al viaje",
            }), 201

    except ValueError as e:
        return jsonify({"success": False, "error": f"Error de validación: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>/expenses/<int:expense_id>", methods=["PUT"])
@login_required
def update_trip_expense(trip_id: int, expense_id: int):
    """Actualiza un gasto de viaje."""
    try:
        with get_db_session() as db:
            trip = TripService.get_trip_by_id(db, g.current_user_id, trip_id)
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404

            data = request.get_json()
            expense_date = None
            if "date" in data and data["date"]:
                expense_date = datetime.fromisoformat(data["date"])

            expense = TripExpenseService.update_expense(
                db=db,
                trip_id=trip_id,
                expense_id=expense_id,
                description=data.get("description"),
                amount=float(data["amount"]) if "amount" in data else None,
                category=data.get("category"),
                date=expense_date,
                payment_method=data.get("payment_method"),
                notes=data.get("notes"),
            )
            if not expense:
                return jsonify({"success": False, "error": "Gasto no encontrado"}), 404

            return jsonify({
                "success": True,
                "data": expense.to_dict(),
                "message": "Gasto actualizado",
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@trips_bp.route("/<int:trip_id>/expenses/<int:expense_id>", methods=["DELETE"])
@login_required
def delete_trip_expense(trip_id: int, expense_id: int):
    """Elimina un gasto de viaje."""
    try:
        with get_db_session() as db:
            trip = TripService.get_trip_by_id(db, g.current_user_id, trip_id)
            if not trip:
                return jsonify({"success": False, "error": "Viaje no encontrado"}), 404

            success = TripExpenseService.delete_expense(db, trip_id, expense_id)
            if not success:
                return jsonify({"success": False, "error": "Gasto no encontrado"}), 404

            return jsonify({"success": True, "message": "Gasto eliminado"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
