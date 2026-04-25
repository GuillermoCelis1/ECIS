# 🚀 Despliegue Dual: Local y Producción

## 📋 Resumen

Este sistema está configurado para funcionar tanto en **desarrollo local** como en **producción (Render)** sin conflictos.

---

## 🔧 Desarrollo Local

### Prerrequisitos
```bash
pip install -r requirements.txt
```

### Iniciar Servidor Local
```bash
# Opción 1: Usar el script de inicio
python start_server.py

# Opción 2: Iniciar directamente
python app.py

# Opción 3: Usar el script universal
python run.py
```

### Acceso
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Base de datos**: `educational_tracking.db` (local)

### Características Locales
- ✅ Debug mode activado
- ✅ Recarga automática con cambios
- ✅ Logs detallados en consola
- ✅ CORS simplificado para desarrollo

---

## 🚀 Producción (Render)

### Configuración Automática
La aplicación detecta automáticamente el entorno de Render:

```python
is_production = os.environ.get('RENDER') is not None
```

### Archivos Clave
- **`Procfile`**: Configura Gunicorn para producción
- **`requirements.txt`**: Dependencias de producción
- **`app.py`**: Configuración CORS para producción

### Variables de Entorno (Render)
Render configura automáticamente:
- `RENDER=true`
- `PORT` (puerto dinámico)
- `RENDER_EXTERNAL_URL` (URL pública)

### Características de Producción
- ✅ CORS completo con todos los métodos HTTP
- ✅ Gunicorn como servidor WSGI
- ✅ Manejo de solicitudes OPTIONS
- ✅ Logs de producción

---

## 🔄 Flujo de Trabajo

### Desarrollo
1. Trabaja localmente con `python start_server.py`
2. Prueba todas las funcionalidades
3. Confirma que todo funciona correctamente

### Despliegue
1. Sube cambios a tu repositorio Git
2. Render detecta los cambios automáticamente
3. Render construye y despliega la aplicación
4. La aplicación está disponible en la URL de Render

---

## 🛠️ Configuración Técnica

### CORS por Entorno

**Desarrollo Local:**
```python
CORS(app, resources={r"/*": {"origins": "*"}})
```

**Producción (Render):**
```python
CORS(app, 
     resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}},
     supports_credentials=True)
```

### Endpoints HTTP

Todos los endpoints soportan:
- **GET**: Obtener datos
- **POST**: Crear nuevos registros
- **PUT**: Actualizar registros existentes
- **DELETE**: Eliminar registros
- **OPTIONS**: Preflight CORS

---

## 🐛 Solución de Problemas

### Error 405 Method Not Allowed
```bash
# Verificar que los endpoints estén configurados correctamente
# La aplicación ahora maneja automáticamente los métodos HTTP
```

### Error de Conexión
```bash
# Local: Asegúrate de que el puerto 5000 esté libre
# Producción: Verifica los logs de Render
```

### Problemas de CORS
```bash
# Local: La configuración CORS es automática
# Producción: Verifica que las cabeceras OPTIONS estén configuradas
```

---

## 📁 Estructura de Archivos

```
ECIS/
├── app.py              # Aplicación Flask principal
├── database.py          # Gestión de base de datos SQLite
├── start_server.py      # Script de inicio local
├── run.py             # Script universal de inicio
├── requirements.txt     # Dependencias de producción
├── Procfile           # Configuración de Render
├── .env.example       # Ejemplo de variables de entorno
├── index.html         # Frontend principal
├── app.js            # Lógica del frontend
├── styles.css        # Estilos CSS
└── educational_tracking.db  # Base de datos SQLite
```

---

## 🎯 Resumen de Beneficios

### ✅ Ventajas de esta Configuración
1. **Sin Conflictos**: Mismo código funciona en ambos entornos
2. **Detección Automática**: No requiere configuración manual
3. **Desarrollo Rápido**: Recarga automática local
4. **Producción Robusta**: Gunicorn + CORS completo
5. **Fácil Deploy**: Solo subir a Git/Render
6. **Logs Claros**: Mensajes específicos por entorno

### 🔧 Mantenimiento
- **Local**: `python start_server.py`
- **Producción**: Automático via Render
- **Base de datos**: SQLite persistente en ambos casos

---

## 📞 Soporte

Si tienes problemas:
1. **Local**: Revisa la consola para mensajes de error
2. **Producción**: Revisa los logs de Render
3. **General**: Verifica que todos los archivos estén subidos

¡Listo para usar en ambos entornos! 🎉
