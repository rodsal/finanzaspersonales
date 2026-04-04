#!/bin/sh
# Sustituye PORT_PLACEHOLDER con el $PORT que asigna Railway (default 8080)
PORT=${PORT:-8080}
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/nginx.conf
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf