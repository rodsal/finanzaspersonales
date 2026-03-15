# Arquitectura del Sistema de Finanzas Personales

## Visión General

Sistema full-stack para gestión de finanzas personales siguiendo las buenas prácticas del proyecto GuiPi, adaptado para Flask + React + PostgreSQL.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                        │
│  - Components (Layout, Expenses, Summary)                │
│  - Pages (Home, Expenses, Summary)                       │
│  - Utils (API client, Constants)                         │
│  - Hooks (Custom hooks)                                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────┐
│              NGINX (Proxy Inverso)                       │
│  - Sirve archivos estáticos (React build)                │
│  - Proxy /api/* → Backend Flask                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                BACKEND (Flask API)                       │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │          Routers (Endpoints)               │         │
│  │  - expenses_bp                             │         │
│  │  - categories_bp                           │         │
│  └────────────┬───────────────────────────────┘         │
│               ↓                                          │
│  ┌────────────────────────────────────────────┐         │
│  │      Services (Lógica de Negocio)          │         │
│  │  - ExpenseService                          │         │
│  │  - CategoryService                         │         │
│  └────────────┬───────────────────────────────┘         │
│               ↓                                          │
│  ┌────────────────────────────────────────────┐         │
│  │      Models (ORM - SQLAlchemy)             │         │
│  │  - Expense                                 │         │
│  │  - ExpenseCategory                         │         │
│  └────────────┬───────────────────────────────┘         │
└───────────────┼──────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - Tablas: expenses, expense_categories                  │
└─────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas Detallada

### Backend (Flask)

```
backend/
├── app/
│   ├── __init__.py              # Exporta create_app
│   ├── main.py                  # Aplicación Flask principal
│   │
│   ├── config/                  # Configuración
│   │   ├── __init__.py
│   │   └── settings.py          # Clase Settings con env vars
│   │
│   ├── models/                  # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   └── expense.py           # Expense, ExpenseCategory
│   │
│   ├── routers/                 # Blueprints (Endpoints)
│   │   ├── __init__.py
│   │   ├── expenses.py          # CRUD de gastos + resúmenes
│   │   └── categories.py        # CRUD de categorías
│   │
│   ├── services/                # Lógica de negocio
│   │   ├── __init__.py
│   │   └── expense_service.py   # ExpenseService, CategoryService
│   │
│   ├── middleware/              # Middlewares (opcional)
│   │   └── __init__.py
│   │
│   └── utils/                   # Utilidades
│       ├── __init__.py
│       └── database.py          # Gestión de DB, sesiones
│
├── scripts/                     # Scripts de utilidad
│   ├── __init__.py
│   └── seed_data.py             # Datos de prueba
│
├── tests/                       # Tests unitarios
│   └── __init__.py
│
├── requirements.txt             # Dependencias Python
├── .env                         # Variables de entorno (local)
└── .env.example                 # Template de variables
```

### Frontend (React)

```
frontend/
├── public/
│   └── index.html               # HTML principal
│
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── layout/
│   │   │   ├── Header.js        # Navegación
│   │   │   └── Footer.js
│   │   │
│   │   ├── expenses/
│   │   │   ├── ExpenseForm.js   # Formulario crear/editar
│   │   │   └── ExpenseList.js   # Lista de gastos
│   │   │
│   │   └── summary/             # (Componentes de gráficos si se modulariza)
│   │
│   ├── pages/                   # Páginas principales
│   │   ├── HomePage.js          # Página de inicio
│   │   ├── ExpensesPage.js      # Gestión de gastos
│   │   └── SummaryPage.js       # Resumen con gráficos
│   │
│   ├── hooks/                   # Custom hooks (opcional)
│   │
│   ├── utils/                   # Utilidades
│   │   ├── api.js               # Cliente Axios + endpoints
│   │   └── constants.js         # Categorías, helpers
│   │
│   ├── App.js                   # Componente raíz + Router
│   ├── App.css                  # Estilos globales custom
│   ├── index.js                 # Entry point React
│   └── index.css                # Tailwind imports
│
├── package.json                 # Dependencias npm
├── tailwind.config.js           # Configuración Tailwind
├── postcss.config.js            # PostCSS config
└── .env                         # Variables de entorno
```

## Flujo de Datos

### 1. Crear un Gasto

```
Usuario completa formulario en ExpenseForm.js
         ↓
onClick → handleSubmit()
         ↓
expensesAPI.create(data) [axios POST]
         ↓
POST /api/expenses (Flask router)
         ↓
expenses_bp.create_expense()
         ↓
ExpenseService.create_expense(db, ...)
         ↓
db.add(expense) → db.commit()
         ↓
PostgreSQL: INSERT INTO expenses
         ↓
← Respuesta JSON con expense creado
         ↓
ExpenseForm → onSuccess() → recarga lista
         ↓
ExpenseList actualizado con nuevo gasto
```

### 2. Ver Resumen por Categoría

```
Usuario navega a /summary
         ↓
SummaryPage.js → useEffect() → loadSummary()
         ↓
expensesAPI.getSummaryByCategory() [axios GET]
         ↓
GET /api/expenses/summary/category
         ↓
expenses_bp.get_summary_by_category()
         ↓
ExpenseService.get_summary_by_category(db, ...)
         ↓
SQL: SELECT category, SUM(amount), COUNT(*), AVG(amount)
     FROM expenses GROUP BY category
         ↓
← Respuesta JSON con array de resúmenes
         ↓
SummaryPage → setSummaryByCategory(data)
         ↓
Recharts renderiza PieChart y BarChart
```

## Patrones de Diseño Implementados

### Backend

1. **Repository Pattern** (Service Layer)
   - Services encapsulan lógica de negocio
   - Separan routers de acceso a datos

2. **Dependency Injection**
   - `get_db_session()` context manager
   - Sesiones de BD inyectadas en servicios

3. **Blueprint Pattern** (Flask)
   - Routers modulares y registrables
   - Prefijos de URL organizados

4. **Configuration Pattern**
   - Centralización de config en `settings.py`
   - Variables de entorno con dotenv

### Frontend

1. **Component Composition**
   - Componentes pequeños y reutilizables
   - Props drilling controlado

2. **Container/Presentational Pattern**
   - Pages (containers) manejan estado
   - Components (presentational) reciben props

3. **Custom Hooks** (preparado para)
   - Lógica reutilizable encapsulada
   - Separación de concerns

4. **API Service Layer**
   - Cliente axios centralizado
   - Endpoints tipados en `api.js`

## Tecnologías y Bibliotecas

### Backend Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Python | 3.11+ | Lenguaje base |
| Flask | 3.0.0 | Framework web |
| SQLAlchemy | 2.0.23 | ORM |
| PostgreSQL | 15+ | Base de datos |
| psycopg2 | 2.9.9 | Driver PostgreSQL |
| python-dotenv | 1.0.0 | Env vars |
| Gunicorn | 21.2.0 | WSGI server |
| Flask-CORS | 4.0.0 | CORS handling |

### Frontend Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 18.2.0 | UI library |
| React Router | 6.20.1 | Routing |
| Axios | 1.6.2 | HTTP client |
| Recharts | 2.10.3 | Gráficos |
| Tailwind CSS | 3.4.0 | Styling |
| date-fns | 3.0.6 | Manejo de fechas |
| React Toastify | 10.0.3 | Notificaciones |

### DevOps Stack

| Tecnología | Propósito |
|-----------|-----------|
| Docker | Containerización |
| Docker Compose | Orquestación multi-container |
| Nginx | Proxy inverso + static files |
| Supervisor | Gestión de procesos |

## Endpoints API

### Gastos (Expenses)

```
GET    /api/expenses                    Lista todos los gastos (paginado)
GET    /api/expenses/:id                Obtiene un gasto específico
POST   /api/expenses                    Crea nuevo gasto
PUT    /api/expenses/:id                Actualiza gasto
DELETE /api/expenses/:id                Elimina gasto
GET    /api/expenses/summary/category   Resumen agrupado por categoría
GET    /api/expenses/summary/month      Resumen agrupado por mes
GET    /api/expenses/total              Total de gastos
```

### Categorías (Categories)

```
GET    /api/categories                  Lista todas las categorías
GET    /api/categories/:id              Obtiene una categoría
POST   /api/categories                  Crea nueva categoría
PUT    /api/categories/:id              Actualiza categoría
DELETE /api/categories/:id              Elimina categoría
```

### Sistema

```
GET    /api/health                      Health check
GET    /                                Info de la API
```

## Modelos de Base de Datos

### Tabla: expenses

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer (PK) | ID único |
| description | String(255) | Descripción del gasto |
| amount | Float | Monto |
| category | String(100) | Nombre de categoría |
| category_id | Integer (FK) | Referencia a categoría personalizada |
| date | DateTime | Fecha del gasto |
| notes | String(500) | Notas adicionales |
| payment_method | String(50) | Método de pago |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Fecha de última actualización |

### Tabla: expense_categories

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer (PK) | ID único |
| name | String(100) | Nombre de categoría |
| description | String(255) | Descripción |
| color | String(7) | Color hex (#RRGGBB) |
| icon | String(50) | Icono/emoji |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Fecha de última actualización |

## Seguridad

### Implementado

- ✅ CORS configurado
- ✅ Validación de datos con SQLAlchemy
- ✅ Variables de entorno para secretos
- ✅ Separación de entornos (dev/prod)

### Por Implementar (Producción)

- ⏳ Autenticación (JWT)
- ⏳ Rate limiting
- ⏳ Input sanitization
- ⏳ HTTPS enforcement
- ⏳ Secrets management (Vault)

## Deployment

### Desarrollo

```bash
# Opción 1: Docker Compose
docker-compose up -d

# Opción 2: Manual
cd backend && python -m app.main
cd frontend && npm start
```

### Producción

```bash
# Build imagen de producción
docker build -t finanzas-personales .

# Run con variables de entorno
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  finanzas-personales
```

## Escalabilidad

### Actual (Monolito)
- Backend + Frontend + DB en containers
- Apropiado para uso personal/pequeño

### Futuras Mejoras
- Separar frontend en CDN (S3 + CloudFront)
- Backend en múltiples instancias (Load Balancer)
- DB: Connection pooling, Read replicas
- Caché: Redis para resúmenes
- Message Queue para procesamiento asíncrono

## Referencias

Este proyecto sigue las buenas prácticas identificadas en el proyecto GuiPi:
- Arquitectura modular y separación de responsabilidades
- Type hints y validación de datos
- Configuración centralizada
- Docker para deployment
- Componentes React organizados
- API RESTful bien estructurada
