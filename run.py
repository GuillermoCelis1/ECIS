#!/usr/bin/env python3
"""
Script de inicio universal para desarrollo y producción
"""

import os
import sys
from app import app

def main():
    # Detectar entorno
    is_render = os.environ.get('RENDER') is not None
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    if is_render or is_production:
        print("🚀 Modo Producción Detectado")
        print("   Usando Gunicorn (Render maneja esto automáticamente)")
        print("   URL de la aplicación:", os.environ.get('RENDER_EXTERNAL_URL', 'No disponible'))
    else:
        print("🔧 Modo Desarrollo Local")
        print("   Iniciando servidor Flask en http://localhost:5000")
        print("   Presiona Ctrl+C para detener")
        app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    main()
