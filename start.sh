#!/bin/bash

echo "🚀 Iniciando aplicación en producción..."

# Variables de Render
PORT=${PORT:-5000}
echo "📡 Puerto: $PORT"

# Iniciar con Gunicorn
exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
