# Guía de Instalación Rápida

## Requisitos Previos

- Docker y Docker Compose (Opción 1) **O**
- Python 3.11+, PostgreSQL 15+, Node.js 18+ (Opción 2)

## Opción 1: Docker Compose (Más fácil)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd finanzaspersonales

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env

# 3. Iniciar servicios
docker-compose up -d

# 4. Verificar que todo esté funcionando
docker-compose ps

# 5. Ver logs
docker-compose logs -f

# Acceder a:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - Base de datos: localhost:5432
```

### Comandos útiles de Docker Compose

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Acceder a la base de datos
docker-compose exec db psql -U postgres -d finanzas_personales

# Eliminar todo (incluyendo volúmenes)
docker-compose down -v
```

## Opción 2: Instalación Manual

### 1. Backend (Flask)

```bash
# Crear entorno virtual
cd backend
python -m venv venv

# Activar entorno virtual
# En macOS/Linux:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Crear base de datos en PostgreSQL
createdb finanzas_personales

# Ejecutar servidor
python -m app.main
```

### 2. Frontend (React)

```bash
# Instalar dependencias
cd frontend
npm install

# Configurar variables de entorno
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# Ejecutar servidor de desarrollo
npm start
```

## Verificar Instalación

1. **Backend**: Abre http://localhost:8000/api/health
   - Deberías ver: `{"success": true, "message": "API de Finanzas Personales funcionando correctamente"}`

2. **Frontend**: Abre http://localhost:3000
   - Deberías ver la página de inicio del sistema

3. **Base de datos**:
```bash
# Con Docker
docker-compose exec db psql -U postgres -d finanzas_personales -c "SELECT version();"

# Manual
psql -U postgres -d finanzas_personales -c "SELECT version();"
```

## Solución de Problemas

### Backend no inicia

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps db
# o
pg_isready

# Verificar variables de entorno
cat backend/.env

# Ver logs detallados
docker-compose logs backend
```

### Frontend no carga

```bash
# Limpiar caché de npm
cd frontend
rm -rf node_modules package-lock.json
npm install

# Verificar que el backend esté corriendo
curl http://localhost:8000/api/health
```

### Base de datos no conecta

```bash
# Verificar conexión a PostgreSQL
docker-compose exec db pg_isready -U postgres

# Reiniciar servicio de base de datos
docker-compose restart db

# Ver logs de la base de datos
docker-compose logs db
```

### Error de CORS

Asegúrate de que en `backend/.env` tengas:
```
CORS_ORIGINS=*
```

O específicamente:
```
CORS_ORIGINS=http://localhost:3000
```

## Datos de Prueba (Opcional)

Para probar el sistema con datos de ejemplo:

```bash
# Ejecutar script de datos de prueba
cd backend
python scripts/seed_data.py
```

## Siguiente Paso

Una vez instalado, consulta el [README.md](README.md) para conocer todas las funcionalidades y la documentación completa de la API.
