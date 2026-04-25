#!/usr/bin/env python3
import subprocess
import sys
import time
from database import DatabaseManager

def check_dependencies():
    """Verificar si las dependencias están instaladas"""
    try:
        import flask
        import flask_cors
        print("✅ Dependencias encontradas")
        return True
    except ImportError as e:
        print(f"❌ Falta dependencia: {e}")
        print("Instalando dependencias...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Dependencias instaladas")
            return True
        except subprocess.CalledProcessError:
            print("❌ Error instalando dependencias")
            return False

def initialize_database():
    """Inicializar la base de datos"""
    print("🔧 Inicializando base de datos...")
    try:
        db = DatabaseManager()
        print("✅ Base de datos inicializada")
        return True
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")
        return False

def start_server():
    """Iniciar el servidor Flask"""
    print("🚀 Iniciando servidor Flask...")
    try:
        from app import app
        app.run(debug=False, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")

def main():
    print("🎯 Sistema de Seguimiento Educativo - Cundinamarca")
    print("=" * 50)
    
    # Verificar dependencias
    if not check_dependencies():
        return
    
    # Inicializar base de datos
    if not initialize_database():
        return
    
    # Iniciar servidor
    start_server()

if __name__ == "__main__":
    main()
