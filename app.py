from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import DatabaseManager
import os

app = Flask(__name__)
CORS(app)
db = DatabaseManager()

# ── Archivos estáticos ────────────────────────────────────────────────────────

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# ── Provincias ────────────────────────────────────────────────────────────────

@app.route('/api/provinces', methods=['GET'])
def get_provinces():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM provinces ORDER BY name')
    provinces = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(provinces)

@app.route('/api/provinces', methods=['POST'])
def create_province():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    province_id = db.insert(cursor,
        'INSERT INTO provinces (name) VALUES (?)',
        (data['name'],))
    conn.commit()
    conn.close()
    return jsonify({'id': province_id, 'message': 'Provincia creada exitosamente'}), 201

@app.route('/api/provinces/<int:province_id>', methods=['PUT'])
def update_province(province_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('''
        UPDATE provinces SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    '''), (data['name'], province_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Provincia actualizada exitosamente'})

@app.route('/api/provinces/<int:province_id>', methods=['DELETE'])
def delete_province(province_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('DELETE FROM provinces WHERE id = ?'), (province_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Provincia eliminada exitosamente'})

# ── Municipios ────────────────────────────────────────────────────────────────

@app.route('/api/municipalities', methods=['GET'])
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

@app.route('/api/municipalities', methods=['POST'])
def create_municipality():
    try:
        data = request.get_json()
        conn = db.get_connection()
        cursor = conn.cursor()
        leader_id = data.get('leader_id') or None
        municipality_id = db.insert(cursor,
            'INSERT INTO municipalities (name, province_id, leader_id) VALUES (?, ?, ?)',
            (data['name'], data['province_id'], leader_id))
        conn.commit()
        conn.close()
        return jsonify({'id': municipality_id, 'message': 'Municipio creado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/municipalities/<int:municipality_id>', methods=['PUT'])
def update_municipality(municipality_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('''
        UPDATE municipalities
        SET name = ?, province_id = ?, leader_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    '''), (data['name'], data['province_id'], data.get('leader_id'), municipality_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Municipio actualizado exitosamente'})

@app.route('/api/municipalities/<int:municipality_id>', methods=['DELETE'])
def delete_municipality(municipality_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('DELETE FROM municipalities WHERE id = ?'), (municipality_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Municipio eliminado exitosamente'})

# ── Líderes ───────────────────────────────────────────────────────────────────

@app.route('/api/leaders', methods=['GET'])
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

@app.route('/api/leaders', methods=['POST'])
def create_leader():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    leader_id = db.insert(cursor,
        'INSERT INTO leaders (name, contact, municipality_id) VALUES (?, ?, ?)',
        (data['name'], data['contact'], data['municipality_id']))
    cursor.execute(db.q('UPDATE municipalities SET leader_id = ? WHERE id = ?'),
                   (leader_id, data['municipality_id']))
    conn.commit()
    conn.close()
    return jsonify({'id': leader_id, 'message': 'Líder creado exitosamente'}), 201

@app.route('/api/leaders/<int:leader_id>', methods=['PUT'])
def update_leader(leader_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('''
        UPDATE leaders
        SET name = ?, contact = ?, municipality_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    '''), (data['name'], data['contact'], data['municipality_id'], leader_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Líder actualizado exitosamente'})

@app.route('/api/leaders/<int:leader_id>', methods=['DELETE'])
def delete_leader(leader_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('DELETE FROM leaders WHERE id = ?'), (leader_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Líder eliminado exitosamente'})

# ── Instituciones ─────────────────────────────────────────────────────────────

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
    institution_id = db.insert(cursor,
        'INSERT INTO institutions (name, leader_id, urban_sedes, rural_sedes, teacher_count) VALUES (?, ?, ?, ?, ?)',
        (data['name'], data['leader_id'],
         data.get('urban_sedes', 0),
         data.get('rural_sedes', 0),
         data.get('teacher_count', 0)))
    conn.commit()
    conn.close()
    return jsonify({'id': institution_id, 'message': 'Institución creada exitosamente'}), 201

@app.route('/api/institutions/<int:institution_id>', methods=['PUT'])
def update_institution(institution_id):
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('''
        UPDATE institutions
        SET name = ?, leader_id = ?, urban_sedes = ?, rural_sedes = ?,
            teacher_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    '''), (data['name'], data['leader_id'],
           data.get('urban_sedes', 0),
           data.get('rural_sedes', 0),
           data.get('teacher_count', 0),
           institution_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Institución actualizada exitosamente'})

@app.route('/api/institutions/<int:institution_id>', methods=['DELETE'])
def delete_institution(institution_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(db.q('DELETE FROM institutions WHERE id = ?'), (institution_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Institución eliminada exitosamente'})

# ── Metas Semanales ───────────────────────────────────────────────────────────

@app.route('/api/weekly-goals', methods=['GET'])
def get_weekly_goals():
    leader_id = request.args.get('leader_id')
    week  = request.args.get('week')
    month = request.args.get('month')
    year  = request.args.get('year')

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
        query += ' AND wg.leader_id = ?'; params.append(leader_id)
    if week:
        query += ' AND wg.week = ?';      params.append(week)
    if month:
        query += ' AND wg.month = ?';     params.append(month)
    if year:
        query += ' AND wg.year = ?';      params.append(year)

    query += ' ORDER BY wg.year DESC, wg.month DESC, wg.week DESC'
    cursor.execute(db.q(query), params)
    goals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(goals)

@app.route('/api/weekly-goals', methods=['POST'])
def create_weekly_goal():
    data = request.get_json()
    conn = db.get_connection()
    cursor = conn.cursor()
    try:
        g = data.get('goals', {})
        a = data.get('actual', {})
        goal_id = db.insert(cursor, '''
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
            g.get('eeVisitadas', 0),            a.get('eeVisitadas', 0),
            g.get('sedesVisitadas', 0),         a.get('sedesVisitadas', 0),
            g.get('reportesEstanteria', 0),     a.get('reportesEstanteria', 0),
            g.get('reportesSalud', 0),          a.get('reportesSalud', 0),
            g.get('analisisVulnerabilidad', 0), a.get('analisisVulnerabilidad', 0),
            g.get('matricesRiesgo', 0),         a.get('matricesRiesgo', 0),
            g.get('diagnosticoSalud', 0),       a.get('diagnosticoSalud', 0),
            g.get('planesCuidado', 0),          a.get('planesCuidado', 0),
            g.get('investigacionesAtel', 0),    a.get('investigacionesAtel', 0),
        ))
        conn.commit()
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
        g = data.get('goals', {})
        a = data.get('actual', {})
        cursor.execute(db.q('''
            UPDATE weekly_goals SET
                ee_visitadas_goal = ?,            ee_visitadas_actual = ?,
                sedes_visitadas_goal = ?,         sedes_visitadas_actual = ?,
                reportes_estanteria_goal = ?,     reportes_estanteria_actual = ?,
                reportes_salud_goal = ?,          reportes_salud_actual = ?,
                analisis_vulnerabilidad_goal = ?, analisis_vulnerabilidad_actual = ?,
                matrices_riesgo_goal = ?,         matrices_riesgo_actual = ?,
                diagnostico_salud_goal = ?,       diagnostico_salud_actual = ?,
                planes_cuidado_goal = ?,          planes_cuidado_actual = ?,
                investigaciones_atel_goal = ?,    investigaciones_atel_actual = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        '''), (
            g.get('eeVisitadas', 0),            a.get('eeVisitadas', 0),
            g.get('sedesVisitadas', 0),         a.get('sedesVisitadas', 0),
            g.get('reportesEstanteria', 0),     a.get('reportesEstanteria', 0),
            g.get('reportesSalud', 0),          a.get('reportesSalud', 0),
            g.get('analisisVulnerabilidad', 0), a.get('analisisVulnerabilidad', 0),
            g.get('matricesRiesgo', 0),         a.get('matricesRiesgo', 0),
            g.get('diagnosticoSalud', 0),       a.get('diagnosticoSalud', 0),
            g.get('planesCuidado', 0),          a.get('planesCuidado', 0),
            g.get('investigacionesAtel', 0),    a.get('investigacionesAtel', 0),
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
    cursor.execute(db.q('DELETE FROM weekly_goals WHERE id = ?'), (goal_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Meta semanal eliminada exitosamente'})

# ── Migración ─────────────────────────────────────────────────────────────────

@app.route('/api/migrate', methods=['POST'])
def migrate_from_localstorage():
    data = request.get_json()
    success = db.migrate_from_localstorage(data)
    if success:
        return jsonify({'message': 'Migración completada exitosamente'})
    return jsonify({'error': 'Error en la migración'}), 500

# ── Indicadores ───────────────────────────────────────────────────────────────

@app.route('/api/indicators', methods=['GET'])
def get_indicators():
    province_id     = request.args.get('province_id')
    municipality_id = request.args.get('municipality_id')
    leader_id       = request.args.get('leader_id')

    conn = db.get_connection()
    cursor = conn.cursor()

    query = '''
        SELECT
            COUNT(DISTINCT i.id)               AS ee_visitadas,
            SUM(i.urban_sedes + i.rural_sedes) AS sedes_visitadas,
            COUNT(DISTINCT i.id) * 2           AS reportes_estanteria,
            SUM(i.teacher_count)               AS reportes_salud,
            SUM(i.urban_sedes + i.rural_sedes) AS analisis_vulnerabilidad,
            SUM(i.urban_sedes + i.rural_sedes) AS matrices_riesgo,
            SUM(i.teacher_count)               AS diagnostico_salud,
            SUM(i.teacher_count)               AS planes_cuidado,
            SUM(i.teacher_count) * 0.1         AS investigaciones_atel
        FROM institutions i
        LEFT JOIN leaders l       ON i.leader_id        = l.id
        LEFT JOIN municipalities m ON l.municipality_id  = m.id
        LEFT JOIN provinces p     ON m.province_id       = p.id
        WHERE 1=1
    '''
    params = []
    if province_id:
        query += ' AND p.id = ?';     params.append(province_id)
    if municipality_id:
        query += ' AND m.id = ?';     params.append(municipality_id)
    if leader_id:
        query += ' AND l.id = ?';     params.append(leader_id)

    cursor.execute(db.q(query), params)
    result = cursor.fetchone()
    indicators = dict(result) if result else {
        'ee_visitadas': 0, 'sedes_visitadas': 0, 'reportes_estanteria': 0,
        'reportes_salud': 0, 'analisis_vulnerabilidad': 0, 'matrices_riesgo': 0,
        'diagnostico_salud': 0, 'planes_cuidado': 0, 'investigaciones_atel': 0
    }
    conn.close()
    return jsonify(indicators)

# ── Arranque ──────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
