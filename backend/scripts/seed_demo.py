"""
Script para poblar la BD con datos demo realistas (múltiples meses).
Uso: python scripts/seed_demo.py  (desde el directorio backend, con venv activado)
"""
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.database import SessionLocal
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income

# ──────────────────────────────────────────────
# Configuración
# ──────────────────────────────────────────────
USER_EMAIL = "rodsal16@gmail.com"
MONTHS_BACK = 5   # cuántos meses hacia atrás generar datos

# ──────────────────────────────────────────────
# Plantillas de gastos por categoría
# ──────────────────────────────────────────────
EXPENSE_TEMPLATES = [
    # (descripción, monto_base, variación, categoría, método_pago, frecuencia_mensual)
    ("Supermercado semanal",    35000,  8000, "Alimentación",    "Tarjeta de Débito",   4),
    ("Almuerzo restaurante",    8500,   2000, "Alimentación",    "Tarjeta de Crédito",  8),
    ("Café",                   3500,   1000, "Alimentación",    "Efectivo",            10),
    ("Gasolina",               25000,  5000, "Transporte",      "Efectivo",            3),
    ("Uber",                   4000,   1500, "Transporte",      "Tarjeta de Crédito",  5),
    ("Parqueo",                2000,   500,  "Transporte",      "Efectivo",            4),
    ("Electricidad",           18000,  3000, "Servicios",       "Transferencia",       1),
    ("Internet",               15000,  0,    "Servicios",       "Transferencia",       1),
    ("Agua",                   8000,   1500, "Servicios",       "Transferencia",       1),
    ("Netflix",                5000,   0,    "Entretenimiento", "Tarjeta de Crédito",  1),
    ("Spotify",                4500,   0,    "Entretenimiento", "Tarjeta de Crédito",  1),
    ("Cine",                   8000,   2000, "Entretenimiento", "Efectivo",            2),
    ("Farmacia",               12000,  4000, "Salud",           "Tarjeta de Débito",   1),
    ("Gym",                    20000,  0,    "Salud",           "Transferencia",       1),
    ("Ropa",                   25000,  15000,"Ropa",            "Tarjeta de Crédito",  1),
    ("Curso online",           35000,  10000,"Educación",       "Tarjeta de Crédito",  1),
]

# ──────────────────────────────────────────────
# Plantillas de ingresos
# ──────────────────────────────────────────────
INCOME_TEMPLATES = [
    # (descripción, monto, tipo, frecuencia, activo)
    ("Salario principal",  550000, "fixed",    "monthly",   True),
    ("Freelance diseño",   150000, "variable", "monthly",   True),
]

SPORADIC_INCOME = [
    ("Venta de artículo",  45000, "sporadic"),
    ("Bono trimestral",   100000, "one_time"),
    ("Comisión proyecto",  80000, "commission"),
]


def seed():
    db = SessionLocal()
    try:
        # 1. Buscar usuario
        user = db.query(User).filter(User.email == USER_EMAIL).first()
        if not user:
            print(f"❌ Usuario '{USER_EMAIL}' no encontrado. Ejecuta seed_auth.py primero.")
            return
        print(f"✅ Usuario encontrado: {user.name} (ID: {user.id})")

        # 2. Limpiar datos previos del usuario
        deleted_exp = db.query(Expense).filter(Expense.user_id == user.id).delete()
        deleted_inc = db.query(Income).filter(Income.user_id == user.id).delete()
        db.commit()
        print(f"🗑  Eliminados: {deleted_exp} gastos y {deleted_inc} ingresos anteriores")

        # 3. Crear ingresos recurrentes (date = hace MONTHS_BACK meses)
        print("\n💵 Creando ingresos recurrentes...")
        for desc, amount, itype, freq, active in INCOME_TEMPLATES:
            inc = Income(
                user_id=user.id,
                description=desc,
                amount=float(amount),
                income_type=itype,
                frequency=freq,
                date=datetime.now() - timedelta(days=MONTHS_BACK * 30),
                is_active=active,
            )
            db.add(inc)
            print(f"  ✓ {desc}: ₡{amount:,.0f} ({freq})")
        db.commit()

        # 4. Crear ingresos esporádicos distribuidos en los meses
        print("\n💸 Creando ingresos esporádicos...")
        now = datetime.now()
        for month_offset in range(MONTHS_BACK, 0, -1):
            month_date = now - timedelta(days=month_offset * 30)
            # Solo algunos meses tienen ingresos esporádicos
            if random.random() > 0.5:
                template = random.choice(SPORADIC_INCOME)
                desc, base_amount, itype = template
                amount = base_amount + random.randint(-10000, 10000)
                day = random.randint(1, 25)
                income_date = month_date.replace(day=day)
                inc = Income(
                    user_id=user.id,
                    description=desc,
                    amount=float(max(amount, 10000)),
                    income_type=itype,
                    frequency=None,
                    date=income_date,
                    is_active=True,
                )
                db.add(inc)
                print(f"  ✓ {desc}: ₡{amount:,.0f} ({income_date.strftime('%b %Y')})")
        db.commit()

        # 5. Crear gastos mes a mes
        print("\n🧾 Creando gastos por mes...")
        for month_offset in range(MONTHS_BACK, 0, -1):
            month_date = now - timedelta(days=month_offset * 30)
            month_name = month_date.strftime("%B %Y")
            count = 0

            for desc, base_amount, variation, category, payment, freq_per_month in EXPENSE_TEMPLATES:
                for _ in range(freq_per_month):
                    amount = base_amount + random.randint(-variation, variation)
                    day = random.randint(1, 28)
                    expense_date = month_date.replace(day=day)

                    exp = Expense(
                        user_id=user.id,
                        description=desc,
                        amount=float(max(amount, 500)),
                        category=category,
                        date=expense_date,
                        payment_method=payment,
                        notes=None,
                    )
                    db.add(exp)
                    count += 1

            db.commit()
            print(f"  ✓ {month_name}: {count} gastos creados")

        # 6. Gastos del mes actual (hasta hoy)
        print(f"\n📅 Gastos del mes actual...")
        count = 0
        for desc, base_amount, variation, category, payment, freq_per_month in EXPENSE_TEMPLATES:
            # Solo algunos gastos del mes actual (aproximadamente la mitad del mes)
            occurrences = max(1, freq_per_month // 2)
            for _ in range(occurrences):
                amount = base_amount + random.randint(-variation, variation)
                day = random.randint(1, min(now.day, 28))
                expense_date = now.replace(day=day, hour=random.randint(8, 20), minute=random.randint(0, 59))
                exp = Expense(
                    user_id=user.id,
                    description=desc,
                    amount=float(max(amount, 500)),
                    category=category,
                    date=expense_date,
                    payment_method=payment,
                    notes=None,
                )
                db.add(exp)
                count += 1
        db.commit()
        print(f"  ✓ {now.strftime('%B %Y')}: {count} gastos creados")

        # 7. Resumen
        total_exp = db.query(Expense).filter(Expense.user_id == user.id).count()
        total_inc = db.query(Income).filter(Income.user_id == user.id).count()
        print(f"\n{'='*50}")
        print(f"  ✅ SEED COMPLETADO")
        print(f"     Gastos:   {total_exp}")
        print(f"     Ingresos: {total_inc}")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
