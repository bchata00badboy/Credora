// Front-end\Src\Pages\Main\js\ahorro.js

/* --- LÓGICA DEL MÓDULO DE METAS (CONECTADO A API) --- */
let metas = []; 
let idSeleccionado = null;

// Inicialización Global
window.iniciarModuloAhorro = function() {
    console.log("💰 Iniciando módulo de Metas...");
    cargarMetasDesdeAPI();
};

// --- API: CARGAR METAS ---
async function cargarMetasDesdeAPI() {
    const grid = document.getElementById('gridMetas');
    if(grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="bx bx-loader-alt bx-spin" style="font-size:2rem;"></i><br>Cargando tus metas...</div>';

    try {
        if (window.CredoraAPI) {
            const data = await window.CredoraAPI.request('/ahorro/metas');
            if (data) {
                metas = data.map(m => ({
                    id: m.id_meta,
                    nombre: m.nombre_meta,
                    objetivo: parseFloat(m.monto_objetivo),
                    actual: parseFloat(m.monto_actual),
                    fecha: m.fecha_limite.split('T')[0],
                    estado: m.estado
                }));
                renderizar();
            }
        }
    } catch (e) {
        console.error("Error cargando metas:", e);
        if(grid) grid.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Error al cargar metas.</div>';
    }
}

// --- RENDERIZADO VISUAL ---
function renderizar() {
    actualizarKPIs();
    const grid = document.getElementById('gridMetas');
    if(!grid) return;
    
    grid.innerHTML = "";

    if (metas.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-bullseye" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; color:var(--color-primary);"></i>
                <h3>No tienes metas activas</h3>
                <p>Usa el botón + para empezar a ahorrar.</p>
            </div>`;
        return;
    }

    metas.forEach(meta => {
        const analisis = analizarMeta(meta);
        const porcentaje = Math.min((meta.actual / meta.objetivo) * 100, 100);
        const isFinalizado = meta.estado === 'Finalizado';
        
        const fechaParts = meta.fecha.split('-');
        const fechaObj = new Date(fechaParts[0], fechaParts[1]-1, fechaParts[2]);
        const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

        const html = `
        <div class="card" style="position:relative; overflow:hidden;">
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
                <button class="btn btn-blue" style="flex: 1; justify-content:center;" onclick="abrirAbonar(${meta.id})" ${isFinalizado ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
                    <i class="fa-solid fa-piggy-bank" style="margin-right:5px;"></i> Abonar
                </button>
                <button class="btn btn-secondary" onclick="eliminarMeta(${meta.id})" style="color: var(--risk-red); border-color: var(--risk-red);" title="Eliminar y reembolsar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        `;
        grid.insertAdjacentHTML('beforeend', html);
    });
}

function actualizarKPIs() {
    const kpiCount = document.getElementById('kpiCount');
    if(kpiCount) kpiCount.innerText = metas.filter(m => m.estado !== 'Finalizado').length;
    
    const totalAhorrado = metas.reduce((sum, m) => sum + m.actual, 0);
    const totalObjetivo = metas.reduce((sum, m) => sum + m.objetivo, 0);
    
    const kpiTotal = document.getElementById('kpiTotal');
    if(kpiTotal) kpiTotal.innerText = "$" + totalAhorrado.toLocaleString('en-US', {minimumFractionDigits: 2});

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

    const btn = document.querySelector('#modalCrear .btn-support');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Creando...";
    btn.disabled = true;

    try {
        const payload = { nombre, objetivo, fecha_limite: fecha };
        await window.CredoraAPI.request('/ahorro/metas', 'POST', payload);
        
        showToast('success', 'Meta creada exitosamente');
        limpiarInputs();
        cerrarModal('modalCrear');
        cargarMetasDesdeAPI();

    } catch (e) {
        showToast('error', 'Error: ' + e.message);
    } finally {
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    }
}

// --- API: ABONAR ---
async function confirmarDeposito() {
    const inp = document.getElementById('inDeposito');
    const monto = parseFloat(inp.value);
    
    if (!monto || monto <= 0) { showToast('warn', 'Monto inválido'); return; }
    if (!idSeleccionado) return;

    const btn = document.querySelector('#modalAbonar .btn-support');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Procesando...";
    btn.disabled = true;

    try {
        const res = await window.CredoraAPI.request(`/ahorro/metas/${idSeleccionado}/abonar`, 'POST', { monto });
        
        showToast('success', `¡Abono exitoso! Saldo meta: $${res.nuevo_saldo_meta.toLocaleString('en-US')}`);
        if(res.meta_completada) showToast('success', '🎉 ¡Felicidades! Meta completada.', 5000);

        cerrarModal('modalAbonar');
        inp.value = "";
        cargarMetasDesdeAPI();

    } catch (e) {
        showToast('error', e.message || 'Fondos insuficientes o error de conexión');
    } finally {
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    }
}

// --- API: ELIMINAR (CORREGIDA - LÓGICA ASÍNCRONA) ---
window.eliminarMeta = async function(id) {
    const msg = '¿Eliminar esta meta? El dinero ahorrado volverá a tu cuenta principal.';
    
    let confirmado = false;

    // Verificar si existe la función global del Main.js
    if(typeof window.showConfirm === 'function') {
        // AWAIT IMPORTANTE: Esperamos a que el usuario haga clic en SÍ o NO
        confirmado = await window.showConfirm('Eliminar meta', msg);
    } else {
        // Fallback por si acaso
        confirmado = confirm(msg);
    }

    // Si el usuario dijo SÍ, procedemos
    if (confirmado) {
        try {
            await window.CredoraAPI.request(`/ahorro/metas/${id}`, 'DELETE');
            showToast('success', 'Meta eliminada y fondos reembolsados.');
            cargarMetasDesdeAPI();
        } catch (e) {
            showToast('error', 'Error al eliminar: ' + e.message);
        }
    }
};

// --- UTILS ---
function analizarMeta(meta) {
    if (meta.estado === 'Finalizado') return { texto: "¡Meta completada! 🎉", color: "#2ecc71" };
    
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const parts = meta.fecha.split('-');
    const limite = new Date(parts[0], parts[1]-1, parts[2]);
    
    const diffTime = limite - hoy;
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const restante = meta.objetivo - meta.actual;

    if (dias < 0) return { texto: "Tiempo expirado.", color: "var(--risk-red)" };
    if (dias === 0) return { texto: "¡Último día para completar!", color: "var(--accent-color)" };
    
    const ahorroDiario = restante / dias;
    // Evitar infinito si dias=0 o negativo
    const diarioStr = (dias > 0) ? ahorroDiario.toFixed(2) : restante.toFixed(2);

    return { 
        texto: `Faltan ${dias} días. Ahorra <b>$${diarioStr}</b> diarios.`, 
        color: "var(--color-surface)" 
    };
}

// Funciones de Modal
window.abrirModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.add('active'); 
        modal.style.opacity = "1"; 
        modal.style.visibility = "visible";
        
        if(id === 'modalCrear') {
            const today = new Date().toISOString().split('T')[0];
            const inFecha = document.getElementById('inFecha');
            if(inFecha) inFecha.min = today;
            limpiarInputs();
        }
        if(id === 'modalAbonar') {
            setTimeout(() => {
                const inp = document.getElementById('inDeposito');
                if(inp) { inp.value = ''; inp.focus(); }
            }, 100);
        }
    }
};

window.abrirAbonar = function(id) { 
    idSeleccionado = id; 
    abrirModal('modalAbonar'); 
};

function limpiarInputs() { 
    const n = document.getElementById('inNombre'); if(n) n.value = ""; 
    const m = document.getElementById('inMonto'); if(m) m.value = ""; 
    const f = document.getElementById('inFecha'); if(f) f.value = ""; 
}

window.intentarCerrarModal = async function(id) {
    if (id === 'modalCrear') {
        const nombre = document.getElementById('inNombre').value.trim();
        const monto = document.getElementById('inMonto').value.trim();
        if (nombre || monto) {
            let discard = false;
            if(typeof window.showConfirm === 'function') {
                discard = await window.showConfirm('Descartar', '¿Salir sin guardar la meta?');
            } else {
                discard = confirm('¿Salir sin guardar?');
            }
            
            if (discard) {
                limpiarInputs();
                cerrarModal(id);
            }
            return;
        }
    }
    cerrarModal(id);
};

window.cerrarModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('active');
        modal.style.opacity = "0"; 
        modal.style.visibility = "hidden";
    }
};

// Fallbacks globales
if (typeof window.showToast !== 'function') {
    window.showToast = function(type, message) { alert(message); };
}