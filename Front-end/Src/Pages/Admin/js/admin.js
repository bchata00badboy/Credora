// Front-end/Src/Pages/Admin/js/admin.js

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
// IMPORTANTE: URL Base para imágenes (sin /api/v1)
const SERVER_URL = "http://127.0.0.1:8000"; 
const token = localStorage.getItem('credora_token');

if (!token) window.location.href = "../Login/login.html";

document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm("¿Cerrar sesión?")) {
            localStorage.removeItem('credora_token');
            window.location.href = "../Login/login.html";
        }
    });
});

window.cambiarVista = (vista) => {
    const vUsers = document.getElementById('view-usuarios');
    const vTx = document.getElementById('view-transacciones');
    const lUsers = document.getElementById('link-users');
    const lTx = document.getElementById('link-tx');

    if (vista === 'usuarios') {
        vUsers.style.display = 'block';
        vTx.style.display = 'none';
        lUsers.style.color = '#4fd1c5'; // Activo (Verde menta)
        lTx.style.color = 'white';
    } else {
        vUsers.style.display = 'none';
        vTx.style.display = 'block';
        lUsers.style.color = 'white';
        lTx.style.color = '#4fd1c5'; // Activo
        cargarTransacciones(); // Cargar datos al cambiar
    }
};

async function cargarDashboard() {
    try {
        // Métricas
        const resStats = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resStats.status === 403) {
            localStorage.removeItem('credora_token');
            window.location.href = "../Login/login.html";
            return;
        }
        const stats = await resStats.json();
        document.getElementById('stat-users').textContent = stats.total_usuarios;
        document.getElementById('stat-money').textContent = `$${stats.dinero_circulante.toLocaleString('en-US')}`;
        document.getElementById('stat-kyc').textContent = stats.kyc_pendientes;

        // Usuarios
        const resUsers = await fetch(`${API_BASE_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await resUsers.json();
        renderizarTablaUsuarios(users);

    } catch (error) {
        console.error("Error:", error);
    }
}

function renderizarTablaUsuarios(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if(users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay usuarios.</td></tr>`;
        return;
    }

    users.forEach(u => {
        const kycClass = u.estado_kyc === 'APROBADO' ? 'kyc-aprobado' : 'kyc-pendiente';
        const esAdmin = u.rol === 'admin';
        
        let botonesAccion = '';
        
        if (esAdmin) {
            botonesAccion = `<span style="color:#999;font-size:0.8rem;">Super Admin</span>`;
        } else {
            // Bloqueo
            const btnClass = u.esta_bloqueado ? 'btn-unblock' : 'btn-block';
            const iconClass = u.esta_bloqueado ? 'bx-lock-open' : 'bx-lock-alt';
            botonesAccion += `
                <button class="btn-action ${btnClass}" onclick="cambiarEstadoUsuario(${u.id_usuario}, ${!u.esta_bloqueado})">
                    <i class='bx ${iconClass}'></i>
                </button>
            `;

            // Lógica KYC (CORREGIDA)
            if (u.estado_kyc && u.estado_kyc.includes('PENDIENTE')) {
                // Pasamos el nombre del archivo entre comillas simples, o 'null' si no hay
                const archivo = u.imagen_kyc ? `'${u.imagen_kyc}'` : 'null';
                
                botonesAccion += `
                    <button class="btn-action" style="background:#fff7ed; color:#ea580c;" 
                            onclick="abrirAuditoria(${u.id_usuario}, '${u.nombre}', ${archivo})" title="Revisar">
                        <i class='bx bx-id-card'></i>
                    </button>
                `;
            }
        }

        const claseFila = u.esta_bloqueado ? 'bloqueado' : '';
        const row = `
            <tr class="${claseFila}">
                <td>#${u.id_usuario}</td>
                <td><strong>${u.nombre}</strong></td>
                <td>${u.correo}</td>
                <td>${u.rol.toUpperCase()}</td>
                <td>$${u.saldo.toLocaleString('en-US')}</td>
                <td><span class="badge-kyc ${kycClass}">${u.estado_kyc}</span></td>
                <td><div style="display:flex;">${botonesAccion}</div></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- LOGICA MODAL (CORREGIDA) ---
let usuarioAuditandoId = null;

window.abrirAuditoria = (id, nombre, archivoImagen) => {
    usuarioAuditandoId = id;
    document.getElementById('kyc-user-name').textContent = nombre;
    document.getElementById('kyc-motivo').value = ''; 
    
    const img = document.getElementById('kyc-img-preview');
    const noImg = document.getElementById('kyc-no-img');
    const modal = document.getElementById('modal-kyc');

    // Manejo de la imagen
    if (archivoImagen && archivoImagen !== 'null') {
        // Usamos la URL del servidor + /uploads/ + nombre_archivo
        img.src = `${SERVER_URL}/uploads/${archivoImagen}`;
        img.style.display = 'block';
        noImg.style.display = 'none';
        
        // Si falla la carga (ej. archivo borrado), mostrar error
        img.onerror = () => {
            img.style.display = 'none';
            noImg.style.display = 'block';
            noImg.textContent = "Error al cargar la imagen";
        };
    } else {
        img.style.display = 'none';
        noImg.style.display = 'block';
        noImg.textContent = "Sin documento adjunto";
    }

    modal.style.display = 'flex'; // Mostrar Modal (CSS Flexbox)
};

window.cerrarModalKYC = () => {
    document.getElementById('modal-kyc').style.display = 'none';
    usuarioAuditandoId = null;
    document.getElementById('kyc-img-preview').src = ""; // Limpiar memoria
};

window.enviarVeredicto = async (aprobado) => {
    if (!usuarioAuditandoId) return;
    const motivo = document.getElementById('kyc-motivo').value;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/kyc/${usuarioAuditandoId}/veredicto`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ aprobado: aprobado, motivo: motivo })
        });

        if (res.ok) {
            alert(`✅ Usuario ${aprobado ? 'APROBADO' : 'RECHAZADO'}`);
            cerrarModalKYC();
            cargarDashboard();
        } else {
            alert("Error al procesar");
        }
    } catch (e) { console.error(e); }
};

