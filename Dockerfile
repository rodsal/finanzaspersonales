FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

CMD gunicorn -w 1 -b 0.0.0.0:${PORT:-8000} --timeout 120 --log-level debug --capture-output --error-logfile=- "app.main:create_app()"
