"""
Router de endpoints para categorías personalizadas.
"""
from flask import Blueprint, request, jsonify

from app.services import CategoryService
from app.utils import get_db_session

# Crear blueprint
categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.route("", methods=["GET"])
def get_categories():
    """Obtiene todas las categorías personalizadas."""
    try:
        with get_db_session() as db:
            categories = CategoryService.get_all_categories(db)

            return jsonify({
                "success": True,
                "data": [category.to_dict() for category in categories],
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@categories_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id: int):
    """Obtiene una categoría por ID."""
    try:
        with get_db_session() as db:
            category = CategoryService.get_category_by_id(db, category_id)

            if not category:
                return jsonify({
                    "success": False,
                    "error": "Categoría no encontrada",
                }), 404

            return jsonify({
                "success": True,
                "data": category.to_dict(),
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@categories_bp.route("", methods=["POST"])
def create_category():
    """
    Crea una nueva categoría personalizada.

    Body JSON:
    {
        "name": "Nombre de la categoría",
        "description": "Descripción",  // opcional
        "color": "#FF5733",  // opcional, formato hexadecimal
        "icon": "shopping-cart"  // opcional
    }
    """
    try:
        data = request.get_json()

        # Validar campo requerido
        if "name" not in data:
            return jsonify({
                "success": False,
                "error": "Campo requerido: name",
            }), 400

        # Crear categoría
        with get_db_session() as db:
            category = CategoryService.create_category(
                db=db,
                name=data["name"],
                description=data.get("description"),
                color=data.get("color"),
                icon=data.get("icon"),
            )

            return jsonify({
                "success": True,
                "data": category.to_dict(),
                "message": "Categoría creada exitosamente",
            }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@categories_bp.route("/<int:category_id>", methods=["PUT"])
def update_category(category_id: int):
    """
    Actualiza una categoría existente.

    Body JSON: mismos campos que POST, todos opcionales.
    """
    try:
        data = request.get_json()

        # Actualizar categoría
        with get_db_session() as db:
            category = CategoryService.update_category(
                db=db,
                category_id=category_id,
                name=data.get("name"),
                description=data.get("description"),
                color=data.get("color"),
                icon=data.get("icon"),
            )

            if not category:
                return jsonify({
                    "success": False,
                    "error": "Categoría no encontrada",
                }), 404

            return jsonify({
                "success": True,
                "data": category.to_dict(),
                "message": "Categoría actualizada exitosamente",
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
def delete_category(category_id: int):
    """Elimina una categoría."""
    try:
        with get_db_session() as db:
            success = CategoryService.delete_category(db, category_id)

            if not success:
                return jsonify({
                    "success": False,
                    "error": "Categoría no encontrada",
                }), 404

            return jsonify({
                "success": True,
                "message": "Categoría eliminada exitosamente",
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500
