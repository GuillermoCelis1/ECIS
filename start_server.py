#!/usr/bin/env python3
import subprocess
import sys
import os
import time
from database import DatabaseManager

def check_dependencies():
    """Verificar si las dependencias están instaladas"""
    try:
        import flask
        import flask_cors
        print("✅ Dependencias verificadas")
        return True
    except ImportError as e:
        print(f"❌ Falta dependencia: {e}")
        print("Por favor instale las dependencias con:")
        print("pip install -r requirements.txt")
        return False

def initialize_database():
    """Inicializar la base de datos"""
    print("🔧 Inicializando base de datos...")
    db = DatabaseManager()
    print("✅ Base de datos inicializada")

def start_local_server():
    """Iniciar el servidor Flask local"""
    print("🔧 Modo Desarrollo Local")
    print("   Servidor: http://localhost:5000")
    print("   Presiona Ctrl+C para detener")
    print("   API disponible en: http://localhost:5000/api")
    try:
        subprocess.run([sys.executable, 'app.py'])
    except KeyboardInterrupt:
        print("\n🛑 Servidor local detenido")

def show_deployment_info():
    """Mostrar información para producción"""
    print("🚀 Información de Producción")
    print("   Para producción (Render):")
    print("   1. Sube el código a tu repositorio")
    print("   2. Conecta el repositorio a Render")
    print("   3. Render construirá y desplegará automáticamente")
    print("   4. La aplicación estará disponible en la URL de Render")

def main():
    print("🎯 Sistema de Seguimiento Educativo - Cundinamarca")
    print("=" * 50)
    
    # Detectar entorno
    is_render = os.environ.get('RENDER') is not None
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    if is_render or is_production:
        show_deployment_info()
        return
    
    if not check_dependencies():
        sys.exit(1)
    
    initialize_database()
    start_local_server()

if __name__ == "__main__":
    main()
