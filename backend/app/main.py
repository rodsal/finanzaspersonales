"""
Aplicación principal de Flask.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import settings
<<<<<<< Updated upstream
from app.routers import expenses_bp, categories_bp, income_bp
=======
from app.routers import expenses_bp, categories_bp, income_bp, auth_bp, tasks_bp, trips_bp
>>>>>>> Stashed changes
from app.utils import init_db


def create_app() -> Flask:
    """Crea y configura la aplicación Flask."""
    app = Flask(__name__)

    # Configuración
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["DEBUG"] = settings.DEBUG
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Configurar CORS
    CORS(app, origins=settings.CORS_ORIGINS)

    # Registrar blueprints (routers)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(income_bp)
<<<<<<< Updated upstream
=======
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(trips_bp)
>>>>>>> Stashed changes

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Endpoint de health check."""
        return jsonify({
            "success": True,
            "message": "API de Finanzas Personales funcionando correctamente",
            "version": "1.0.0",
        }), 200

    # Endpoint raíz
    @app.route("/", methods=["GET"])
    def root():
        """Endpoint raíz."""
        return jsonify({
            "success": True,
            "message": "API de Finanzas Personales",
            "version": "1.0.0",
            "endpoints": {
                "health": "/api/health",
                "expenses": "/api/expenses",
                "categories": "/api/categories",
                "incomes": "/api/incomes",
            },
        }), 200

    # Manejador de errores 404
    @app.errorhandler(404)
    def not_found(error):
        """Maneja errores 404."""
        return jsonify({
            "success": False,
            "error": "Endpoint no encontrado",
        }), 404

    # Manejador de errores 500
    @app.errorhandler(500)
    def internal_error(error):
        """Maneja errores 500."""
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
        }), 500

    # Inicializar base de datos en el primer request
    with app.app_context():
        init_db()
        print("✅ Aplicación Flask inicializada correctamente")

    return app


# Para desarrollo local
if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=settings.DEBUG,
    )
