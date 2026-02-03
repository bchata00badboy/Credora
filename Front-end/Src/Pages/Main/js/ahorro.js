/* --- LÓGICA DEL MÓDULO DE METAS --- */
let metas = [];
let idSeleccionado = null;

// Inicialización al cargar la sección
document.addEventListener('DOMContentLoaded', () => {
    // Si tienes un sistema de login, aquí cargarías las metas desde la BD
    renderizar();
});

function renderizar() {
    actualizarKPIs();
    const grid = document.getElementById('gridMetas');
    if(!grid) return; // Protección por si no carga el DOM
    
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
        
        // Formato de Fecha (Ajuste T00:00 para zona horaria)
        const fechaObj = new Date(meta.fecha + "T00:00:00");
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
                <span class="amount-big">$${meta.actual.toLocaleString()}</span>
                <span class="amount-small"> / $${meta.objetivo.toLocaleString()}</span>
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
    if(kpiTotal) kpiTotal.innerText = "$" + totalAhorrado.toLocaleString();

    // KPI 3: Progreso General (Base de Datos simulada)
    let progresoGlobal = 0;
    if (totalObjetivo > 0) {
        progresoGlobal = (totalAhorrado / totalObjetivo) * 100;
    }
    
    const kpiGlobal = document.getElementById('kpiGlobal');
    if(kpiGlobal) kpiGlobal.innerText = progresoGlobal.toFixed(0) + "%";
}

function guardarMeta() {
    const nombre = document.getElementById('inNombre').value;
    const objetivo = parseFloat(document.getElementById('inMonto').value);
    const fecha = document.getElementById('inFecha').value;

    if (!nombre || !objetivo || objetivo <= 0 || !fecha) { 
        showToast('warn', "Por favor completa todos los campos correctamente"); 
        return; 
    }

    // Validar que la fecha no sea pasada
    const todayStr = new Date().toISOString().split('T')[0];
    if (fecha < todayStr) { 
        showToast('warn', 'La fecha no puede ser anterior a hoy.'); 
        return; 
    }

    metas.push({ id: Date.now(), nombre, objetivo, fecha, actual: 0, estado: "En Progreso" });
    
    // Al guardar exitosamente, limpiamos y cerramos sin preguntar
    limpiarInputs();
    
    // Cerramos el modal manualmente (sin llamar a cerrarModal para evitar la confirmación doble)
    const modal = document.getElementById('modalCrear');
    if(modal) {
        modal.classList.remove('active');
        modal.style.opacity = "0"; 
        modal.style.visibility = "hidden";
    }

    renderizar();
    showToast('success', 'Meta creada exitosamente');
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
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

function confirmarDeposito() {
    const monto = parseFloat(document.getElementById('inDeposito').value);
    if (!monto || monto <= 0) { showToast('warn', 'Monto inválido'); return; }

    const idx = metas.findIndex(m => m.id === idSeleccionado);
    if (idx !== -1) {
        metas[idx].actual += monto;
        if (metas[idx].actual >= metas[idx].objetivo) metas[idx].estado = "Finalizado";
    }
    
    // Cierre forzado del modal de abono
    const modal = document.getElementById('modalAbonar');
    if(modal) {
        modal.classList.remove('active');
        modal.style.opacity = "0"; 
        modal.style.visibility = "hidden";
    }

    document.getElementById('inDeposito').value = "";
    renderizar();
}

function analizarMeta(meta) {
    if (meta.estado === 'Finalizado') return { texto: "¡Meta completada!", color: "#2ecc71" };
    
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const limite = new Date(meta.fecha + "T00:00:00");
    const dias = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    const restante = meta.objetivo - meta.actual;

    if (dias < 0) return { texto: "Tiempo expirado.", color: "var(--risk-red)" };
    if (dias === 0) return { texto: "¡Último día!", color: "var(--accent-color)" };
    
    return { texto: `Faltan ${dias} días. Ahorra <b>$${(restante/dias).toFixed(2)}</b> diarios.`, color: "var(--color-surface)" };
}

function eliminarMeta(id) {
    showConfirm('Eliminar meta', '¿Eliminar meta?', () => {
        metas = metas.filter(m => m.id !== id);
        renderizar();
    });
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
            document.getElementById('inFecha').min = today;
        }
    }
}

// --- FUNCIÓN MODIFICADA: VERIFICACIÓN AL CERRAR ---
function cerrarModal(id) {
    // Si intentamos cerrar el modal de Crear Meta
    if (id === 'modalCrear') {
        const nombre = document.getElementById('inNombre').value.trim();
        const monto = document.getElementById('inMonto').value.trim();
        const fecha = document.getElementById('inFecha').value;

        // Comprobamos si hay algún dato escrito
        if (nombre !== "" || monto !== "" || fecha !== "") {
            showConfirm('Tienes datos sin guardar.', '¿Deseas descartar los cambios y cerrar?', () => {
                limpiarInputs();
                // proceder a cerrar después de limpiar
                const modal = document.getElementById(id);
                if(modal) {
                    modal.classList.remove('active');
                    modal.style.opacity = "0"; 
                    modal.style.visibility = "hidden";
                }
            }, () => {
                // onCancel: no hacer nada (mantener el modal abierto)
            });
            return; // esperamos la respuesta del diálogo
        }
    }

    // Lógica visual para ocultar el modal
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('active');
        modal.style.opacity = "0"; 
        modal.style.visibility = "hidden";
    }
}

function abrirAbonar(id) { idSeleccionado = id; abrirModal('modalAbonar'); }

function limpiarInputs() { 
    document.getElementById('inNombre').value = ""; 
    document.getElementById('inMonto').value = ""; 
    document.getElementById('inFecha').value = ""; 
}

/* Intentar cerrar modal: si hay datos, preguntar antes de descartar */
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

/* Mostrar diálogo de confirmación reutilizable (usa .confirm-modal/.confirm-dialog) */
function showConfirm(title, message, onConfirm, onCancel) {
    // Evitar duplicados
    if (document.getElementById('confirm-discard')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'confirm-modal active';
    wrapper.id = 'confirm-discard';

    wrapper.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-dialog">
            <div class="confirm-icon danger"><i class="fa-solid fa-circle-exclamation"></i></div>
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-actions">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-confirm">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    const btnCancel = wrapper.querySelector('.btn-cancel');
    const btnConfirm = wrapper.querySelector('.btn-confirm');
    const overlay = wrapper.querySelector('.confirm-overlay');

    function closeDialog() {
        wrapper.remove();
    }

    btnCancel.addEventListener('click', () => {
        try { onCancel && onCancel(); } catch(e){}
        closeDialog();
    });
    overlay.addEventListener('click', () => {
        try { onCancel && onCancel(); } catch(e){}
        closeDialog();
    });
    btnConfirm.addEventListener('click', () => {
        try { onConfirm && onConfirm(); } catch(e){}
        closeDialog();
    });
}