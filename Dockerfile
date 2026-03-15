# Multi-stage Dockerfile para Finanzas Personales

# ========== Stage 1: Build Frontend ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar archivos de dependencias
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm ci --silent

# Copiar código fuente del frontend
COPY frontend/ ./

# Build de producción
RUN npm run build

# ========== Stage 2: Backend Setup ==========
FROM python:3.11-slim AS backend

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias del backend
COPY backend/requirements.txt ./

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ ./

# ========== Stage 3: Nginx + Application ==========
FROM nginx:alpine

# Instalar Python y dependencias necesarias
RUN apk add --no-cache python3 py3-pip postgresql-client supervisor

WORKDIR /app

# Copiar backend desde stage anterior
COPY --from=backend /app /app
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copiar frontend build
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar configuración de Supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