window.cambiarEstadoUsuario = async (id, bloquear) => {
    if(!confirm("¿Confirmar acción?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/usuarios/${id}/estado`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bloqueado: bloquear })
        });
        if(res.ok) cargarDashboard();
    } catch (e) { console.error(e); }
};


// --- CARGAR TRANSACCIONES ---

async function cargarTransacciones() {
    const tbody = document.getElementById('tx-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando...</td></tr>';

    try {
        const res = await fetch(`${API_BASE_URL}/admin/transacciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay movimientos registrados.</td></tr>';
            return;
        }

        data.forEach(tx => {
            // Formato de fecha
            const fecha = new Date(tx.fecha).toLocaleString();
            
            // Estilos visuales
            const esRecarga = tx.remitente === "Sistema (Recarga)";
            const colorMonto = esRecarga ? '#059669' : '#003049'; // Verde para recargas, Azul normal
            const icono = esRecarga ? "<i class='bx bx-up-arrow-alt'></i>" : "<i class='bx bx-transfer'></i>";

            const row = `
                <tr>
                    <td style="color:#666;">
                        <span style="display:block; font-size:0.75rem;">ID: ${tx.id}</span>
                        <strong style="color:#003049;">Ref: ${tx.referencia}</strong>
                    </td>
                    <td style="font-size:0.85rem;">${fecha}</td>
                    <td><strong>${tx.remitente}</strong></td>
                    <td>${tx.destinatario}</td>
                    <td>${tx.motivo}</td>
                    <td style="font-weight:bold; color:${colorMonto}; font-family:monospace;">
                        ${icono} $${tx.monto.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                    <td><span class="badge-kyc kyc-aprobado" style="font-size:0.7rem;">${tx.estado}</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color:red;">Error de conexión</td></tr>';
    }
}