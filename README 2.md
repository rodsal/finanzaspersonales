# Sistema de Finanzas Personales

Sistema completo de gestión de finanzas personales construido con Flask (backend) y React (frontend), con PostgreSQL como base de datos.

## Características

- **Gestión de Gastos**: Registra, edita y elimina gastos de forma sencilla
- **Categorización**: Organiza tus gastos por categorías predefinidas o personalizadas
- **Resumen Visual**: Visualiza tus gastos con gráficos interactivos
- **Análisis por Período**: Revisa tus gastos por mes y año
- **Responsive Design**: Funciona perfectamente en desktop y móvil

## Tecnologías Utilizadas

### Backend
- Python 3.11
- Flask 3.0
- SQLAlchemy (ORM)
- PostgreSQL
- Gunicorn (servidor WSGI)

### Frontend
- React 18
- React Router v6
- Axios (cliente HTTP)
- Recharts (gráficos)
- Tailwind CSS
- React Toastify (notificaciones)

### DevOps
- Docker & Docker Compose
- Nginx (proxy inverso)
- Supervisor (gestión de procesos)

## Estructura del Proyecto

```
finanzaspersonales/
├── backend/                    # API Flask
│   ├── app/
│   │   ├── config/            # Configuración
│   │   ├── models/            # Modelos de BD
│   │   ├── routers/           # Endpoints API
│   │   ├── services/          # Lógica de negocio
│   │   ├── middleware/        # Middlewares
│   │   └── utils/             # Utilidades
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utilidades
│   ├── public/
│   └── package.json
│
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── README.md
```

## Instalación y Uso

### Opción 1: Docker Compose (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <url-del-repo>
cd finanzaspersonales
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

3. **Iniciar con Docker Compose**
```bash
docker-compose up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

### Opción 2: Instalación Manual

#### Backend

1. **Crear entorno virtual**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar la base de datos PostgreSQL**
```bash
# Asegúrate de tener PostgreSQL instalado y ejecutando
createdb finanzas_personales
```

5. **Ejecutar el servidor**
```bash
python -m app.main
```

El backend estará disponible en http://localhost:8000

#### Frontend

1. **Instalar dependencias**
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno**
```bash
# Crear archivo .env en frontend/
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

3. **Iniciar servidor de desarrollo**
```bash
npm start
```

El frontend estará disponible en http://localhost:3000

## API Endpoints

### Gastos

- `GET /api/expenses` - Obtener todos los gastos
- `GET /api/expenses/:id` - Obtener un gasto específico
- `POST /api/expenses` - Crear nuevo gasto
- `PUT /api/expenses/:id` - Actualizar gasto
- `DELETE /api/expenses/:id` - Eliminar gasto
- `GET /api/expenses/summary/category` - Resumen por categoría
- `GET /api/expenses/summary/month` - Resumen por mes
- `GET /api/expenses/total` - Total de gastos

### Categorías

- `GET /api/categories` - Obtener todas las categorías
- `GET /api/categories/:id` - Obtener una categoría específica
- `POST /api/categories` - Crear nueva categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Health Check

- `GET /api/health` - Verificar estado de la API

## Variables de Entorno

### Backend (.env)

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finanzas_personales
CORS_ORIGINS=*
DEFAULT_PAGE_SIZE=50
MAX_PAGE_SIZE=100
TIMEZONE=America/Costa_Rica
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Desarrollo

### Ejecutar Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Linting

```bash
# Backend
cd backend
flake8 app/

# Frontend
cd frontend
npm run lint
```

## Deployment

### Producción con Docker

```bash
# Build de la imagen
docker build -t finanzas-personales .

# Ejecutar contenedor
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e SECRET_KEY=your-secret-key \
  finanzas-personales
```

## Buenas Prácticas Implementadas

- ✅ Arquitectura modular y separación de responsabilidades
- ✅ Validación de datos con Pydantic/SQLAlchemy
- ✅ Manejo centralizado de errores
- ✅ Configuración mediante variables de entorno
- ✅ Type hints en Python
- ✅ Componentes reutilizables en React
- ✅ Custom hooks para lógica compartida
- ✅ Responsive design con Tailwind CSS
- ✅ Dockerización para fácil deployment
- ✅ Proxy inverso con Nginx
- ✅ CORS configurado apropiadamente

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contacto

Tu Nombre - [tu@email.com](mailto:tu@email.com)

Repositorio: [https://github.com/tuusuario/finanzaspersonales](https://github.com/tuusuario/finanzaspersonales)
