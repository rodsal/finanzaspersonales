# ========== Stage 1: Build Frontend ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ========== Stage 2: Final (Python + nginx) ==========
FROM python:3.11-slim

WORKDIR /app

# Instalar nginx y supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ ./

# Copiar build del frontend a nginx
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Copiar configuraciones
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]