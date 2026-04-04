"""Aplicación principal de Flask."""
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import settings
from app.routers import expenses_bp, categories_bp, income_bp, auth_bp, trips_bp, apple_pay_bp
from app.utils import init_db


def create_app() -> Flask:
    """Crea y configura la aplicación Flask."""
    app = Flask(__name__)

    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["DEBUG"] = settings.DEBUG
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, origins=settings.CORS_ORIGINS)

    app.register_blueprint(expenses_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(income_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(apple_pay_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"success": True, "message": "API funcionando", "version": "1.0.0"}), 200

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({"success": True, "message": "API de Finanzas Personales", "version": "1.0.0"}), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Endpoint no encontrado"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500

    with app.app_context():
        try:
            init_db()
            print("✅ Base de datos inicializada")
        except Exception as e:
            print(f"⚠️  DB no disponible al inicio: {e}")

    print("✅ Aplicación Flask lista")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=settings.DEBUG)