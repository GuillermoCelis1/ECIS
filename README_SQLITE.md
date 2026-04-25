# Sistema de Seguimiento Educativo - Base de Datos SQLite

## 🗄️ Arquitectura de Base de Datos

El sistema ahora utiliza **SQLite** como base de datos persistente con un backend **Flask** que proporciona una API REST para el frontend.

## 📋 Estructura de Tablas

### 1. **provinces**
- `id` (PRIMARY KEY)
- `name` (TEXT UNIQUE)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. **municipalities**
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `province_id` (FOREIGN KEY → provinces.id)
- `leader_id` (FOREIGN KEY → leaders.id)
- `created_at`, `updated_at` (TIMESTAMP)

### 3. **leaders**
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `contact` (TEXT)
- `municipality_id` (FOREIGN KEY → municipalities.id)
- `created_at`, `updated_at` (TIMESTAMP)

### 4. **institutions**
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `leader_id` (FOREIGN KEY → leaders.id)
- `urban_sedes` (INTEGER DEFAULT 0)
- `rural_sedes` (INTEGER DEFAULT 0)
- `teacher_count` (INTEGER DEFAULT 0)
- `created_at`, `updated_at` (TIMESTAMP)

### 5. **weekly_goals**
- `id` (PRIMARY KEY)
- `leader_id` (FOREIGN KEY → leaders.id)
- `week`, `month`, `year` (INTEGER)
- Metas y valores reales para todos los indicadores
- `created_at`, `updated_at` (TIMESTAMP)
- UNIQUE(leader_id, week, month, year)

## 🚀 Instalación y Configuración

### 1. **Instalar Dependencias**
```bash
pip install -r requirements.txt
```

### 2. **Inicializar Base de Datos**
```bash
python database.py
```

### 3. **Iniciar Servidor**
```bash
python start_server.py
```

O directamente:
```bash
python app.py
```

## 📡 API REST Endpoints

### Provincias
- `GET /api/provinces` - Obtener todas las provincias
- `POST /api/provinces` - Crear provincia
- `PUT /api/provinces/<id>` - Actualizar provincia
- `DELETE /api/provinces/<id>` - Eliminar provincia

### Municipios
- `GET /api/municipalities` - Obtener todos los municipios
- `POST /api/municipalities` - Crear municipio
- `PUT /api/municipalities/<id>` - Actualizar municipio
- `DELETE /api/municipalities/<id>` - Eliminar municipio

### Líderes
- `GET /api/leaders` - Obtener todos los líderes
- `POST /api/leaders` - Crear líder
- `PUT /api/leaders/<id>` - Actualizar líder
- `DELETE /api/leaders/<id>` - Eliminar líder

### Instituciones
- `GET /api/institutions` - Obtener todas las instituciones
- `POST /api/institutions` - Crear institución
- `PUT /api/institutions/<id>` - Actualizar institución
- `DELETE /api/institutions/<id>` - Eliminar institución

### Metas Semanales
- `GET /api/weekly-goals` - Obtener metas (con filtros opcionales)
- `POST /api/weekly-goals` - Crear meta semanal
- `PUT /api/weekly-goals/<id>` - Actualizar meta semanal
- `DELETE /api/weekly-goals/<id>` - Eliminar meta semanal

### Indicadores
- `GET /api/indicators` - Obtener indicadores calculados (con filtros)

### Migración
- `POST /api/migrate` - Migrar datos desde localStorage

## 🔄 Migración Automática

El sistema detecta automáticamente si hay datos en localStorage y los migra a SQLite:

1. **Al iniciar la aplicación**, verifica si existen datos en localStorage
2. **Si hay datos**, los envía a la API para migración
3. **Una vez migrados**, limpia el localStorage
4. **Todos los datos** quedan persistentes en SQLite

## 🌐 Arquitectura Cliente-Servidor

```
Frontend (JavaScript) ←→ API REST (Flask) ←→ Base de Datos (SQLite)
       ↓                    ↓                    ↓
   Interfaz           Endpoints HTTP        Archivo .db
   Usuario             CRUD Operations      Persistencia
```

## 🔧 Características Técnicas

### Backend Flask
- **CORS habilitado** para comunicación con frontend
- **Manejo de errores** con respuestas HTTP apropiadas
- **Validación de datos** en endpoints
- **Relaciones FK** con integridad referencial

### Base de Datos SQLite
- **Archivo único**: `educational_tracking.db`
- **Índices optimizados** para consultas rápidas
- **Timestamps** automáticos para auditoría
- **Restricciones UNIQUE** para evitar duplicados

### Frontend Actualizado
- **APIManager** clase para comunicación HTTP
- **Métodos asíncronos** para todas las operaciones
- **Cache local** para mejorar rendimiento
- **Manejo de errores** con retroalimentación al usuario

## 📊 Flujo de Datos

1. **Usuario interactúa** con la interfaz web
2. **Frontend envía** solicitudes a la API REST
3. **Flask procesa** la solicitud y consulta SQLite
4. **SQLite devuelve** los datos solicitados
5. **Flask responde** con JSON al frontend
6. **Frontend actualiza** la interfaz con los datos

## 🛠️ Mantenimiento

### Backup de Base de Datos
```bash
cp educational_tracking.db backup_$(date +%Y%m%d).db
```

### Consultas Directas (si es necesario)
```bash
sqlite3 educational_tracking.db
.tables
SELECT * FROM provinces;
```

### Logs del Servidor
Los errores y actividades se registran en la consola del servidor Flask.

## 🔒 Consideraciones de Seguridad

- **CORS configurado** para permitir solo dominios específicos
- **Validación de entrada** en todos los endpoints
- **SQL Injection prevenido** con parámetros query
- **Errores controlados** sin exponer información sensible

## 📈 Beneficios de SQLite

✅ **Persistencia real** - Los datos no se pierden al cerrar navegador  
✅ **Multiusuario** - Varios usuarios pueden acceder simultáneamente  
✅ **Backup fácil** - Solo copiar el archivo .db  
✅ **Rendimiento** - Consultas optimizadas con índices  
✅ **Escalabilidad** - Soporta grandes volúmenes de datos  
✅ **Integridad** - Transacciones ACID y restricciones FK  

## 🚀 Próximos Pasos

1. **Iniciar el servidor** con `python start_server.py`
2. **Abrir el navegador** en `http://localhost:5000`
3. **Los datos existentes** se migrarán automáticamente
4. **Comenzar a usar** la aplicación con base de datos persistente

¡Listo para usar con base de datos SQLite! 🎉
