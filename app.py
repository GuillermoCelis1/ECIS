from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import DatabaseManager
import json
import os
from datetime import datetime

app = Flask(__name__)

# Detectar si estamos en producción (Render) o desarrollo local
is_production = os.environ.get('RENDER') is not None

if is_production:
    # Configuración para producción (Render)
    CORS(app, 
         resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}},
         supports_credentials=True)
    print("🚀 Modo Producción (Render) - CORS configurado para producción")
else:
    # Configuración para desarrollo local
    CORS(app, resources={r"/*": {"origins": "*"}})
    print("🔧 Modo Desarrollo Local - CORS configurado para desarrollo")

db = DatabaseManager()

# Servir archivos estáticos (frontend)
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# API Routes para Provincias
@app.route('/api/provinces', methods=['GET', 'POST', 'OPTIONS'])
def handle_provinces():
    if request.method == 'GET':
        return get_provinces()
    elif request.method == 'POST':
        return create_province()
    elif request.method == 'OPTIONS':
        return '', 200

def get_provinces():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM provinces ORDER BY name')
    provinces = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(provinces)

def create_province():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO provinces (name) VALUES (?)
    ''', (data['name'],))
    conn.commit()
    province_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': province_id, 'message': 'Provincia creada exitosamente'}), 201

@app.route('/api/provinces/<int:province_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def handle_province(province_id):
    if request.method == 'PUT':
        return update_province(province_id)
    elif request.method == 'DELETE':
        return delete_province(province_id)
    elif request.method == 'OPTIONS':
        return '', 200

def update_province(province_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE provinces SET name = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (data['name'], province_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Provincia actualizada exitosamente'})

def delete_province(province_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM provinces WHERE id = ?', (province_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Provincia eliminada exitosamente'})

# API Routes para Municipios
@app.route('/api/municipalities', methods=['GET', 'POST', 'OPTIONS'])
def handle_municipalities():
    if request.method == 'GET':
        return get_municipalities()
    elif request.method == 'POST':
        return create_municipality()
    elif request.method == 'OPTIONS':
        return '', 200

def get_municipalities():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, p.name as province_name, l.name as leader_name 
        FROM municipalities m
        LEFT JOIN provinces p ON m.province_id = p.id
        LEFT JOIN leaders l ON m.leader_id = l.id
        ORDER BY m.name
    ''')
    municipalities = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(municipalities)

