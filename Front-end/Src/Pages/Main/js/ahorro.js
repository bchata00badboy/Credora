/* --- LÓGICA DEL MÓDULO DE METAS (CONECTADO A API) --- */
let metas = []; // Cache local para renderizado rápido
let idSeleccionado = null;

// Inicialización
window.iniciarModuloAhorro = function() {
    console.log("💰 Iniciando módulo de Metas...");
    cargarMetasDesdeAPI();
};

// --- API: CARGAR METAS ---
async function cargarMetasDesdeAPI() {
    const grid = document.getElementById('gridMetas');
    if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px;">Cargando tus metas...</div>';

    try {
        if (window.CredoraAPI) {
            const data = await window.CredoraAPI.request('/ahorro/metas');
            if (data) {
                // Mapeamos los datos del backend al formato que usa tu renderizador
                metas = data.map(m => ({
                    id: m.id_meta,
                    nombre: m.nombre_meta,
                    objetivo: parseFloat(m.monto_objetivo),
                    actual: parseFloat(m.monto_actual),
                    fecha: m.fecha_limite.split('T')[0], // Solo fecha YYYY-MM-DD
                    estado: m.estado
                }));
                renderizar();
            }
        }
    } catch (e) {
        console.error("Error cargando metas:", e);
        if(grid) grid.innerHTML = '<div style="text-align:center; color:red;">Error al cargar metas.</div>';
    }
}

