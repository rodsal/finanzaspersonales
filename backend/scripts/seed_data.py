"""
Script para poblar la base de datos con datos de prueba.
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Agregar el directorio padre al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils import get_db_session, init_db
from app.services import ExpenseService, CategoryService
from app.models.expense import ExpenseCategoryEnum


def seed_categories():
    """Crea categorías personalizadas de ejemplo."""
    print("🌱 Creando categorías personalizadas...")

    categories_data = [
        {
            "name": "Supermercado",
            "description": "Compras de comestibles y productos del hogar",
            "color": "#10b981",
            "icon": "🛒"
        },
        {
            "name": "Gasolina",
            "description": "Combustible para vehículos",
            "color": "#f59e0b",
            "icon": "⛽"
        },
        {
            "name": "Gimnasio",
            "description": "Membresía y actividades deportivas",
            "color": "#ef4444",
            "icon": "💪"
        },
    ]

    with get_db_session() as db:
        for cat_data in categories_data:
            try:
                CategoryService.create_category(db, **cat_data)
                print(f"  ✓ Categoría creada: {cat_data['name']}")
            except Exception as e:
                print(f"  ✗ Error al crear {cat_data['name']}: {e}")


def seed_expenses():
    """Crea gastos de ejemplo."""
    print("\n💰 Creando gastos de ejemplo...")

    # Lista de gastos de ejemplo
    expenses_data = [
        # Alimentación
        ("Almuerzo en restaurante", 8500, "Alimentación", "Tarjeta de Crédito", "Comida con amigos"),
        ("Supermercado semanal", 35000, "Alimentación", "Tarjeta de Débito", "Compras de la semana"),
        ("Café y pastel", 4500, "Alimentación", "Efectivo", None),
        ("Cena familiar", 22000, "Alimentación", "Tarjeta de Crédito", None),

        # Transporte
        ("Gasolina", 25000, "Transporte", "Efectivo", "Tanque lleno"),
        ("Uber al trabajo", 3500, "Transporte", "Tarjeta de Crédito", None),
        ("Parqueo centro", 2000, "Transporte", "Efectivo", None),

        # Vivienda
        ("Electricidad", 18000, "Servicios", "Transferencia", "Recibo del mes"),
        ("Internet", 15000, "Servicios", "Transferencia", "Plan 100 Mbps"),
        ("Agua", 8000, "Servicios", "Transferencia", None),

        # Salud
        ("Farmacia", 12000, "Salud", "Tarjeta de Débito", "Medicamentos recetados"),
        ("Consulta médica", 35000, "Salud", "Tarjeta de Crédito", "Control mensual"),

        # Entretenimiento
        ("Netflix", 5000, "Entretenimiento", "Tarjeta de Crédito", "Suscripción mensual"),
        ("Cine", 7500, "Entretenimiento", "Efectivo", "Película con la familia"),
        ("Concierto", 25000, "Entretenimiento", "Tarjeta de Crédito", None),

        # Tecnología
        ("Spotify Premium", 4500, "Tecnología", "Tarjeta de Crédito", "Suscripción mensual"),
        ("Cable HDMI", 6500, "Tecnología", "Tarjeta de Débito", None),

        # Educación
        ("Libros técnicos", 35000, "Educación", "Tarjeta de Crédito", "Programación"),
        ("Curso online", 45000, "Educación", "Tarjeta de Crédito", "Udemy"),

        # Ropa
        ("Zapatos deportivos", 45000, "Ropa", "Tarjeta de Crédito", None),
        ("Camisetas", 18000, "Ropa", "Efectivo", None),
    ]

    with get_db_session() as db:
        # Crear gastos en los últimos 60 días
        base_date = datetime.now() - timedelta(days=60)

        for i, (desc, amount, category, payment, notes) in enumerate(expenses_data):
            # Distribuir gastos en los últimos 60 días
            days_offset = random.randint(0, 60)
            expense_date = base_date + timedelta(days=days_offset)

            try:
                ExpenseService.create_expense(
                    db=db,
                    description=desc,
                    amount=amount,
                    category=category,
                    date=expense_date,
                    payment_method=payment,
                    notes=notes,
                )
                print(f"  ✓ Gasto creado: {desc} - ₡{amount:,.0f}")
            except Exception as e:
                print(f"  ✗ Error al crear gasto '{desc}': {e}")


def main():
    """Función principal."""
    print("=" * 60)
    print("  SCRIPT DE DATOS DE PRUEBA - FINANZAS PERSONALES")
    print("=" * 60)

    # Inicializar base de datos
    print("\n📦 Inicializando base de datos...")
    init_db()
    print("  ✓ Base de datos inicializada")

    # Crear datos de prueba
    seed_categories()
    seed_expenses()

    print("\n" + "=" * 60)
    print("  ✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
    print("=" * 60)
    print("\n💡 Ahora puedes iniciar la aplicación y ver los datos de ejemplo")
    print("   Frontend: http://localhost:3000")
    print("   Backend:  http://localhost:8000\n")


if __name__ == "__main__":
    main()