def create_municipality():
    try:
        data = request.get_json()
        print(f"Datos recibidos para municipio: {data}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Manejar leader_id nulo
        leader_id = data.get('leader_id') if data.get('leader_id') is not None else None
        
        cursor.execute('''
            INSERT INTO municipalities (name, province_id, leader_id) 
            VALUES (?, ?, ?)
        ''', (data['name'], data['province_id'], leader_id))
        conn.commit()
        municipality_id = cursor.lastrowid
        conn.close()
        
        print(f"Municipio creado con ID: {municipality_id}")
        return jsonify({'id': municipality_id, 'message': 'Municipio creado exitosamente'}), 201
    except Exception as e:
        print(f"Error creando municipio: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/municipalities/<int:municipality_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def handle_municipality(municipality_id):
    if request.method == 'PUT':
        return update_municipality(municipality_id)
    elif request.method == 'DELETE':
        return delete_municipality(municipality_id)
    elif request.method == 'OPTIONS':
        return '', 200

def update_municipality(municipality_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE municipalities 
        SET name = ?, province_id = ?, leader_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (data['name'], data['province_id'], data.get('leader_id'), municipality_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Municipio actualizado exitosamente'})

def delete_municipality(municipality_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM municipalities WHERE id = ?', (municipality_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Municipio eliminado exitosamente'})

# API Routes para Líderes
@app.route('/api/leaders', methods=['GET', 'POST', 'OPTIONS'])
def handle_leaders():
    if request.method == 'GET':
        return get_leaders()
    elif request.method == 'POST':
        return create_leader()
    elif request.method == 'OPTIONS':
        return '', 200

def get_leaders():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT l.*, m.name as municipality_name 
        FROM leaders l
        LEFT JOIN municipalities m ON l.municipality_id = m.id
        ORDER BY l.name
    ''')
    leaders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(leaders)

def create_leader():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO leaders (name, contact, municipality_id) 
        VALUES (?, ?, ?)
    ''', (data['name'], data['contact'], data['municipality_id']))
    conn.commit()
    leader_id = cursor.lastrowid
    
    # Actualizar el municipio con el líder asignado
    cursor.execute('''
        UPDATE municipalities SET leader_id = ? WHERE id = ?
    ''', (leader_id, data['municipality_id']))
    conn.commit()
    
    conn.close()
    return jsonify({'id': leader_id, 'message': 'Líder creado exitosamente'}), 201

@app.route('/api/leaders/<int:leader_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def handle_leader(leader_id):
    if request.method == 'PUT':
        return update_leader(leader_id)
    elif request.method == 'DELETE':
        return delete_leader(leader_id)
    elif request.method == 'OPTIONS':
        return '', 200

def update_leader(leader_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE leaders 
        SET name = ?, contact = ?, municipality_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (data['name'], data['contact'], data['municipality_id'], leader_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Líder actualizado exitosamente'})

def delete_leader(leader_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM leaders WHERE id = ?', (leader_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Líder eliminado exitosamente'})

# API Routes para Instituciones
@app.route('/api/institutions', methods=['GET'])
def get_institutions():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, l.name as leader_name 
        FROM institutions i
        LEFT JOIN leaders l ON i.leader_id = l.id
        ORDER BY i.name
    ''')
    institutions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(institutions)

@app.route('/api/institutions', methods=['POST'])
def create_institution():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO institutions (name, leader_id, urban_sedes, rural_sedes, teacher_count) 
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['name'], 
        data['leader_id'], 
        data.get('urban_sedes', 0),
        data.get('rural_sedes', 0),
        data.get('teacher_count', 0)
    ))
    conn.commit()
    institution_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': institution_id, 'message': 'Institución creada exitosamente'}), 201

@app.route('/api/institutions/<int:institution_id>', methods=['PUT'])
def update_institution(institution_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE institutions 
        SET name = ?, leader_id = ?, urban_sedes = ?, rural_sedes = ?, 
            teacher_count = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (
        data['name'], 
        data['leader_id'], 
        data.get('urban_sedes', 0),
        data.get('rural_sedes', 0),
        data.get('teacher_count', 0),
        institution_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Institución actualizada exitosamente'})

@app.route('/api/institutions/<int:institution_id>', methods=['DELETE'])
def delete_institution(institution_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM institutions WHERE id = ?', (institution_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Institución eliminada exitosamente'})

# API Routes para Metas Semanales
@app.route('/api/weekly-goals', methods=['GET'])
def get_weekly_goals():
    leader_id = request.args.get('leader_id')
    week = request.args.get('week')
    month = request.args.get('month')
    year = request.args.get('year')
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT wg.*, l.name as leader_name 
        FROM weekly_goals wg
        LEFT JOIN leaders l ON wg.leader_id = l.id
        WHERE 1=1
    '''
    params = []
    
    if leader_id:
        query += ' AND wg.leader_id = ?'
        params.append(leader_id)
    if week:
        query += ' AND wg.week = ?'
        params.append(week)
    if month:
        query += ' AND wg.month = ?'
        params.append(month)
    if year:
        query += ' AND wg.year = ?'
        params.append(year)
    
    query += ' ORDER BY wg.year DESC, wg.month DESC, wg.week DESC'
    
    cursor.execute(query, params)
    goals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(goals)

@app.route('/api/weekly-goals', methods=['POST'])
def create_weekly_goal():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO weekly_goals (
                leader_id, week, month, year,
                ee_visitadas_goal, ee_visitadas_actual,
                sedes_visitadas_goal, sedes_visitadas_actual,
                reportes_estanteria_goal, reportes_estanteria_actual,
                reportes_salud_goal, reportes_salud_actual,
                analisis_vulnerabilidad_goal, analisis_vulnerabilidad_actual,
                matrices_riesgo_goal, matrices_riesgo_actual,
                diagnostico_salud_goal, diagnostico_salud_actual,
                planes_cuidado_goal, planes_cuidado_actual,
                investigaciones_atel_goal, investigaciones_atel_actual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['leader_id'], data['week'], data['month'], data['year'],
            data['goals']['eeVisitadas'], data['actual']['eeVisitadas'],
            data['goals']['sedesVisitadas'], data['actual']['sedesVisitadas'],
            data['goals']['reportesEstanteria'], data['actual']['reportesEstanteria'],
            data['goals']['reportesSalud'], data['actual']['reportesSalud'],
            data['goals']['analisisVulnerabilidad'], data['actual']['analisisVulnerabilidad'],
            data['goals']['matricesRiesgo'], data['actual']['matricesRiesgo'],
            data['goals']['diagnosticoSalud'], data['actual']['diagnosticoSalud'],
            data['goals']['planesCuidado'], data['actual']['planesCuidado'],
            data['goals']['investigacionesAtel'], data['actual']['investigacionesAtel']
        ))
        conn.commit()
        goal_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': goal_id, 'message': 'Meta semanal creada exitosamente'}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/weekly-goals/<int:goal_id>', methods=['PUT'])
def update_weekly_goal(goal_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE weekly_goals SET
                ee_visitadas_goal = ?, ee_visitadas_actual = ?,
                sedes_visitadas_goal = ?, sedes_visitadas_actual = ?,
                reportes_estanteria_goal = ?, reportes_estanteria_actual = ?,
                reportes_salud_goal = ?, reportes_salud_actual = ?,
                analisis_vulnerabilidad_goal = ?, analisis_vulnerabilidad_actual = ?,
                matrices_riesgo_goal = ?, matrices_riesgo_actual = ?,
                diagnostico_salud_goal = ?, diagnostico_salud_actual = ?,
                planes_cuidado_goal = ?, planes_cuidado_actual = ?,
                investigaciones_atel_goal = ?, investigaciones_atel_actual = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data['goals']['eeVisitadas'], data['actual']['eeVisitadas'],
            data['goals']['sedesVisitadas'], data['actual']['sedesVisitadas'],
            data['goals']['reportesEstanteria'], data['actual']['reportesEstanteria'],
            data['goals']['reportesSalud'], data['actual']['reportesSalud'],
            data['goals']['analisisVulnerabilidad'], data['actual']['analisisVulnerabilidad'],
            data['goals']['matricesRiesgo'], data['actual']['matricesRiesgo'],
            data['goals']['diagnosticoSalud'], data['actual']['diagnosticoSalud'],
            data['goals']['planesCuidado'], data['actual']['planesCuidado'],
            data['goals']['investigacionesAtel'], data['actual']['investigacionesAtel'],
            goal_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Meta semanal actualizada exitosamente'})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/weekly-goals/<int:goal_id>', methods=['DELETE'])
def delete_weekly_goal(goal_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM weekly_goals WHERE id = ?', (goal_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Meta semanal eliminada exitosamente'})

# Endpoint para migración desde localStorage
@app.route('/api/migrate', methods=['POST'])
def migrate_from_localstorage():
    data = request.get_json()
    success = db.migrate_from_localstorage(data)
    if success:
        return jsonify({'message': 'Migración completada exitosamente'})
    else:
        return jsonify({'error': 'Error en la migración'}), 500

# Endpoint para obtener indicadores calculados
@app.route('/api/indicators', methods=['GET'])
def get_indicators():
    province_id = request.args.get('province_id')
    municipality_id = request.args.get('municipality_id')
    leader_id = request.args.get('leader_id')
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            COUNT(DISTINCT i.id) as ee_visitadas,
            SUM(i.urban_sedes + i.rural_sedes) as sedes_visitadas,
            COUNT(DISTINCT i.id) * 2 as reportes_estanteria,
            SUM(i.teacher_count) as reportes_salud,
            SUM(i.urban_sedes + i.rural_sedes) as analisis_vulnerabilidad,
            SUM(i.urban_sedes + i.rural_sedes) as matrices_riesgo,
            SUM(i.teacher_count) as diagnostico_salud,
            SUM(i.teacher_count) as planes_cuidado,
            SUM(i.teacher_count) * 0.1 as investigaciones_atel
        FROM institutions i
        LEFT JOIN leaders l ON i.leader_id = l.id
        LEFT JOIN municipalities m ON l.municipality_id = m.id
        LEFT JOIN provinces p ON m.province_id = p.id
        WHERE 1=1
    '''
    
    params = []
    if province_id:
        query += ' AND p.id = ?'
        params.append(province_id)
    if municipality_id:
        query += ' AND m.id = ?'
        params.append(municipality_id)
    if leader_id:
        query += ' AND l.id = ?'
        params.append(leader_id)
    
    cursor.execute(query, params)
    result = cursor.fetchone()
    indicators = dict(result) if result else {
        'ee_visitadas': 0, 'sedes_visitadas': 0, 'reportes_estanteria': 0,
        'reportes_salud': 0, 'analisis_vulnerabilidad': 0, 'matrices_riesgo': 0,
        'diagnostico_salud': 0, 'planes_cuidado': 0, 'investigaciones_atel': 0
    }
    
    conn.close()
    return jsonify(indicators)

if __name__ == "__main__":
    if is_production:
        # En producción, Render usa Gunicorn, no se ejecuta este bloque
        pass
    else:
        # En desarrollo local, usar Flask development server
        print(" Iniciando servidor local en http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