// --- RENDERIZADO (IGUAL A TU DISEÑO) ---
function renderizar() {
    actualizarKPIs();
    const grid = document.getElementById('gridMetas');
    if(!grid) return;
    
    grid.innerHTML = "";

    if (metas.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No tienes metas activas</h3>
                <p>Usa el botón + para empezar a ahorrar.</p>
            </div>`;
        return;
    }

    metas.forEach(meta => {
        const analisis = analizarMeta(meta);
        const porcentaje = Math.min((meta.actual / meta.objetivo) * 100, 100);
        const isFinalizado = meta.estado === 'Finalizado';
        
        // Formato de Fecha
        const fechaParts = meta.fecha.split('-');
        // Crear fecha localmente sin zona horaria
        const fechaObj = new Date(fechaParts[0], fechaParts[1]-1, fechaParts[2]);
        const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

        const html = `
        <div class="card">
            <div class="goal-header">
                <div>
                    <h3 class="goal-title">${meta.nombre}</h3>
                    <div class="goal-date">
                        <i class="fa-regular fa-calendar"></i> ${fechaStr}
                    </div>
                </div>
                <span class="badge ${isFinalizado ? 'ingreso' : 'compras'}">
                    ${meta.estado}
                </span>
            </div>

            <div class="goal-compact-amount">
                <span class="amount-big">$${meta.actual.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="amount-small"> / $${meta.objetivo.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>

            <div class="goal-progress-bg">
                <div class="goal-progress-fill ${isFinalizado ? 'done' : ''}" style="width: ${porcentaje}%"></div>
            </div>

            <div class="tip-container" style="border-left-color: ${analisis.color}">
                ${analisis.texto}
            </div>

            <div style="display: flex; gap: 10px; border-top: 1px solid var(--color-border); padding-top: 15px;">
                <button class="btn btn-blue" style="flex: 1; justify-content:center;" onclick="abrirAbonar(${meta.id})" ${isFinalizado ? 'disabled style="opacity:0.6"' : ''}>
                    Abonar
                </button>
                <button class="btn btn-secondary" onclick="eliminarMeta(${meta.id})" style="color: var(--risk-red); border-color: var(--risk-red);">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        `;
        grid.insertAdjacentHTML('beforeend', html);
    });
}

function actualizarKPIs() {
    // KPI 1: Cantidad
    const kpiCount = document.getElementById('kpiCount');
    if(kpiCount) kpiCount.innerText = metas.filter(m => m.estado !== 'Finalizado').length;
    
    // KPI 2: Total Ahorrado
    const totalAhorrado = metas.reduce((sum, m) => sum + m.actual, 0);
    const totalObjetivo = metas.reduce((sum, m) => sum + m.objetivo, 0);
    
    const kpiTotal = document.getElementById('kpiTotal');
    if(kpiTotal) kpiTotal.innerText = "$" + totalAhorrado.toLocaleString('en-US', {minimumFractionDigits: 2});

    // KPI 3: Progreso General
    let progresoGlobal = 0;
    if (totalObjetivo > 0) {
        progresoGlobal = (totalAhorrado / totalObjetivo) * 100;
    }
    
    const kpiGlobal = document.getElementById('kpiGlobal');
    if(kpiGlobal) kpiGlobal.innerText = progresoGlobal.toFixed(0) + "%";
}

// --- API: CREAR META ---
async function guardarMeta() {
    const nombre = document.getElementById('inNombre').value;
    const objetivo = parseFloat(document.getElementById('inMonto').value);
    const fecha = document.getElementById('inFecha').value;

    if (!nombre || !objetivo || objetivo <= 0 || !fecha) { 
        showToast('warn', "Por favor completa todos los campos correctamente"); 
        return; 
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (fecha < todayStr) { 
        showToast('warn', 'La fecha no puede ser anterior a hoy.'); 
        return; 
    }

    // Botón Loading (opcional, si quisieras agregarle un ID al botón de crear)
    
    try {
        const payload = { nombre, objetivo, fecha_limite: fecha };
        await window.CredoraAPI.request('/ahorro/metas', 'POST', payload);
        
        showToast('success', 'Meta creada exitosamente');
        limpiarInputs();
        
        // Cerrar Modal
        const modal = document.getElementById('modalCrear');
        if(modal) {
            modal.classList.remove('active');
            modal.style.opacity = "0"; 
            modal.style.visibility = "hidden";
        }
        
        // Recargar datos
        cargarMetasDesdeAPI();

    } catch (e) {
        showToast('error', 'Error al crear meta: ' + e.message);
    }
}

// --- API: ABONAR ---
async function confirmarDeposito() {
    const monto = parseFloat(document.getElementById('inDeposito').value);
    if (!monto || monto <= 0) { showToast('warn', 'Monto inválido'); return; }
    if (!idSeleccionado) return;

    try {
        const res = await window.CredoraAPI.request(`/ahorro/metas/${idSeleccionado}/abonar`, 'POST', { monto });
        
        showToast('success', `¡Abono exitoso! Saldo meta: $${res.nuevo_saldo_meta}`);
        if(res.meta_completada) showToast('success', '🎉 ¡Felicidades! Meta completada.', 5000);

        // Cerrar modal
        const modal = document.getElementById('modalAbonar');
        if(modal) {
            modal.classList.remove('active');
            modal.style.opacity = "0"; 
            modal.style.visibility = "hidden";
        }
        document.getElementById('inDeposito').value = "";
        
        // Recargar datos
        cargarMetasDesdeAPI();

    } catch (e) {
        showToast('error', e.message || 'Error al abonar (verifica tu saldo)');
    }
}

// --- API: ELIMINAR ---
function eliminarMeta(id) {
    showConfirm('Eliminar meta', '¿Eliminar esta meta? El dinero ahorrado volverá a tu cuenta principal.', async () => {
        try {
            await window.CredoraAPI.request(`/ahorro/metas/${id}`, 'DELETE');
            showToast('success', 'Meta eliminada y fondos reembolsados.');
            cargarMetasDesdeAPI();
        } catch (e) {
            showToast('error', 'Error al eliminar: ' + e.message);
        }
    });
}

// --- UTILS (Sin cambios mayores) ---
function analizarMeta(meta) {
    if (meta.estado === 'Finalizado') return { texto: "¡Meta completada! 🎉", color: "#2ecc71" };
    
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const parts = meta.fecha.split('-');
    const limite = new Date(parts[0], parts[1]-1, parts[2]);
    
    const diffTime = limite - hoy;
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const restante = meta.objetivo - meta.actual;

    if (dias < 0) return { texto: "Tiempo expirado.", color: "var(--risk-red)" };
    if (dias === 0) return { texto: "¡Último día!", color: "var(--accent-color)" };
    
    // Cálculo de ahorro diario sugerido
    const ahorroDiario = restante / dias;
    return { 
        texto: `Faltan ${dias} días. Ahorra <b>$${ahorroDiario.toFixed(2)}</b> diarios.`, 
        color: "var(--color-surface)" 
    };
}

/* --- Toast / Alert utility --- */
function showToast(type, message, timeout = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '<i class="fa-solid fa-check"></i>' : type === 'error' ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>'}</div>
        <div class="toast-msg">${message}</div>
    `;

    container.appendChild(toast);
    // Force reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

function abrirModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.add('active'); 
        modal.style.opacity = "1"; 
        modal.style.visibility = "visible";
        
        // Bloquear fechas pasadas al abrir
        if(id === 'modalCrear') {
            const today = new Date().toISOString().split('T')[0];
            const inFecha = document.getElementById('inFecha');
            if(inFecha) inFecha.min = today;
        }
        // Focus al input de abono
        if(id === 'modalAbonar') {
            setTimeout(() => {
                const inp = document.getElementById('inDeposito');
                if(inp) inp.focus();
            }, 100);
        }
    }
}

function abrirAbonar(id) { idSeleccionado = id; abrirModal('modalAbonar'); }

function limpiarInputs() { 
    const n = document.getElementById('inNombre'); if(n) n.value = ""; 
    const m = document.getElementById('inMonto'); if(m) m.value = ""; 
    const f = document.getElementById('inFecha'); if(f) f.value = ""; 
}

// Reutilizamos showConfirm del Main.js si existe, sino usamos fallback
if (typeof window.showConfirm !== 'function') {
    window.showConfirm = function(title, message, onConfirm) {
        if(confirm(message)) onConfirm();
    }
}

function intentarCerrarModal(id) {
    if (id === 'modalCrear') {
        const nombre = document.getElementById('inNombre').value.trim();
        const monto = document.getElementById('inMonto').value.trim();
        const fecha = document.getElementById('inFecha').value.trim();
        const hasData = nombre !== '' || monto !== '' || fecha !== '';
        if (hasData) {
             showConfirm('Tienes datos sin guardar.', '¿Deseas descartar los cambios y cerrar?', () => {
                    limpiarInputs();
                    cerrarModal(id);
                });
            return;
        }
    }
    cerrarModal(id);
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('active');
        modal.style.opacity = "0"; 
        modal.style.visibility = "hidden";
    }
}