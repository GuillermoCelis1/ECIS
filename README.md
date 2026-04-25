# Sistema de Seguimiento Educativo - Cundinamarca

Aplicación web para el seguimiento de indicadores educativos en el departamento de Cundinamarca.

## Características

### Gestión Territorial
- **Provincias**: Registro y gestión de provincias de Cundinamarca
- **Municipios**: Administración de municipios por provincia
- **Líderes**: Asignación de líderes de equipo por municipio
- **Instituciones Educativas**: Gestión de establecimientos educativos con sedes urbanas y rurales

### Indicadores Educativos
La aplicación calcula automáticamente los siguientes indicadores:

1. **EE VISITADAS**: Cantidad de instituciones educativas
2. **NO. SEDES VISITAS**: Suma total de sedes (urbanas + rurales)
3. **CANT. REPORTES DE ESTANTADERES MINIMOS**: Instituciones × 2
4. **CANTIDAD DE REPORTES DE CONDICIONES DE SALUD**: Cantidad de docentes
5. **CAN. ANALISIS DE VULNERAVILIDAD**: Cantidad de sedes
6. **CANT. MATRICEZ DE IDENTIFICACION DE PELIGRO Y VALORACION DE RIESGO**: Cantidad de sedes
7. **CANT. DIAGNOSTICO DE CONDICIONES DE SALUD**: Cantidad de docentes
8. **PLANES PARA EL CUIDADO INTEGRAL DE LA SALUD**: Cantidad de docentes
9. **CANT. INVESTIGACION ATEL**: Docentes × 10%

### Visualización de Datos
- Dashboard principal con estadísticas generales
- Gráficos de barras para indicadores generales
- Gráficos de tipo radar para análisis detallado
- Gráficos de dona para distribución por provincia
- Filtros por provincia, municipio y líder
- Tablas detalladas con progreso de indicadores

## Instalación y Uso

1. **Requisitos**: Navegador web moderno con soporte JavaScript
2. **Instalación**: Simplemente abrir el archivo `index.html` en el navegador
3. **Datos**: La aplicación utiliza localStorage para persistencia de datos

## Estructura del Proyecto

```
d:/ECIS/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── app.js             # Lógica JavaScript
└── README.md          # Documentación
```

## Uso de la Aplicación

### Navegación
- **Dashboard**: Vista general con estadísticas y gráficos
- **Provincias**: Gestión de provincias
- **Municipios**: Administración de municipios
- **Líderes**: Gestión de líderes de equipo
- **Instituciones**: Registro de establecimientos educativos
- **Indicadores**: Análisis detallado con filtros

### Funcionalidades Principales

1. **Agregar Datos**: Utilice los botones "Nuevo" para agregar registros
2. **Filtrar Indicadores**: Seleccione provincia, municipio o líder para ver indicadores específicos
3. **Visualizar Gráficos**: Los gráficos se actualizan automáticamente según los datos
4. **Exportar Datos**: Los datos se almacenan localmente en el navegador

## Datos Iniciales

La aplicación incluye datos de ejemplo para facilitar la demostración:

- **Provincias**: Sabana Centro, Gualivá, Rionegro, Soacha, Tequendama
- **Municipios**: Zipaquirá, Chía, Cajicá, Tabio, Tenjo
- **Líderes**: Carlos Rodríguez, María González
- **Instituciones**: Instituciones educativas de ejemplo con sedes y docentes

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con Bootstrap 5
- **JavaScript ES6+**: Lógica de la aplicación
- **Chart.js**: Biblioteca para gráficos
- **Bootstrap Icons**: Iconos del sistema
- **LocalStorage**: Almacenamiento persistente en navegador

## Características Técnicas

- **Responsive Design**: Adaptable a dispositivos móviles
- **Base de Datos Local**: Persistencia con localStorage
- **Gráficos Interactivos**: Visualización dinámica con Chart.js
- **Filtros Dinámicos**: Actualización en tiempo real
- **Interfaz Moderna**: Diseño limpio y profesional

## Indicadores en Detalle

### Fórmulas de Cálculo

| Indicador | Fórmula | Fuente de Datos |
|-----------|---------|-----------------|
| EE VISITADAS | Cantidad de Instituciones | Total de instituciones |
| SEDES VISITAS | Sedes Urbanas + Rurales | Suma de sedes |
| REPORTES DE ESTÁNDARES | Instituciones × 2 | Total de instituciones |
| REPORTES SALUD | Cantidad de Docentes | Total de docentes |
| ANÁLISIS VULNERABILIDAD | Cantidad de Sedes | Total de sedes |
| MATRICES RIESGO | Cantidad de Sedes | Total de sedes |
| DIAGNÓSTICO SALUD | Cantidad de Docentes | Total de docentes |
| PLANES CUIDADO | Cantidad de Docentes | Total de docentes |
| INVESTIGACIONES ATEL | Docentes × 10% | 10% del total de docentes |

## Extensiones Futuras

- Exportación a PDF/Excel
- Sincronización con base de datos remota
- Módulo de reportes avanzados
- Autenticación de usuarios
- Historial de cambios
- Notificaciones automáticas

## Soporte

Para soporte técnico o sugerencias, contacte al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última Actualización**: Abril 2026
