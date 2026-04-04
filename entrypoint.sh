#!/bin/sh
set -e

PORT=${PORT:-8080}

echo "==> Starting on PORT=$PORT"

# Generar nginx.conf con el puerto correcto
cat > /etc/nginx/nginx.conf << NGINX
events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    server {
        listen ${PORT};
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        client_max_body_size 10M;

        location /api/ {
            proxy_pass http://127.0.0.1:8000/api/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_read_timeout 120s;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location / {
            try_files \$uri \$uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
NGINX

echo "==> Starting gunicorn on port 8000"
cd /app
gunicorn -w 2 -b 127.0.0.1:8000 --timeout 120 --log-level info "app.main:create_app()" &

echo "==> Waiting for gunicorn..."
sleep 4

echo "==> Starting nginx on port $PORT"
exec nginx -g "daemon off;"