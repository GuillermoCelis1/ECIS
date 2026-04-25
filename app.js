// Sistema de Seguimiento Educativo - Cundinamarca

// Convierte "YYYY-MM-DD" → { week, month, year }
function dateToWeekMonthYear(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { week: Math.min(Math.ceil(d / 7), 5), month: m, year: y };
}

// Convierte (week, month, year) → "YYYY-MM-DD" (primer día de la semana)
function weekToStartDate(week, month, year) {
    const day = (week - 1) * 7 + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Convierte (week, month, year) → "YYYY-MM-DD" (último día de la semana)
function weekToEndDate(week, month, year) {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const day = Math.min(week * 7, lastDayOfMonth);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Clase para manejar la comunicación con la API REST
class APIManager {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            if (!response.ok) {
                let message = `HTTP error! status: ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData.error) message = errData.error;
                } catch {}
                throw new Error(message);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Provincias
    async getProvinces() {
        const result = await this.request('/provinces');
        console.log('APIManager.getProvinces - Resultado crudo:', result);
        console.log('APIManager.getProvinces - ¿Es array?', Array.isArray(result));
        console.log('APIManager.getProvinces - Tipo:', typeof result);
        return result;
    }

    async createProvince(province) {
        return this.request('/provinces', 'POST', province);
    }

    async updateProvince(id, province) {
        return this.request(`/provinces/${id}`, 'PUT', province);
    }

    async deleteProvince(id) {
        return this.request(`/provinces/${id}`, 'DELETE');
    }

    // Municipios
    async getMunicipalities() {
        return this.request('/municipalities');
    }

    async createMunicipality(municipality) {
        return this.request('/municipalities', 'POST', municipality);
    }

    async updateMunicipality(id, municipality) {
        return this.request(`/municipalities/${id}`, 'PUT', municipality);
    }

    async deleteMunicipality(id) {
        return this.request(`/municipalities/${id}`, 'DELETE');
    }

    // Líderes
    async getLeaders() {
        return this.request('/leaders');
    }

    async createLeader(leader) {
        return this.request('/leaders', 'POST', leader);
    }

    async updateLeader(id, leader) {
        return this.request(`/leaders/${id}`, 'PUT', leader);
    }

    async deleteLeader(id) {
        return this.request(`/leaders/${id}`, 'DELETE');
    }

    // Instituciones
    async getInstitutions() {
        return this.request('/institutions');
    }

    async createInstitution(institution) {
        return this.request('/institutions', 'POST', institution);
    }

    async updateInstitution(id, institution) {
        return this.request(`/institutions/${id}`, 'PUT', institution);
    }

    async deleteInstitution(id) {
        return this.request(`/institutions/${id}`, 'DELETE');
    }

    // Metas Semanales
    async getWeeklyGoals(filters = {}) {
        const params = new URLSearchParams();
        if (filters.leader_id) params.append('leader_id', filters.leader_id);
        if (filters.week) params.append('week', filters.week);
        if (filters.month) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/weekly-goals${query}`);
    }

    async createWeeklyGoal(goal) {
        return this.request('/weekly-goals', 'POST', goal);
    }

    async updateWeeklyGoal(id, goal) {
        return this.request(`/weekly-goals/${id}`, 'PUT', goal);
    }

    async deleteWeeklyGoal(id) {
        return this.request(`/weekly-goals/${id}`, 'DELETE');
    }

    // Indicadores
    async getIndicators(filters = {}) {
        const params = new URLSearchParams();
        if (filters.province_id) params.append('province_id', filters.province_id);
        if (filters.municipality_id) params.append('municipality_id', filters.municipality_id);
        if (filters.leader_id) params.append('leader_id', filters.leader_id);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/indicators${query}`);
    }

    // Migración
    async migrateFromLocalStorage(data) {
        return this.request('/migrate', 'POST', data);
    }
}

// Declaración de funciones globales (para que estén disponibles desde el inicio)
let app;

function showProvinceModal() {
    const modal = new bootstrap.Modal(document.getElementById('provinceModal'));
    document.getElementById('provinceForm').reset();
    modal.show();
}

async function showMunicipalityModal() {
    const modal = new bootstrap.Modal(document.getElementById('municipalityModal'));
    document.getElementById('municipalityForm').reset();
    
    try {
        // Cargar provincias en el select
        const provinces = await app.db.getProvinces();
        console.log('Provincias cargadas:', provinces);
        console.log('Tipo de provincias:', typeof provinces);
        console.log('¿Es array?', Array.isArray(provinces));
        
        // Validar que sea un array
        if (!Array.isArray(provinces)) {
            console.error('Expected array but got:', typeof provinces, provinces);
            throw new Error('La API no devolvió un array de provincias');
        }
        
        const select = document.getElementById('municipalityProvince');
        select.innerHTML = '<option value="">Seleccione una provincia</option>' +
            provinces.map(province => 
                `<option value="${province.id}">${province.name}</option>`
            ).join('');
        
        modal.show();
    } catch (error) {
        console.error('Error cargando provincias:', error);
        alert('Error al cargar provincias: ' + error.message);
    }
}

async function showLeaderModal() {
    const modal = new bootstrap.Modal(document.getElementById('leaderModal'));
    document.getElementById('leaderForm').reset();
    
    try {
        // Cargar municipios en el select
        const municipalities = await app.db.getMunicipalities();
        const select = document.getElementById('leaderMunicipality');
        select.innerHTML = '<option value="">Seleccione un municipio</option>' +
            municipalities.map(municipality => 
                `<option value="${municipality.id}">${municipality.name}</option>`
            ).join('');
        
        modal.show();
    } catch (error) {
        console.error('Error cargando municipios:', error);
        alert('Error al cargar municipios');
    }
}

async function showInstitutionModal() {
    const modal = new bootstrap.Modal(document.getElementById('institutionModal'));
    document.getElementById('institutionForm').reset();
    
    try {
        // Cargar líderes en el select
        const leaders = await app.db.getLeaders();
        const select = document.getElementById('institutionLeader');
        select.innerHTML = '<option value="">Seleccione un líder</option>' +
            leaders.map(leader => 
                `<option value="${leader.id}">${leader.name}</option>`
            ).join('');
        
        modal.show();
    } catch (error) {
        console.error('Error cargando líderes:', error);
        alert('Error al cargar líderes');
    }
}

async function saveProvince() {
    console.log('saveProvince - Iniciando función');
    
    const name = document.getElementById('provinceName').value.trim();
    console.log('saveProvince - Nombre:', name);
    
    if (!name) {
        alert('Por favor ingrese el nombre de la provincia');
        return;
    }

    try {
        console.log('saveProvince - Intentando agregar provincia:', { name });
        const result = await app.db.addProvince({ name });
        console.log('saveProvince - Resultado de addProvince:', result);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('provinceModal'));
        if (modal) {
            modal.hide();
        }
        
        console.log('saveProvince - Cargando tablas...');
        await app.loadTables();
        console.log('saveProvince - Actualizando dashboard...');
        await app.updateDashboard();
        console.log('saveProvince - Actualizando filtros...');
        app.updateFilters();
        
        alert('Provincia guardada exitosamente');
    } catch (error) {
        console.error('Error guardando provincia:', error);
        console.error('Error details:', error.message, error.stack);
        alert('Error al guardar provincia: ' + error.message);
    }
}

async function saveMunicipality() {
    const name = document.getElementById('municipalityName').value.trim();
    const provinceId = parseInt(document.getElementById('municipalityProvince').value);
    
    if (!name || !provinceId) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        const data = { name, province_id: provinceId, leader_id: null };
        console.log('Enviando datos de municipio:', data);
        
        await app.db.addMunicipality(data);
        
        bootstrap.Modal.getInstance(document.getElementById('municipalityModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        alert('Municipio guardado exitosamente');
    } catch (error) {
        console.error('Error guardando municipio:', error);
        alert('Error al guardar municipio: ' + error.message);
    }
}

async function saveLeader() {
    const name = document.getElementById('leaderName').value.trim();
    const contact = document.getElementById('leaderContact').value.trim();
    const municipalityId = parseInt(document.getElementById('leaderMunicipality').value);
    
    if (!name || !contact || !municipalityId) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        await app.db.addLeader({ name, contact, municipality_id: municipalityId });
        
        bootstrap.Modal.getInstance(document.getElementById('leaderModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        alert('Líder guardado exitosamente');
    } catch (error) {
        console.error('Error guardando líder:', error);
        alert('Error al guardar líder');
    }
}

async function saveInstitution() {
    const name = document.getElementById('institutionName').value.trim();
    const leaderId = parseInt(document.getElementById('institutionLeader').value);
    const urbanSedes = parseInt(document.getElementById('urbanSedes').value);
    const ruralSedes = parseInt(document.getElementById('ruralSedes').value);
    const teacherCount = parseInt(document.getElementById('teacherCount').value);
    
    if (!name || !leaderId) {
        alert('Por favor complete los campos obligatorios');
        return;
    }

    try {
        await app.db.addInstitution({ 
            name, 
            leader_id: leaderId, 
            urban_sedes: urbanSedes, 
            rural_sedes: ruralSedes, 
            teacher_count: teacherCount 
        });
        
        bootstrap.Modal.getInstance(document.getElementById('institutionModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        alert('Institución guardada exitosamente');
    } catch (error) {
        console.error('Error guardando institución:', error);
        alert('Error al guardar institución');
    }
}

async function editProvince(id) {
    try {
        // Obtener datos de la provincia
        const provinces = await app.db.getProvinces();
        const province = provinces.find(p => p.id === id);
        
        if (!province) {
            alert('Provincia no encontrada');
            return;
        }
        
        // Cargar datos en el modal
        document.getElementById('provinceName').value = province.name;
        
        // Cambiar el texto del botón y el título del modal
        const modalTitle = document.querySelector('#provinceModal .modal-title');
        const saveButton = document.querySelector('#provinceModal .btn-primary');
        modalTitle.textContent = 'Editar Provincia';
        saveButton.textContent = 'Actualizar';
        saveButton.onclick = () => updateProvince(id);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('provinceModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editando provincia:', error);
        alert('Error al editar provincia');
    }
}

async function updateProvince(id) {
    const name = document.getElementById('provinceName').value.trim();
    
    if (!name) {
        alert('Por favor ingrese el nombre de la provincia');
        return;
    }

    try {
        await app.db.updateProvince(id, { name });
        
        bootstrap.Modal.getInstance(document.getElementById('provinceModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        // Restaurar el modal para crear
        const modalTitle = document.querySelector('#provinceModal .modal-title');
        const saveButton = document.querySelector('#provinceModal .btn-primary');
        modalTitle.textContent = 'Nueva Provincia';
        saveButton.textContent = 'Guardar';
        saveButton.onclick = saveProvince;
        
        alert('Provincia actualizada exitosamente');
    } catch (error) {
        console.error('Error actualizando provincia:', error);
        alert('Error al actualizar provincia');
    }
}

async function deleteProvince(id) {
    console.log('Intentando eliminar provincia con ID:', id);
    
    if (confirm('¿Está seguro de eliminar esta provincia? Esta acción no se puede deshacer.')) {
        try {
            console.log('Usuario confirmó eliminación');
            const result = await app.db.deleteProvince(id);
            console.log('Resultado de eliminación:', result);
            
            await app.loadTables();
            await app.updateDashboard();
            app.updateFilters();
            
            alert('Provincia eliminada exitosamente');
        } catch (error) {
            console.error('Error eliminando provincia:', error);
            alert('Error al eliminar provincia: ' + error.message);
        }
    } else {
        console.log('Usuario canceló eliminación');
    }
}

async function editMunicipality(id) {
    try {
        // Obtener datos del municipio
        const municipalities = await app.db.getMunicipalities();
        const provinces = await app.db.getProvinces();
        const municipality = municipalities.find(m => m.id === id);
        
        if (!municipality) {
            alert('Municipio no encontrado');
            return;
        }
        
        // Cargar datos en el modal
        document.getElementById('municipalityName').value = municipality.name;
        
        // Cargar provincias en el select
        const select = document.getElementById('municipalityProvince');
        select.innerHTML = '<option value="">Seleccione una provincia</option>' +
            provinces.map(province => 
                `<option value="${province.id}" ${province.id === municipality.province_id ? 'selected' : ''}>${province.name}</option>`
            ).join('');
        
        // Cambiar el texto del botón y el título del modal
        const modalTitle = document.querySelector('#municipalityModal .modal-title');
        const saveButton = document.querySelector('#municipalityModal .btn-primary');
        modalTitle.textContent = 'Editar Municipio';
        saveButton.textContent = 'Actualizar';
        saveButton.onclick = () => updateMunicipality(id);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('municipalityModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editando municipio:', error);
        alert('Error al editar municipio');
    }
}

async function updateMunicipality(id) {
    const name = document.getElementById('municipalityName').value.trim();
    const provinceId = parseInt(document.getElementById('municipalityProvince').value);
    
    if (!name || !provinceId) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        await app.db.updateMunicipality(id, { name, province_id: provinceId, leader_id: null });
        
        bootstrap.Modal.getInstance(document.getElementById('municipalityModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        // Restaurar el modal para crear
        const modalTitle = document.querySelector('#municipalityModal .modal-title');
        const saveButton = document.querySelector('#municipalityModal .btn-primary');
        modalTitle.textContent = 'Nuevo Municipio';
        saveButton.textContent = 'Guardar';
        saveButton.onclick = saveMunicipality;
        
        alert('Municipio actualizado exitosamente');
    } catch (error) {
        console.error('Error actualizando municipio:', error);
        alert('Error al actualizar municipio');
    }
}

async function deleteMunicipality(id) {
    console.log('Intentando eliminar municipio con ID:', id);
    
    if (confirm('¿Está seguro de eliminar este municipio? Esta acción no se puede deshacer.')) {
        try {
            console.log('Usuario confirmó eliminación de municipio');
            const result = await app.db.deleteMunicipality(id);
            console.log('Resultado de eliminación de municipio:', result);
            
            await app.loadTables();
            await app.updateDashboard();
            app.updateFilters();
            
            alert('Municipio eliminado exitosamente');
        } catch (error) {
            console.error('Error eliminando municipio:', error);
            alert('Error al eliminar municipio: ' + error.message);
        }
    } else {
        console.log('Usuario canceló eliminación de municipio');
    }
}

async function editLeader(id) {
    try {
        // Obtener datos del líder
        const leaders = await app.db.getLeaders();
        const municipalities = await app.db.getMunicipalities();
        const leader = leaders.find(l => l.id === id);
        
        if (!leader) {
            alert('Líder no encontrado');
            return;
        }
        
        // Cargar datos en el modal
        document.getElementById('leaderName').value = leader.name;
        document.getElementById('leaderContact').value = leader.contact;
        
        // Cargar municipios en el select
        const select = document.getElementById('leaderMunicipality');
        select.innerHTML = '<option value="">Seleccione un municipio</option>' +
            municipalities.map(municipality => 
                `<option value="${municipality.id}" ${municipality.id === leader.municipality_id ? 'selected' : ''}>${municipality.name}</option>`
            ).join('');
        
        // Cambiar el texto del botón y el título del modal
        const modalTitle = document.querySelector('#leaderModal .modal-title');
        const saveButton = document.querySelector('#leaderModal .btn-primary');
        modalTitle.textContent = 'Editar Líder';
        saveButton.textContent = 'Actualizar';
        saveButton.onclick = () => updateLeader(id);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('leaderModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editando líder:', error);
        alert('Error al editar líder');
    }
}

async function updateLeader(id) {
    const name = document.getElementById('leaderName').value.trim();
    const contact = document.getElementById('leaderContact').value.trim();
    const municipalityId = parseInt(document.getElementById('leaderMunicipality').value);
    
    if (!name || !contact || !municipalityId) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        await app.db.updateLeader(id, { name, contact, municipality_id: municipalityId });
        
        bootstrap.Modal.getInstance(document.getElementById('leaderModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        // Restaurar el modal para crear
        const modalTitle = document.querySelector('#leaderModal .modal-title');
        const saveButton = document.querySelector('#leaderModal .btn-primary');
        modalTitle.textContent = 'Nuevo Líder';
        saveButton.textContent = 'Guardar';
        saveButton.onclick = saveLeader;
        
        alert('Líder actualizado exitosamente');
    } catch (error) {
        console.error('Error actualizando líder:', error);
        alert('Error al actualizar líder');
    }
}

async function deleteLeader(id) {
    console.log('Intentando eliminar líder con ID:', id);
    
    if (confirm('¿Está seguro de eliminar este líder? Esta acción no se puede deshacer.')) {
        try {
            console.log('Usuario confirmó eliminación de líder');
            const result = await app.db.deleteLeader(id);
            console.log('Resultado de eliminación de líder:', result);
            
            await app.loadTables();
            await app.updateDashboard();
            app.updateFilters();
            
            alert('Líder eliminado exitosamente');
        } catch (error) {
            console.error('Error eliminando líder:', error);
            alert('Error al eliminar líder: ' + error.message);
        }
    } else {
        console.log('Usuario canceló eliminación de líder');
    }
}

async function editInstitution(id) {
    try {
        // Obtener datos de la institución
        const institutions = await app.db.getInstitutions();
        const leaders = await app.db.getLeaders();
        const institution = institutions.find(i => i.id === id);
        
        if (!institution) {
            alert('Institución no encontrada');
            return;
        }
        
        // Cargar datos en el modal
        document.getElementById('institutionName').value = institution.name;
        document.getElementById('urbanSedes').value = institution.urban_sedes || 0;
        document.getElementById('ruralSedes').value = institution.rural_sedes || 0;
        document.getElementById('teacherCount').value = institution.teacher_count || 0;
        
        // Cargar líderes en el select
        const select = document.getElementById('institutionLeader');
        select.innerHTML = '<option value="">Seleccione un líder</option>' +
            leaders.map(leader => 
                `<option value="${leader.id}" ${leader.id === institution.leader_id ? 'selected' : ''}>${leader.name}</option>`
            ).join('');
        
        // Cambiar el texto del botón y el título del modal
        const modalTitle = document.querySelector('#institutionModal .modal-title');
        const saveButton = document.querySelector('#institutionModal .btn-primary');
        modalTitle.textContent = 'Editar Institución Educativa';
        saveButton.textContent = 'Actualizar';
        saveButton.onclick = () => updateInstitution(id);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('institutionModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editando institución:', error);
        alert('Error al editar institución');
    }
}

async function updateInstitution(id) {
    const name = document.getElementById('institutionName').value.trim();
    const leaderId = parseInt(document.getElementById('institutionLeader').value);
    const urbanSedes = parseInt(document.getElementById('urbanSedes').value);
    const ruralSedes = parseInt(document.getElementById('ruralSedes').value);
    const teacherCount = parseInt(document.getElementById('teacherCount').value);
    
    if (!name || !leaderId) {
        alert('Por favor complete los campos obligatorios');
        return;
    }

    try {
        await app.db.updateInstitution(id, { 
            name, 
            leader_id: leaderId, 
            urban_sedes: urbanSedes, 
            rural_sedes: ruralSedes, 
            teacher_count: teacherCount 
        });
        
        bootstrap.Modal.getInstance(document.getElementById('institutionModal')).hide();
        await app.loadTables();
        await app.updateDashboard();
        app.updateFilters();
        
        // Restaurar el modal para crear
        const modalTitle = document.querySelector('#institutionModal .modal-title');
        const saveButton = document.querySelector('#institutionModal .btn-primary');
        modalTitle.textContent = 'Nueva Institución Educativa';
        saveButton.textContent = 'Guardar';
        saveButton.onclick = saveInstitution;
        
        alert('Institución actualizada exitosamente');
    } catch (error) {
        console.error('Error actualizando institución:', error);
        alert('Error al actualizar institución');
    }
}

async function deleteInstitution(id) {
    console.log('Intentando eliminar institución con ID:', id);
    
    if (confirm('¿Está seguro de eliminar esta institución? Esta acción no se puede deshacer.')) {
        try {
            console.log('Usuario confirmó eliminación de institución');
            const result = await app.db.deleteInstitution(id);
            console.log('Resultado de eliminación de institución:', result);
            
            await app.loadTables();
            await app.updateDashboard();
            app.updateFilters();
            
            alert('Institución eliminada exitosamente');
        } catch (error) {
            console.error('Error eliminando institución:', error);
            alert('Error al eliminar institución: ' + error.message);
        }
    } else {
        console.log('Usuario canceló eliminación de institución');
    }
}

async function editWeeklyGoal(leaderId, week, month, year) {
    try {
        // Obtener datos de la meta semanal
        const goal = await app.db.getWeeklyGoal(leaderId, week, month, year);
        
        if (!goal) {
            alert('Meta semanal no encontrada');
            return;
        }
        
        // Cargar datos en el modal
        document.getElementById('goalLeader').value    = leaderId;
        document.getElementById('goalDateStart').value = weekToStartDate(week, month, year);
        document.getElementById('goalDateEnd').value   = weekToEndDate(week, month, year);
        
        // Cargar metas y valores reales
        document.getElementById('goalEeVisitadas').value = goal.goals.eeVisitadas || 0;
        document.getElementById('actualEeVisitadas').value = goal.actual.eeVisitadas || 0;
        document.getElementById('goalSedesVisitadas').value = goal.goals.sedesVisitadas || 0;
        document.getElementById('actualSedesVisitadas').value = goal.actual.sedesVisitadas || 0;
        document.getElementById('goalReportesEstanteria').value = goal.goals.reportesEstanteria || 0;
        document.getElementById('actualReportesEstanteria').value = goal.actual.reportesEstanteria || 0;
        document.getElementById('goalReportesSalud').value = goal.goals.reportesSalud || 0;
        document.getElementById('actualReportesSalud').value = goal.actual.reportesSalud || 0;
        document.getElementById('goalAnalisisVulnerabilidad').value = goal.goals.analisisVulnerabilidad || 0;
        document.getElementById('actualAnalisisVulnerabilidad').value = goal.actual.analisisVulnerabilidad || 0;
        document.getElementById('goalMatricesRiesgo').value = goal.goals.matricesRiesgo || 0;
        document.getElementById('actualMatricesRiesgo').value = goal.actual.matricesRiesgo || 0;
        document.getElementById('goalDiagnosticoSalud').value = goal.goals.diagnosticoSalud || 0;
        document.getElementById('actualDiagnosticoSalud').value = goal.actual.diagnosticoSalud || 0;
        document.getElementById('goalPlanesCuidado').value = goal.goals.planesCuidado || 0;
        document.getElementById('actualPlanesCuidado').value = goal.actual.planesCuidado || 0;
        document.getElementById('goalInvestigacionesAtel').value = goal.goals.investigacionesAtel || 0;
        document.getElementById('actualInvestigacionesAtel').value = goal.actual.investigacionesAtel || 0;
        
        // Cambiar el texto del botón y el título del modal
        const modalTitle = document.querySelector('#weeklyGoalModal .modal-title');
        const saveButton = document.querySelector('#weeklyGoalModal .btn-primary');
        modalTitle.textContent = 'Editar Meta Semanal';
        saveButton.textContent = 'Actualizar';
        saveButton.onclick = () => updateWeeklyGoal(goal.id);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('weeklyGoalModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editando meta semanal:', error);
        alert('Error al editar meta semanal');
    }
}

async function updateWeeklyGoal(goalId) {
    const leaderId  = parseInt(document.getElementById('goalLeader').value);
    const dateStart = document.getElementById('goalDateStart').value;
    const dateEnd   = document.getElementById('goalDateEnd').value;

    if (!leaderId || !dateStart || !dateEnd) {
        alert('Por favor seleccione un líder y el rango de fechas');
        return;
    }
    if (dateEnd < dateStart) {
        alert('La fecha fin debe ser igual o posterior a la fecha inicio');
        return;
    }
    
    // Recopilar metas y valores reales
    const goals = {
        eeVisitadas: parseInt(document.getElementById('goalEeVisitadas').value) || 0,
        sedesVisitadas: parseInt(document.getElementById('goalSedesVisitadas').value) || 0,
        reportesEstanteria: parseInt(document.getElementById('goalReportesEstanteria').value) || 0,
        reportesSalud: parseInt(document.getElementById('goalReportesSalud').value) || 0,
        analisisVulnerabilidad: parseInt(document.getElementById('goalAnalisisVulnerabilidad').value) || 0,
        matricesRiesgo: parseInt(document.getElementById('goalMatricesRiesgo').value) || 0,
        diagnosticoSalud: parseInt(document.getElementById('goalDiagnosticoSalud').value) || 0,
        planesCuidado: parseInt(document.getElementById('goalPlanesCuidado').value) || 0,
        investigacionesAtel: parseInt(document.getElementById('goalInvestigacionesAtel').value) || 0
    };
    
    const actual = {
        eeVisitadas: parseInt(document.getElementById('actualEeVisitadas').value) || 0,
        sedesVisitadas: parseInt(document.getElementById('actualSedesVisitadas').value) || 0,
        reportesEstanteria: parseInt(document.getElementById('actualReportesEstanteria').value) || 0,
        reportesSalud: parseInt(document.getElementById('actualReportesSalud').value) || 0,
        analisisVulnerabilidad: parseInt(document.getElementById('actualAnalisisVulnerabilidad').value) || 0,
        matricesRiesgo: parseInt(document.getElementById('actualMatricesRiesgo').value) || 0,
        diagnosticoSalud: parseInt(document.getElementById('actualDiagnosticoSalud').value) || 0,
        planesCuidado: parseInt(document.getElementById('actualPlanesCuidado').value) || 0,
        investigacionesAtel: parseInt(document.getElementById('actualInvestigacionesAtel').value) || 0
    };
    
    try {
        await app.db.updateWeeklyGoal(goalId, { goals, actual });
        
        bootstrap.Modal.getInstance(document.getElementById('weeklyGoalModal')).hide();
        await app.loadWeeklyGoalsTable();
        await app.updateIndicators();
        
        // Restaurar el modal para crear
        const modalTitle = document.querySelector('#weeklyGoalModal .modal-title');
        const saveButton = document.querySelector('#weeklyGoalModal .btn-primary');
        modalTitle.textContent = 'Meta Semanal por Líder';
        saveButton.textContent = 'Guardar';
        saveButton.onclick = saveWeeklyGoal;
        
        alert('Meta semanal actualizada exitosamente');
    } catch (error) {
        console.error('Error actualizando meta semanal:', error);
        alert('Error al actualizar meta semanal');
    }
}

async function deleteWeeklyGoal(leaderId, week, month, year) {
    console.log('Intentando eliminar meta semanal - Leader:', leaderId, 'Week:', week, 'Month:', month, 'Year:', year);
    
    if (confirm('¿Está seguro de eliminar esta meta semanal? Esta acción no se puede deshacer.')) {
        try {
            console.log('Usuario confirmó eliminación de meta semanal');
            
            // Obtener el ID del goal para eliminar
            const goal = await app.db.getWeeklyGoal(leaderId, week, month, year);
            if (!goal) {
                console.log('Meta semanal no encontrada para los parámetros proporcionados');
                alert('Meta semanal no encontrada');
                return;
            }
            
            console.log('Meta semanal encontrada con ID:', goal.id);
            const result = await app.db.deleteWeeklyGoal(goal.id);
            console.log('Resultado de eliminación de meta semanal:', result);
            
            await app.loadWeeklyGoalsTable();
            await app.updateIndicators();
            
            alert('Meta semanal eliminada exitosamente');
        } catch (error) {
            console.error('Error eliminando meta semanal:', error);
            alert('Error al eliminar meta semanal: ' + error.message);
        }
    } else {
        console.log('Usuario canceló eliminación de meta semanal');
    }
}

async function showWeeklyGoalModal() {
    const modal = new bootstrap.Modal(document.getElementById('weeklyGoalModal'));
    document.getElementById('weeklyGoalForm').reset();

    // Fecha de inicio = hoy, fecha fin = hoy + 6 días (una semana)
    const today = new Date();
    const end   = new Date(today); end.setDate(end.getDate() + 6);
    const fmt   = d => d.toISOString().slice(0, 10);
    document.getElementById('goalDateStart').value = fmt(today);
    document.getElementById('goalDateEnd').value   = fmt(end);

    try {
        const leaders = await app.db.getLeaders();
        const select  = document.getElementById('goalLeader');
        select.innerHTML = '<option value="">Seleccione un líder</option>' +
            leaders.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        modal.show();
    } catch (error) {
        console.error('Error cargando líderes:', error);
        alert('Error al cargar líderes');
    }
}

async function saveWeeklyGoal() {
    const leaderId   = parseInt(document.getElementById('goalLeader').value);
    const dateStart  = document.getElementById('goalDateStart').value;
    const dateEnd    = document.getElementById('goalDateEnd').value;

    if (!leaderId || !dateStart || !dateEnd) {
        alert('Por favor seleccione un líder y el rango de fechas');
        return;
    }
    if (dateEnd < dateStart) {
        alert('La fecha fin debe ser igual o posterior a la fecha inicio');
        return;
    }

    const { week, month, year } = dateToWeekMonthYear(dateStart);
    
    // Recopilar metas y valores reales
    const goals = {
        eeVisitadas: parseInt(document.getElementById('goalEeVisitadas').value) || 0,
        sedesVisitadas: parseInt(document.getElementById('goalSedesVisitadas').value) || 0,
        reportesEstanteria: parseInt(document.getElementById('goalReportesEstanteria').value) || 0,
        reportesSalud: parseInt(document.getElementById('goalReportesSalud').value) || 0,
        analisisVulnerabilidad: parseInt(document.getElementById('goalAnalisisVulnerabilidad').value) || 0,
        matricesRiesgo: parseInt(document.getElementById('goalMatricesRiesgo').value) || 0,
        diagnosticoSalud: parseInt(document.getElementById('goalDiagnosticoSalud').value) || 0,
        planesCuidado: parseInt(document.getElementById('goalPlanesCuidado').value) || 0,
        investigacionesAtel: parseInt(document.getElementById('goalInvestigacionesAtel').value) || 0
    };
    
    const actual = {
        eeVisitadas: parseInt(document.getElementById('actualEeVisitadas').value) || 0,
        sedesVisitadas: parseInt(document.getElementById('actualSedesVisitadas').value) || 0,
        reportesEstanteria: parseInt(document.getElementById('actualReportesEstanteria').value) || 0,
        reportesSalud: parseInt(document.getElementById('actualReportesSalud').value) || 0,
        analisisVulnerabilidad: parseInt(document.getElementById('actualAnalisisVulnerabilidad').value) || 0,
        matricesRiesgo: parseInt(document.getElementById('actualMatricesRiesgo').value) || 0,
        diagnosticoSalud: parseInt(document.getElementById('actualDiagnosticoSalud').value) || 0,
        planesCuidado: parseInt(document.getElementById('actualPlanesCuidado').value) || 0,
        investigacionesAtel: parseInt(document.getElementById('actualInvestigacionesAtel').value) || 0
    };
    
    const weekData = {
        week,
        month,
        year,
        goals,
        actual
    };
    
    try {
        await app.db.addWeeklyGoal(leaderId, weekData);
        
        bootstrap.Modal.getInstance(document.getElementById('weeklyGoalModal')).hide();
        await app.loadWeeklyGoalsTable();
        await app.updateIndicators();
        
        alert('Meta semanal guardada exitosamente');
    } catch (error) {
        console.error('Error guardando meta semanal:', error);
        alert('Error al guardar meta semanal: ' + error.message);
    }
}

// Clase para manejar la base de datos a través de la API REST
class Database {
    constructor() {
        this.api = new APIManager();
        this.cache = {
            provinces: [],
            municipalities: [],
            leaders: [],
            institutions: [],
            weeklyGoals: []
        };
    }

    // Métodos asíncronos para obtener datos
    async getProvinces() {
        try {
            const apiResult = await this.api.getProvinces();
            console.log('Database.getProvinces - Resultado de API:', apiResult);
            console.log('Database.getProvinces - ¿Es array?', Array.isArray(apiResult));
            this.cache.provinces = apiResult;
            console.log('Database.getProvinces - Cache actualizado:', this.cache.provinces);
            return this.cache.provinces;
        } catch (error) {
            console.error('Database.getProvinces - Error obteniendo provincias:', error);
            return [];
        }
    }

    async getMunicipalities() {
        try {
            this.cache.municipalities = await this.api.getMunicipalities();
            return this.cache.municipalities;
        } catch (error) {
            console.error('Error obteniendo municipios:', error);
            return [];
        }
    }

    async getLeaders() {
        try {
            this.cache.leaders = await this.api.getLeaders();
            return this.cache.leaders;
        } catch (error) {
            console.error('Error obteniendo líderes:', error);
            return [];
        }
    }

    async getInstitutions() {
        try {
            this.cache.institutions = await this.api.getInstitutions();
            return this.cache.institutions;
        } catch (error) {
            console.error('Error obteniendo instituciones:', error);
            return [];
        }
    }

    async getIndicators() {
        const empty = {
            eeVisitadas: 0, sedesVisitadas: 0, reportesEstanteria: 0,
            reportesSalud: 0, analisisVulnerabilidad: 0, matricesRiesgo: 0,
            diagnosticoSalud: 0, planesCuidado: 0, investigacionesAtel: 0
        };
        try {
            const raw = await this.api.getIndicators();
            return {
                eeVisitadas: raw.ee_visitadas || 0,
                sedesVisitadas: raw.sedes_visitadas || 0,
                reportesEstanteria: raw.reportes_estanteria || 0,
                reportesSalud: raw.reportes_salud || 0,
                analisisVulnerabilidad: raw.analisis_vulnerabilidad || 0,
                matricesRiesgo: raw.matrices_riesgo || 0,
                diagnosticoSalud: raw.diagnostico_salud || 0,
                planesCuidado: raw.planes_cuidado || 0,
                investigacionesAtel: raw.investigaciones_atel || 0
            };
        } catch (error) {
            console.error('Error obteniendo indicadores:', error);
            return empty;
        }
    }

    // Métodos para agregar datos
    async addProvince(province) {
        try {
            console.log('Database.addProvince - Datos recibidos:', province);
            const result = await this.api.createProvince(province);
            console.log('Database.addProvince - Resultado de API:', result);
            await this.getProvinces(); // Refrescar caché
            console.log('Database.addProvince - Cache refrescado');
            return result.id;
        } catch (error) {
            console.error('Database.addProvince - Error agregando provincia:', error);
            console.error('Database.addProvince - Error details:', error.message, error.stack);
            throw error;
        }
    }

    async addMunicipality(municipality) {
        try {
            const result = await this.api.createMunicipality(municipality);
            await this.getMunicipalities(); // Refrescar caché
            return result.id;
        } catch (error) {
            console.error('Error agregando municipio:', error);
            throw error;
        }
    }

    async addLeader(leader) {
        try {
            const result = await this.api.createLeader(leader);
            await this.getLeaders(); // Refrescar caché
            return result.id;
        } catch (error) {
            console.error('Error agregando líder:', error);
            throw error;
        }
    }

    async addInstitution(institution) {
        try {
            const result = await this.api.createInstitution(institution);
            await this.getInstitutions(); // Refrescar caché
            return result.id;
        } catch (error) {
            console.error('Error agregando institución:', error);
            throw error;
        }
    }

    // Métodos para actualizar datos
    async updateProvince(id, province) {
        try {
            await this.api.updateProvince(id, province);
            await this.getProvinces(); // Refrescar caché
        } catch (error) {
            console.error('Error actualizando provincia:', error);
            throw error;
        }
    }

    async updateMunicipality(id, municipality) {
        try {
            await this.api.updateMunicipality(id, municipality);
            await this.getMunicipalities(); // Refrescar caché
        } catch (error) {
            console.error('Error actualizando municipio:', error);
            throw error;
        }
    }

    async updateLeader(id, leader) {
        try {
            await this.api.updateLeader(id, leader);
            await this.getLeaders(); // Refrescar caché
        } catch (error) {
            console.error('Error actualizando líder:', error);
            throw error;
        }
    }

    async updateInstitution(id, institution) {
        try {
            await this.api.updateInstitution(id, institution);
            await this.getInstitutions(); // Refrescar caché
        } catch (error) {
            console.error('Error actualizando institución:', error);
            throw error;
        }
    }

    async updateWeeklyGoal(id, goal) {
        try {
            await this.api.updateWeeklyGoal(id, goal);
            await this.getWeeklyGoals(); // Refrescar caché
        } catch (error) {
            console.error('Error actualizando meta semanal:', error);
            throw error;
        }
    }

    // Métodos para eliminar datos
    async deleteProvince(id) {
        try {
            await this.api.deleteProvince(id);
            await this.getProvinces(); // Refrescar caché
        } catch (error) {
            console.error('Error eliminando provincia:', error);
            throw error;
        }
    }

    async deleteMunicipality(id) {
        try {
            await this.api.deleteMunicipality(id);
            await this.getMunicipalities(); // Refrescar caché
        } catch (error) {
            console.error('Error eliminando municipio:', error);
            throw error;
        }
    }

    async deleteLeader(id) {
        try {
            await this.api.deleteLeader(id);
            await this.getLeaders(); // Refrescar caché
        } catch (error) {
            console.error('Error eliminando líder:', error);
            throw error;
        }
    }

    async deleteInstitution(id) {
        try {
            await this.api.deleteInstitution(id);
            await this.getInstitutions(); // Refrescar caché
        } catch (error) {
            console.error('Error eliminando institución:', error);
            throw error;
        }
    }

    async deleteWeeklyGoal(id) {
        try {
            await this.api.deleteWeeklyGoal(id);
            await this.getWeeklyGoals(); // Refrescar caché
        } catch (error) {
            console.error('Error eliminando meta semanal:', error);
            throw error;
        }
    }

    // Métodos para metas semanales
    transformGoal(goal) {
        return {
            id: goal.id,
            leader_id: goal.leader_id,
            week: goal.week,
            month: goal.month,
            year: goal.year,
            leader_name: goal.leader_name,
            created_at: goal.created_at,
            updated_at: goal.updated_at,
            goals: {
                eeVisitadas: goal.ee_visitadas_goal || 0,
                sedesVisitadas: goal.sedes_visitadas_goal || 0,
                reportesEstanteria: goal.reportes_estanteria_goal || 0,
                reportesSalud: goal.reportes_salud_goal || 0,
                analisisVulnerabilidad: goal.analisis_vulnerabilidad_goal || 0,
                matricesRiesgo: goal.matrices_riesgo_goal || 0,
                diagnosticoSalud: goal.diagnostico_salud_goal || 0,
                planesCuidado: goal.planes_cuidado_goal || 0,
                investigacionesAtel: goal.investigaciones_atel_goal || 0
            },
            actual: {
                eeVisitadas: goal.ee_visitadas_actual || 0,
                sedesVisitadas: goal.sedes_visitadas_actual || 0,
                reportesEstanteria: goal.reportes_estanteria_actual || 0,
                reportesSalud: goal.reportes_salud_actual || 0,
                analisisVulnerabilidad: goal.analisis_vulnerabilidad_actual || 0,
                matricesRiesgo: goal.matrices_riesgo_actual || 0,
                diagnosticoSalud: goal.diagnostico_salud_actual || 0,
                planesCuidado: goal.planes_cuidado_actual || 0,
                investigacionesAtel: goal.investigaciones_atel_actual || 0
            }
        };
    }

    async getWeeklyGoals(filters = {}) {
        try {
            const rawGoals = await this.api.getWeeklyGoals(filters);
            this.cache.weeklyGoals = rawGoals.map(g => this.transformGoal(g));
            return this.cache.weeklyGoals;
        } catch (error) {
            console.error('Error obteniendo metas semanales:', error);
            return [];
        }
    }

    async addWeeklyGoal(leaderId, weekData) {
        try {
            const result = await this.api.createWeeklyGoal({
                leader_id: leaderId,
                week: weekData.week,
                month: weekData.month,
                year: weekData.year,
                goals: weekData.goals,
                actual: weekData.actual || {}
            });
            await this.getWeeklyGoals(); // Refrescar caché
            return result.id;
        } catch (error) {
            console.error('Error agregando meta semanal:', error);
            throw error;
        }
    }

    async getLeaderWeeklyGoals(leaderId) {
        try {
            const rawGoals = await this.api.getWeeklyGoals({ leader_id: leaderId });
            return rawGoals.map(g => this.transformGoal(g));
        } catch (error) {
            console.error('Error obteniendo metas del líder:', error);
            return [];
        }
    }

    async getWeeklyGoal(leaderId, week, month, year) {
        try {
            const goals = await this.api.getWeeklyGoals({ leader_id: leaderId, week, month, year });
            return goals.length > 0 ? this.transformGoal(goals[0]) : null;
        } catch (error) {
            console.error('Error obteniendo meta semanal:', error);
            return null;
        }
    }

    // Método para migración desde localStorage
    async migrateFromLocalStorage(data) {
        try {
            return await this.api.migrateFromLocalStorage(data);
        } catch (error) {
            console.error('Error en migración:', error);
            throw error;
        }
    }

    // Método para refrescar toda la caché
    async refreshCache() {
        await Promise.all([
            this.getProvinces(),
            this.getMunicipalities(),
            this.getLeaders(),
            this.getInstitutions()
        ]);
    }
}

// Clase para cálculo de indicadores
class IndicatorCalculator {
    constructor(database) {
        this.db = database;
    }

    calculateIndicators(filter = {}) {
        const institutions = this.db.cache.institutions;
        const leaders = this.db.cache.leaders;
        const municipalities = this.db.cache.municipalities;
        const provinces = this.db.cache.provinces;

        let filteredInstitutions = institutions;

        // Aplicar filtros
        if (filter.provinceId) {
            const provinceMunicipalities = municipalities.filter(m => m.province_id === filter.provinceId);
            const provinceMunicipalityIds = provinceMunicipalities.map(m => m.id);
            const provinceLeaders = leaders.filter(l => provinceMunicipalityIds.includes(l.municipality_id));
            const provinceLeaderIds = provinceLeaders.map(l => l.id);
            filteredInstitutions = filteredInstitutions.filter(i => provinceLeaderIds.includes(i.leader_id));
        }

        if (filter.municipalityId) {
            const municipalityLeaders = leaders.filter(l => l.municipality_id === filter.municipalityId);
            const municipalityLeaderIds = municipalityLeaders.map(l => l.id);
            filteredInstitutions = filteredInstitutions.filter(i => municipalityLeaderIds.includes(i.leader_id));
        }

        if (filter.leaderId) {
            filteredInstitutions = filteredInstitutions.filter(i => i.leader_id === filter.leaderId);
        }

        // Calcular totales
        const totalSedes = filteredInstitutions.reduce((sum, i) => sum + ((i.urban_sedes || 0) + (i.rural_sedes || 0)), 0);
        const totalDocentes = filteredInstitutions.reduce((sum, i) => sum + (i.teacher_count || 0), 0);
        const totalInstituciones = filteredInstitutions.length;

        // Fórmulas de cálculo según especificación
        return {
            eeVisitadas: totalInstituciones,
            sedesVisitadas: totalSedes,
            reportesEstanteria: totalInstituciones * 2,
            reportesSalud: totalDocentes,
            analisisVulnerabilidad: totalSedes,
            matricesRiesgo: totalSedes,
            diagnosticoSalud: totalDocentes,
            planesCuidado: totalDocentes,
            investigacionesAtel: Math.floor(totalDocentes * 0.1) // 10% de docentes
        };
    }
}

// Clase para gestión de gráficos
class ChartManager {
    constructor() {
        this.charts = {};
    }

    // Colores dinámicos por % de cumplimiento
    _fulfillmentColor(pct) {
        if (pct >= 100) return 'rgba(25, 135, 84, 0.8)';   // verde
        if (pct >= 50)  return 'rgba(255, 193, 7, 0.8)';   // amarillo
        return 'rgba(220, 53, 69, 0.8)';                    // rojo
    }

    createLeaderFulfillmentChart(data) {
        // data = [{name, pct}]
        const ctx = document.getElementById('leaderFulfillmentChart').getContext('2d');
        if (this.charts.leaderFulfillment) this.charts.leaderFulfillment.destroy();

        if (!data.length) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#6c757d';
            ctx.fillText('Sin datos de metas semanales', ctx.canvas.width / 2, 60);
            return;
        }

        this.charts.leaderFulfillment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: '% Cumplimiento',
                    data: data.map(d => d.pct),
                    backgroundColor: data.map(d => this._fulfillmentColor(d.pct)),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: ctx => ` ${ctx.parsed.x}%` }
                    }
                },
                scales: {
                    x: { beginAtZero: true, max: 100,
                         ticks: { callback: v => v + '%' } }
                }
            }
        });
    }

    createProvinceFulfillmentChart(data) {
        // data = [{name, pct}]
        const ctx = document.getElementById('provinceFulfillmentChart').getContext('2d');
        if (this.charts.provinceFulfillment) this.charts.provinceFulfillment.destroy();

        if (!data.length) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#6c757d';
            ctx.fillText('Sin datos de metas semanales', ctx.canvas.width / 2, 60);
            return;
        }

        this.charts.provinceFulfillment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => d.pct),
                    backgroundColor: data.map(d => this._fulfillmentColor(d.pct)),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
                    }
                }
            }
        });
    }

    createIndicatorsChart(data) {
        const ctx = document.getElementById('indicatorsChart').getContext('2d');
        
        if (this.charts.indicators) {
            this.charts.indicators.destroy();
        }

        this.charts.indicators = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'EE Visitadas',
                    'Sedes Visitadas', 
                    'Reportes de Estándares',
                    'Reportes Salud',
                    'Análisis Vulnerabilidad',
                    'Matrices Riesgo',
                    'Diagnóstico Salud',
                    'Planes Cuidado',
                    'Investigaciones ATEL'
                ],
                datasets: [{
                    label: 'Valor Actual',
                    data: [
                        data.eeVisitadas,
                        data.sedesVisitadas,
                        data.reportesEstanteria,
                        data.reportesSalud,
                        data.analisisVulnerabilidad,
                        data.matricesRiesgo,
                        data.diagnosticoSalud,
                        data.planesCuidado,
                        data.investigacionesAtel
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Análisis de Indicadores'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Clase principal de la aplicación
class EducationalTrackingApp {
    constructor() {
        this.db = new Database();
        this.calculator = new IndicatorCalculator(this.db);
        this.chartManager = new ChartManager();
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        try {
            // Verificar si hay datos en localStorage para migrar
            const localStorageData = this.getLocalStorageData();
            if (this.hasDataToMigrate(localStorageData)) {
                console.log('Migrando datos desde localStorage a SQLite...');
                try {
                    await this.db.migrateFromLocalStorage(localStorageData);
                    console.log('Migración completada');
                    this.clearLocalStorage();
                } catch (error) {
                    console.error('Error en migración:', error);
                }
            }
            
            // Inicializar la aplicación
            this.showSection('dashboard');
            await this.updateDashboard();
            await this.loadTables();
            this.updateFilters();
        } catch (error) {
            console.error('Error inicializando aplicación:', error);
        }
    }

    getLocalStorageData() {
        return {
            provinces: JSON.parse(localStorage.getItem('provinces') || '[]'),
            municipalities: JSON.parse(localStorage.getItem('municipalities') || '[]'),
            leaders: JSON.parse(localStorage.getItem('leaders') || '[]'),
            institutions: JSON.parse(localStorage.getItem('institutions') || '[]'),
            weeklyTracking: JSON.parse(localStorage.getItem('weeklyTracking') || '{}')
        };
    }

    hasDataToMigrate(data) {
        return data.provinces.length > 0 || 
               data.municipalities.length > 0 || 
               data.leaders.length > 0 || 
               data.institutions.length > 0 ||
               Object.keys(data.weeklyTracking).length > 0;
    }

    clearLocalStorage() {
        localStorage.removeItem('provinces');
        localStorage.removeItem('municipalities');
        localStorage.removeItem('leaders');
        localStorage.removeItem('institutions');
        localStorage.removeItem('weeklyTracking');
        localStorage.removeItem('indicators');
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Mostrar la sección seleccionada
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            this.currentSection = sectionId;
        }

        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
                link.classList.add('active');
            }
        });

        // Actualizar datos específicos de la sección
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        } else if (sectionId === 'indicators') {
            this.updateIndicators();
        }
    }

    // Convierte una fecha "YYYY-MM-DD" a medianoche local
    parseLocalDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // Devuelve true si el registro (week, month, year) cae dentro del rango [startStr, endStr]
    isGoalInDateRange(goal, startStr, endStr) {
        if (!startStr && !endStr) return true;
        const weekStartDay = (goal.week - 1) * 7 + 1;
        const weekEndDay   = goal.week * 7;
        const weekStart = new Date(goal.year, goal.month - 1, weekStartDay);
        const weekEnd   = new Date(goal.year, goal.month - 1, weekEndDay);
        if (startStr && weekEnd   < this.parseLocalDate(startStr)) return false;
        if (endStr   && weekStart > this.parseLocalDate(endStr))   return false;
        return true;
    }

    // [{name, fulfillment%}] agrupado por líder
    calcLeaderFulfillment(goals) {
        const KEYS = ['eeVisitadas','sedesVisitadas','reportesEstanteria','reportesSalud',
            'analisisVulnerabilidad','matricesRiesgo','diagnosticoSalud','planesCuidado','investigacionesAtel'];
        const map = {};
        for (const g of goals) {
            const lid = g.leader_id;
            if (!map[lid]) map[lid] = { name: g.leader_name || g.leaderName || `Líder ${lid}`, goal: 0, actual: 0 };
            for (const k of KEYS) {
                map[lid].goal   += g.goals[k]  || 0;
                map[lid].actual += g.actual[k] || 0;
            }
        }
        return Object.values(map).map(l => ({
            name: l.name,
            pct: l.goal > 0 ? Math.min(Math.round(l.actual / l.goal * 100), 100) : 0
        }));
    }

    // [{name, fulfillment%}] agrupado por provincia
    calcProvinceFulfillment(goals) {
        const KEYS = ['eeVisitadas','sedesVisitadas','reportesEstanteria','reportesSalud',
            'analisisVulnerabilidad','matricesRiesgo','diagnosticoSalud','planesCuidado','investigacionesAtel'];
        const leaders      = this.db.cache.leaders;
        const municipalities = this.db.cache.municipalities;
        const provinces    = this.db.cache.provinces;
        const map = {};
        for (const g of goals) {
            const leader = leaders.find(l => l.id === g.leader_id);
            if (!leader) continue;
            const mun = municipalities.find(m => m.id === leader.municipality_id);
            if (!mun) continue;
            const prov = provinces.find(p => p.id === mun.province_id);
            if (!prov) continue;
            if (!map[prov.id]) map[prov.id] = { name: prov.name, goal: 0, actual: 0 };
            for (const k of KEYS) {
                map[prov.id].goal   += g.goals[k]  || 0;
                map[prov.id].actual += g.actual[k] || 0;
            }
        }
        return Object.values(map).map(p => ({
            name: p.name,
            pct: p.goal > 0 ? Math.min(Math.round(p.actual / p.goal * 100), 100) : 0
        }));
    }

    async updateDashboard() {
        try {
            const provinces = await this.db.getProvinces();
            const municipalities = await this.db.getMunicipalities();
            const leaders = await this.db.getLeaders();
            const institutions = await this.db.getInstitutions();

            // Actualizar contadores
            document.getElementById('totalProvinces').textContent = provinces.length;
            document.getElementById('totalMunicipalities').textContent = municipalities.length;
            document.getElementById('totalLeaders').textContent = leaders.length;
            document.getElementById('totalInstitutions').textContent = institutions.length;

            // Poblar filtro de líderes del dashboard
            const dashLeaderSelect = document.getElementById('dashFilterLeader');
            dashLeaderSelect.innerHTML = '<option value="">Todos los líderes</option>' +
                leaders.map(l => `<option value="${l.id}">${l.name}</option>`).join('');

            // Cargar tabla + gráficas de cumplimiento
            await this.loadDashboardWeeklyGoalsTable();
        } catch (error) {
            console.error('Error actualizando dashboard:', error);
        }
    }

    async loadDashboardWeeklyGoalsTable() {
        try {
            const leaders = this.db.cache.leaders;
            const leaderFilter = document.getElementById('dashFilterLeader').value;
            const startStr = document.getElementById('dashDateStart').value;
            const endStr   = document.getElementById('dashDateEnd').value;

            let allGoals = [];
            for (const leader of leaders) {
                const leaderGoals = await this.db.getLeaderWeeklyGoals(leader.id);
                allGoals.push(...leaderGoals.map(goal => ({
                    ...goal,
                    leaderName: leader.name,
                    leaderId: leader.id
                })));
            }

            if (leaderFilter) allGoals = allGoals.filter(g => g.leader_id == leaderFilter);
            allGoals = allGoals.filter(g => this.isGoalInDateRange(g, startStr, endStr));

            // Actualizar gráficas de cumplimiento
            this.chartManager.createLeaderFulfillmentChart(this.calcLeaderFulfillment(allGoals));
            this.chartManager.createProvinceFulfillmentChart(this.calcProvinceFulfillment(allGoals));

            allGoals.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                if (b.month !== a.month) return b.month - a.month;
                return b.week - a.week;
            });

            const getColor = (actual, goal) => {
                const pct = goal > 0 ? (actual / goal * 100) : 0;
                return pct >= 100 ? 'success' : pct >= 50 ? 'warning' : 'danger';
            };
            const badge = (actual, goal) => {
                const pct = goal > 0 ? Math.round(actual / goal * 100) : 0;
                return `<span class="badge bg-${getColor(actual, goal)}">${actual}/${goal} (${pct}%)</span>`;
            };

            const tbody = document.getElementById('dashWeeklyGoalsTableBody');
            if (allGoals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="text-center text-muted">No hay metas semanales registradas</td></tr>';
                return;
            }

            tbody.innerHTML = allGoals.map(goal => `
                <tr>
                    <td>${goal.leaderName}</td>
                    <td>${weekToStartDate(goal.week, goal.month, goal.year)}</td>
                    <td>${weekToEndDate(goal.week, goal.month, goal.year)}</td>
                    <td>${badge(goal.actual.eeVisitadas, goal.goals.eeVisitadas)}</td>
                    <td>${badge(goal.actual.sedesVisitadas, goal.goals.sedesVisitadas)}</td>
                    <td>${badge(goal.actual.reportesEstanteria, goal.goals.reportesEstanteria)}</td>
                    <td>${badge(goal.actual.reportesSalud, goal.goals.reportesSalud)}</td>
                    <td>${badge(goal.actual.analisisVulnerabilidad, goal.goals.analisisVulnerabilidad)}</td>
                    <td>${badge(goal.actual.matricesRiesgo, goal.goals.matricesRiesgo)}</td>
                    <td>${badge(goal.actual.diagnosticoSalud, goal.goals.diagnosticoSalud)}</td>
                    <td>${badge(goal.actual.planesCuidado, goal.goals.planesCuidado)}</td>
                    <td>${badge(goal.actual.investigacionesAtel, goal.goals.investigacionesAtel)}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando tabla de metas en dashboard:', error);
        }
    }

    async loadTables() {
        try {
            await Promise.all([
                this.loadProvincesTable(),
                this.loadMunicipalitiesTable(),
                this.loadLeadersTable(),
                this.loadInstitutionsTable(),
                this.loadWeeklyGoalsTable()
            ]);
        } catch (error) {
            console.error('Error cargando tablas:', error);
        }
    }

    async loadProvincesTable() {
        try {
            const provinces = await this.db.getProvinces();
            const municipalities = await this.db.getMunicipalities();
            
            console.log('loadProvincesTable - provinces:', provinces);
            console.log('loadProvincesTable - municipalities:', municipalities);
            console.log('loadProvincesTable - ¿provinces es array?', Array.isArray(provinces));
            console.log('loadProvincesTable - ¿municipalities es array?', Array.isArray(municipalities));
            
            const tbody = document.getElementById('provincesTableBody');
            
            tbody.innerHTML = provinces.map(province => {
                const municipalityCount = municipalities.filter(m => m.province_id === province.id).length;
                return `
                    <tr>
                        <td>${province.id}</td>
                        <td>${province.name}</td>
                        <td>${municipalityCount}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editProvince(${province.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProvince(${province.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando tabla de provincias:', error);
            console.error('Error details:', error.message, error.stack);
        }
    }

    async loadMunicipalitiesTable() {
        try {
            const municipalities = await this.db.getMunicipalities();
            const provinces = await this.db.getProvinces();
            const leaders = await this.db.getLeaders();
            const institutions = await this.db.getInstitutions();
            
            console.log('loadMunicipalitiesTable - municipalities:', municipalities);
            console.log('loadMunicipalitiesTable - provinces:', provinces);
            console.log('loadMunicipalitiesTable - ¿municipalities es array?', Array.isArray(municipalities));
            console.log('loadMunicipalitiesTable - ¿provinces es array?', Array.isArray(provinces));
            
            const tbody = document.getElementById('municipalitiesTableBody');
            
            tbody.innerHTML = municipalities.map(municipality => {
                const province = provinces.find(p => p.id === municipality.province_id);
                const leader = leaders.find(l => l.id === municipality.leader_id);
                const institutionCount = institutions.filter(i => i.leader_id === municipality.leader_id).length;
                
                return `
                    <tr>
                        <td>${municipality.id}</td>
                        <td>${municipality.name}</td>
                        <td>${province ? province.name : 'N/A'}</td>
                        <td>${leader ? leader.name : 'Sin asignar'}</td>
                        <td>${institutionCount}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editMunicipality(${municipality.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMunicipality(${municipality.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando tabla de municipios:', error);
        }
    }

    async loadLeadersTable() {
        try {
            const leaders = await this.db.getLeaders();
            const municipalities = await this.db.getMunicipalities();
            const institutions = await this.db.getInstitutions();
            const tbody = document.getElementById('leadersTableBody');
            
            tbody.innerHTML = leaders.map(leader => {
                const municipality = municipalities.find(m => m.id === leader.municipality_id);
                const institutionCount = institutions.filter(i => i.leader_id === leader.id).length;
                
                return `
                    <tr>
                        <td>${leader.id}</td>
                        <td>${leader.name}</td>
                        <td>${leader.contact}</td>
                        <td>${municipality ? municipality.name : 'N/A'}</td>
                        <td>${institutionCount}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editLeader(${leader.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteLeader(${leader.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando tabla de líderes:', error);
        }
    }

    async loadInstitutionsTable() {
        try {
            const institutions = await this.db.getInstitutions();
            const leaders = await this.db.getLeaders();
            const tbody = document.getElementById('institutionsTableBody');
            
            tbody.innerHTML = institutions.map(institution => {
                const leader = leaders.find(l => l.id === institution.leader_id);
                const totalSedes = institution.urban_sedes + institution.rural_sedes;
                
                return `
                    <tr>
                        <td>${institution.id}</td>
                        <td>${institution.name}</td>
                        <td>${leader ? leader.name : 'Sin asignar'}</td>
                        <td>${institution.urban_sedes}</td>
                        <td>${institution.rural_sedes}</td>
                        <td>${institution.teacher_count}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editInstitution(${institution.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteInstitution(${institution.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando tabla de instituciones:', error);
        }
    }

    async loadWeeklyGoalsTable() {
        try {
            const leaders = await this.db.getLeaders();
            const tbody = document.getElementById('weeklyGoalsTableBody');
            const startStr    = document.getElementById('indDateStart').value;
            const endStr      = document.getElementById('indDateEnd').value;
            const leaderFilter = document.getElementById('filterLeader').value;

            let allGoals = [];

            for (const leader of leaders) {
                const leaderGoals = await this.db.getLeaderWeeklyGoals(leader.id);
                allGoals.push(...leaderGoals.map(goal => ({
                    ...goal,
                    leaderName: leader.name,
                    leaderId: leader.id
                })));
            }

            if (leaderFilter) allGoals = allGoals.filter(g => g.leader_id == leaderFilter);
            allGoals = allGoals.filter(g => this.isGoalInDateRange(g, startStr, endStr));
            
            // Ordenar por fecha (más reciente primero)
            allGoals.sort((a, b) => {
                const dateA = new Date(b.year, b.month - 1, b.week * 7);
                const dateB = new Date(a.year, a.month - 1, a.week * 7);
                return dateA - dateB;
            });
            
            tbody.innerHTML = allGoals.map(goal => {
                const getProgressColor = (actual, goal) => {
                    const percentage = goal > 0 ? (actual / goal * 100) : 0;
                    if (percentage >= 100) return 'text-success';
                    if (percentage >= 50) return 'text-warning';
                    return 'text-danger';
                };
                
                const getProgressBadge = (actual, goal) => {
                    const percentage = goal > 0 ? Math.round(actual / goal * 100) : 0;
                    const color = percentage >= 100 ? 'success' : percentage >= 50 ? 'warning' : 'danger';
                    return `<span class="badge bg-${color}">${percentage}%</span>`;
                };
                
                return `
                    <tr>
                        <td>${goal.leaderName}</td>
                        <td>${weekToStartDate(goal.week, goal.month, goal.year)}</td>
                        <td>${weekToEndDate(goal.week, goal.month, goal.year)}</td>
                        <td class="${getProgressColor(goal.actual.eeVisitadas, goal.goals.eeVisitadas)}">
                            ${goal.actual.eeVisitadas}/${goal.goals.eeVisitadas} ${getProgressBadge(goal.actual.eeVisitadas, goal.goals.eeVisitadas)}
                        </td>
                        <td class="${getProgressColor(goal.actual.sedesVisitadas, goal.goals.sedesVisitadas)}">
                            ${goal.actual.sedesVisitadas}/${goal.goals.sedesVisitadas} ${getProgressBadge(goal.actual.sedesVisitadas, goal.goals.sedesVisitadas)}
                        </td>
                        <td class="${getProgressColor(goal.actual.reportesEstanteria, goal.goals.reportesEstanteria)}">
                            ${goal.actual.reportesEstanteria}/${goal.goals.reportesEstanteria} ${getProgressBadge(goal.actual.reportesEstanteria, goal.goals.reportesEstanteria)}
                        </td>
                        <td class="${getProgressColor(goal.actual.reportesSalud, goal.goals.reportesSalud)}">
                            ${goal.actual.reportesSalud}/${goal.goals.reportesSalud} ${getProgressBadge(goal.actual.reportesSalud, goal.goals.reportesSalud)}
                        </td>
                        <td class="${getProgressColor(goal.actual.analisisVulnerabilidad, goal.goals.analisisVulnerabilidad)}">
                            ${goal.actual.analisisVulnerabilidad}/${goal.goals.analisisVulnerabilidad} ${getProgressBadge(goal.actual.analisisVulnerabilidad, goal.goals.analisisVulnerabilidad)}
                        </td>
                        <td class="${getProgressColor(goal.actual.matricesRiesgo, goal.goals.matricesRiesgo)}">
                            ${goal.actual.matricesRiesgo}/${goal.goals.matricesRiesgo} ${getProgressBadge(goal.actual.matricesRiesgo, goal.goals.matricesRiesgo)}
                        </td>
                        <td class="${getProgressColor(goal.actual.diagnosticoSalud, goal.goals.diagnosticoSalud)}">
                            ${goal.actual.diagnosticoSalud}/${goal.goals.diagnosticoSalud} ${getProgressBadge(goal.actual.diagnosticoSalud, goal.goals.diagnosticoSalud)}
                        </td>
                        <td class="${getProgressColor(goal.actual.planesCuidado, goal.goals.planesCuidado)}">
                            ${goal.actual.planesCuidado}/${goal.goals.planesCuidado} ${getProgressBadge(goal.actual.planesCuidado, goal.goals.planesCuidado)}
                        </td>
                        <td class="${getProgressColor(goal.actual.investigacionesAtel, goal.goals.investigacionesAtel)}">
                            ${goal.actual.investigacionesAtel}/${goal.goals.investigacionesAtel} ${getProgressBadge(goal.actual.investigacionesAtel, goal.goals.investigacionesAtel)}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editWeeklyGoal(${goal.leaderId}, ${goal.week}, ${goal.month}, ${goal.year})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteWeeklyGoal(${goal.leaderId}, ${goal.week}, ${goal.month}, ${goal.year})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando tabla de metas semanales:', error);
        }
    }

    getMonthName(monthNumber) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[monthNumber - 1] || '';
    }

    updateFilters() {
        this.updateProvinceFilter();
        this.updateMunicipalityFilter();
        this.updateLeaderFilter();
    }

    updateProvinceFilter() {
        const provinces = this.db.cache.provinces;
        const select = document.getElementById('filterProvince');

        select.innerHTML = '<option value="">Todas las provincias</option>' +
            provinces.map(province =>
                `<option value="${province.id}">${province.name}</option>`
            ).join('');
    }

    updateMunicipalityFilter() {
        const municipalities = this.db.cache.municipalities;
        const select = document.getElementById('filterMunicipality');

        select.innerHTML = '<option value="">Todos los municipios</option>' +
            municipalities.map(municipality =>
                `<option value="${municipality.id}">${municipality.name}</option>`
            ).join('');
    }

    updateLeaderFilter() {
        const leaders = this.db.cache.leaders;
        const select = document.getElementById('filterLeader');

        select.innerHTML = '<option value="">Todos los líderes</option>' +
            leaders.map(leader =>
                `<option value="${leader.id}">${leader.name}</option>`
            ).join('');
    }

    async updateIndicators() {
        const provinceId = document.getElementById('filterProvince').value;
        const municipalityId = document.getElementById('filterMunicipality').value;
        const leaderId  = document.getElementById('filterLeader').value;
        const startStr  = document.getElementById('indDateStart').value;
        const endStr    = document.getElementById('indDateEnd').value;

        const filter = {};
        if (provinceId)    filter.provinceId    = parseInt(provinceId);
        if (municipalityId) filter.municipalityId = parseInt(municipalityId);
        if (leaderId)      filter.leaderId      = parseInt(leaderId);

        const indicators = this.calculator.calculateIndicators(filter);

        // Actualizar tabla de metas semanales (aplica filtros de fecha)
        this.loadWeeklyGoalsTable();

        // Actualizar gráfico radar
        this.chartManager.createIndicatorsChart(indicators);

    }
}

// Hacer funciones disponibles globalmente
window.showSection = function(sectionId) {
    if (app) app.showSection(sectionId);
};

window.updateIndicators = function() {
    if (app) app.updateIndicators();
};

window.loadDashboardWeeklyGoalsTable = function() {
    if (app) app.loadDashboardWeeklyGoalsTable();
};

window.showProvinceModal = showProvinceModal;
window.showMunicipalityModal = showMunicipalityModal;
window.showLeaderModal = showLeaderModal;
window.showInstitutionModal = showInstitutionModal;
window.showWeeklyGoalModal = showWeeklyGoalModal;
window.saveProvince = saveProvince;
window.saveMunicipality = saveMunicipality;
window.saveLeader = saveLeader;
window.saveInstitution = saveInstitution;
window.saveWeeklyGoal = saveWeeklyGoal;
window.editProvince = editProvince;
window.deleteProvince = deleteProvince;
window.editMunicipality = editMunicipality;
window.deleteMunicipality = deleteMunicipality;
window.editLeader = editLeader;
window.deleteLeader = deleteLeader;
window.editInstitution = editInstitution;
window.deleteInstitution = deleteInstitution;
window.editWeeklyGoal = editWeeklyGoal;
window.deleteWeeklyGoal = deleteWeeklyGoal;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    app = new EducationalTrackingApp();
});
