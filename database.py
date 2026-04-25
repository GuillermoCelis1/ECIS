import sqlite3
import os
from datetime import datetime

# Render provee DATABASE_URL automáticamente cuando se conecta una BD PostgreSQL.
# Localmente se usa SQLite si no existe esa variable.
_raw_url = os.environ.get('DATABASE_URL', '')
if _raw_url.startswith('postgres://'):          # psycopg2 requiere postgresql://
    _raw_url = _raw_url.replace('postgres://', 'postgresql://', 1)

USE_POSTGRES = bool(_raw_url and 'postgresql' in _raw_url)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras


class DatabaseManager:
    def __init__(self, db_path='educational_tracking.db'):
        self.db_path = db_path
        self.use_postgres = USE_POSTGRES
        self.db_url = _raw_url
        self.init_database()

    # ── Conexión ──────────────────────────────────────────────────────────────

    def get_connection(self):
        if self.use_postgres:
            conn = psycopg2.connect(
                self.db_url,
                cursor_factory=psycopg2.extras.RealDictCursor
            )
            conn.autocommit = False
            return conn
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # ── Helpers SQL ───────────────────────────────────────────────────────────

    def q(self, sql):
        """Convierte placeholders ? a %s para PostgreSQL."""
        if self.use_postgres:
            return sql.replace('?', '%s')
        return sql

    def insert(self, cursor, sql, params):
        """Ejecuta un INSERT y devuelve el id del nuevo registro."""
        if self.use_postgres:
            cursor.execute(self.q(sql.rstrip()) + ' RETURNING id', params)
            row = cursor.fetchone()
            return row['id']
        cursor.execute(sql, params)
        return cursor.lastrowid

    # ── Esquema ───────────────────────────────────────────────────────────────

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        pk = 'SERIAL PRIMARY KEY' if self.use_postgres else 'INTEGER PRIMARY KEY AUTOINCREMENT'

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS provinces (
                id {pk},
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS municipalities (
                id {pk},
                name TEXT NOT NULL,
                province_id INTEGER NOT NULL,
                leader_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS leaders (
                id {pk},
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                municipality_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS institutions (
                id {pk},
                name TEXT NOT NULL,
                leader_id INTEGER NOT NULL,
                urban_sedes INTEGER DEFAULT 0,
                rural_sedes INTEGER DEFAULT 0,
                teacher_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS weekly_goals (
                id {pk},
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
                UNIQUE(leader_id, week, month, year)
            )
        ''')

        for idx_sql in [
            'CREATE INDEX IF NOT EXISTS idx_municipalities_province ON municipalities (province_id)',
            'CREATE INDEX IF NOT EXISTS idx_leaders_municipality ON leaders (municipality_id)',
            'CREATE INDEX IF NOT EXISTS idx_institutions_leader ON institutions (leader_id)',
            'CREATE INDEX IF NOT EXISTS idx_weekly_goals_leader_week ON weekly_goals (leader_id, week, month, year)',
        ]:
            cursor.execute(idx_sql)

        conn.commit()
        conn.close()
        db_type = 'PostgreSQL' if self.use_postgres else 'SQLite'
        print(f"Base de datos inicializada ({db_type})")

    # ── Migración desde localStorage ──────────────────────────────────────────

    def _upsert(self, cursor, table, id_val, cols, vals):
        """INSERT OR REPLACE (SQLite) / INSERT … ON CONFLICT DO UPDATE (PG)."""
        col_list = ', '.join(cols)
        placeholders = ', '.join(['?'] * len(cols))
        if self.use_postgres:
            update_set = ', '.join(
                f"{c} = EXCLUDED.{c}" for c in cols if c != 'id'
            )
            sql = (
                f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) "
                f"ON CONFLICT (id) DO UPDATE SET {update_set}"
            )
            cursor.execute(self.q(sql), vals)
        else:
            sql = f"INSERT OR REPLACE INTO {table} ({col_list}) VALUES ({placeholders})"
            cursor.execute(sql, vals)

    def migrate_from_localstorage(self, data):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if 'provinces' in data:
                for p in data['provinces']:
                    self._upsert(cursor, 'provinces', p['id'],
                                 ['id', 'name'], (p['id'], p['name']))

            if 'municipalities' in data:
                for m in data['municipalities']:
                    self._upsert(cursor, 'municipalities', m['id'],
                                 ['id', 'name', 'province_id', 'leader_id'],
                                 (m['id'], m['name'], m['province_id'], m.get('leader_id')))

            if 'leaders' in data:
                for l in data['leaders']:
                    self._upsert(cursor, 'leaders', l['id'],
                                 ['id', 'name', 'contact', 'municipality_id'],
                                 (l['id'], l['name'], l['contact'], l['municipality_id']))

            if 'institutions' in data:
                for i in data['institutions']:
                    self._upsert(cursor, 'institutions', i['id'],
                                 ['id', 'name', 'leader_id', 'urban_sedes', 'rural_sedes', 'teacher_count'],
                                 (i['id'], i['name'], i['leader_id'],
                                  i['urbanSedes'], i['ruralSedes'], i['teacherCount']))

            if 'weeklyTracking' in data:
                for leader_key, leader_data in data['weeklyTracking'].items():
                    leader_id = int(leader_key.split('_')[1])
                    for week_key, week_data in leader_data.items():
                        parts = week_key.split('_')
                        week  = int(parts[1])
                        month = int(parts[2])
                        year  = int(parts[3])
                        g = week_data.get('goals', {})
                        a = week_data.get('actual', {})
                        vals = (
                            leader_id, week, month, year,
                            g.get('eeVisitadas', 0),           a.get('eeVisitadas', 0),
                            g.get('sedesVisitadas', 0),        a.get('sedesVisitadas', 0),
                            g.get('reportesEstanteria', 0),    a.get('reportesEstanteria', 0),
                            g.get('reportesSalud', 0),         a.get('reportesSalud', 0),
                            g.get('analisisVulnerabilidad', 0),a.get('analisisVulnerabilidad', 0),
                            g.get('matricesRiesgo', 0),        a.get('matricesRiesgo', 0),
                            g.get('diagnosticoSalud', 0),      a.get('diagnosticoSalud', 0),
                            g.get('planesCuidado', 0),         a.get('planesCuidado', 0),
                            g.get('investigacionesAtel', 0),   a.get('investigacionesAtel', 0),
                        )
                        cols = [
                            'leader_id', 'week', 'month', 'year',
                            'ee_visitadas_goal', 'ee_visitadas_actual',
                            'sedes_visitadas_goal', 'sedes_visitadas_actual',
                            'reportes_estanteria_goal', 'reportes_estanteria_actual',
                            'reportes_salud_goal', 'reportes_salud_actual',
                            'analisis_vulnerabilidad_goal', 'analisis_vulnerabilidad_actual',
                            'matrices_riesgo_goal', 'matrices_riesgo_actual',
                            'diagnostico_salud_goal', 'diagnostico_salud_actual',
                            'planes_cuidado_goal', 'planes_cuidado_actual',
                            'investigaciones_atel_goal', 'investigaciones_atel_actual',
                        ]
                        if self.use_postgres:
                            placeholders = ', '.join(['%s'] * len(cols))
                            col_list = ', '.join(cols)
                            update_set = ', '.join(
                                f"{c} = EXCLUDED.{c}" for c in cols
                                if c not in ('leader_id', 'week', 'month', 'year')
                            )
                            sql = (
                                f"INSERT INTO weekly_goals ({col_list}) VALUES ({placeholders}) "
                                f"ON CONFLICT (leader_id, week, month, year) DO UPDATE SET {update_set}"
                            )
                            cursor.execute(sql, vals)
                        else:
                            placeholders = ', '.join(['?'] * len(cols))
                            col_list = ', '.join(cols)
                            cursor.execute(
                                f"INSERT OR REPLACE INTO weekly_goals ({col_list}) VALUES ({placeholders})",
                                vals
                            )

            conn.commit()
            print("Migración completada exitosamente")
            return True

        except Exception as e:
            print(f"Error en migración: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()


if __name__ == "__main__":
    db = DatabaseManager()
    print("Base de datos creada exitosamente")
