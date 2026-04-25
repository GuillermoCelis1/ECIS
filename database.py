import sqlite3
import os
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_path='educational_tracking.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Inicializar la base de datos con todas las tablas"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tabla de Provincias
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS provinces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla de Municipios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS municipalities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                province_id INTEGER NOT NULL,
                leader_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (province_id) REFERENCES provinces (id),
                FOREIGN KEY (leader_id) REFERENCES leaders (id)
            )
        ''')
        
        # Tabla de Líderes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS leaders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                municipality_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (municipality_id) REFERENCES municipalities (id)
            )
        ''')
        
        # Tabla de Instituciones Educativas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS institutions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                leader_id INTEGER NOT NULL,
                urban_sedes INTEGER DEFAULT 0,
                rural_sedes INTEGER DEFAULT 0,
                teacher_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (leader_id) REFERENCES leaders (id)
            )
        ''')
        
        # Tabla de Metas Semanales
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS weekly_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                leader_id INTEGER NOT NULL,
                week INTEGER NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                ee_visitadas_goal INTEGER DEFAULT 0,
                ee_visitadas_actual INTEGER DEFAULT 0,
                sedes_visitadas_goal INTEGER DEFAULT 0,
                sedes_visitadas_actual INTEGER DEFAULT 0,
                reportes_estanteria_goal INTEGER DEFAULT 0,
                reportes_estanteria_actual INTEGER DEFAULT 0,
                reportes_salud_goal INTEGER DEFAULT 0,
                reportes_salud_actual INTEGER DEFAULT 0,
                analisis_vulnerabilidad_goal INTEGER DEFAULT 0,
                analisis_vulnerabilidad_actual INTEGER DEFAULT 0,
                matrices_riesgo_goal INTEGER DEFAULT 0,
                matrices_riesgo_actual INTEGER DEFAULT 0,
                diagnostico_salud_goal INTEGER DEFAULT 0,
                diagnostico_salud_actual INTEGER DEFAULT 0,
                planes_cuidado_goal INTEGER DEFAULT 0,
                planes_cuidado_actual INTEGER DEFAULT 0,
                investigaciones_atel_goal INTEGER DEFAULT 0,
                investigaciones_atel_actual INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (leader_id) REFERENCES leaders (id),
                UNIQUE(leader_id, week, month, year)
            )
        ''')
        
        # Crear índices para mejor rendimiento
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_municipalities_province ON municipalities (province_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_leaders_municipality ON leaders (municipality_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_institutions_leader ON institutions (leader_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_weekly_goals_leader_week ON weekly_goals (leader_id, week, month, year)')
        
        conn.commit()
        conn.close()
        print(f"Base de datos inicializada en {self.db_path}")
    
    def get_connection(self):
        """Obtener conexión a la base de datos"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Para acceder a las columnas por nombre
        return conn
    
    def migrate_from_localstorage(self, data):
        """Migrar datos desde localStorage (formato JSON) a SQLite"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Migrar Provincias
            if 'provinces' in data:
                for province in data['provinces']:
                    cursor.execute('''
                        INSERT OR REPLACE INTO provinces (id, name) 
                        VALUES (?, ?)
                    ''', (province['id'], province['name']))
            
            # Migrar Municipios
            if 'municipalities' in data:
                for municipality in data['municipalities']:
                    cursor.execute('''
                        INSERT OR REPLACE INTO municipalities 
                        (id, name, province_id, leader_id) 
                        VALUES (?, ?, ?, ?)
                    ''', (
                        municipality['id'], 
                        municipality['name'], 
                        municipality['province_id'],
                        municipality.get('leader_id')
                    ))
            
            # Migrar Líderes
            if 'leaders' in data:
                for leader in data['leaders']:
                    cursor.execute('''
                        INSERT OR REPLACE INTO leaders 
                        (id, name, contact, municipality_id) 
                        VALUES (?, ?, ?, ?)
                    ''', (
                        leader['id'], 
                        leader['name'], 
                        leader['contact'], 
                        leader['municipality_id']
                    ))
            
            # Migrar Instituciones
            if 'institutions' in data:
                for institution in data['institutions']:
                    cursor.execute('''
                        INSERT OR REPLACE INTO institutions 
                        (id, name, leader_id, urban_sedes, rural_sedes, teacher_count) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        institution['id'], 
                        institution['name'], 
                        institution['leader_id'],
                        institution['urbanSedes'],
                        institution['ruralSedes'],
                        institution['teacherCount']
                    ))
            
            # Migrar Metas Semanales
            if 'weeklyTracking' in data:
                for leader_key, leader_data in data['weeklyTracking'].items():
                    leader_id = int(leader_key.split('_')[1])  # Extraer ID del líder
                    for week_key, week_data in leader_data.items():
                        # Parsear week_key: "week_X_Y_Z" donde X=week, Y=month, Z=year
                        parts = week_key.split('_')
                        week = int(parts[1])
                        month = int(parts[2])
                        year = int(parts[3])
                        
                        cursor.execute('''
                            INSERT OR REPLACE INTO weekly_goals
                            (leader_id, week, month, year,
                             ee_visitadas_goal, ee_visitadas_actual,
                             sedes_visitadas_goal, sedes_visitadas_actual,
                             reportes_estanteria_goal, reportes_estanteria_actual,
                             reportes_salud_goal, reportes_salud_actual,
                             analisis_vulnerabilidad_goal, analisis_vulnerabilidad_actual,
                             matrices_riesgo_goal, matrices_riesgo_actual,
                             diagnostico_salud_goal, diagnostico_salud_actual,
                             planes_cuidado_goal, planes_cuidado_actual,
                             investigaciones_atel_goal, investigaciones_atel_actual)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            leader_id, week, month, year,
                            week_data['goals'].get('eeVisitadas', 0),
                            week_data['actual'].get('eeVisitadas', 0),
                            week_data['goals'].get('sedesVisitadas', 0),
                            week_data['actual'].get('sedesVisitadas', 0),
                            week_data['goals'].get('reportesEstanteria', 0),
                            week_data['actual'].get('reportesEstanteria', 0),
                            week_data['goals'].get('reportesSalud', 0),
                            week_data['actual'].get('reportesSalud', 0),
                            week_data['goals'].get('analisisVulnerabilidad', 0),
                            week_data['actual'].get('analisisVulnerabilidad', 0),
                            week_data['goals'].get('matricesRiesgo', 0),
                            week_data['actual'].get('matricesRiesgo', 0),
                            week_data['goals'].get('diagnosticoSalud', 0),
                            week_data['actual'].get('diagnosticoSalud', 0),
                            week_data['goals'].get('planesCuidado', 0),
                            week_data['actual'].get('planesCuidado', 0),
                            week_data['goals'].get('investigacionesAtel', 0),
                            week_data['actual'].get('investigacionesAtel', 0)
                        ))
            
            conn.commit()
            print("Migración completada exitosamente")
            return True
            
        except Exception as e:
            print(f"Error en migración: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

# Función para inicializar la base de datos
if __name__ == "__main__":
    db = DatabaseManager()
    print("Base de datos creada exitosamente")
