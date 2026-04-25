#!/bin/bash

echo "🔧 Construyendo aplicación para producción..."

# Inicializar base de datos si no existe
if [ ! -f "educational_tracking.db" ]; then
    echo "📦 Creando base de datos..."
    python -c "from database import DatabaseManager; db = DatabaseManager(); print('✅ Base de datos creada')"
else
    echo "✅ Base de datos ya existe"
fi

echo "🚀 Construcción completada"
