// Front-end\Src\Pages\Main\Main_Parts\Main_Admin\admin.js

(function() {
    // 1. SELECTORES
    const tbody = document.getElementById('users-tbody');
    const searchInput = document.getElementById('admin-search');
    const filterStatus = document.getElementById('filter-status');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const logoutBtn = document.getElementById('btn-logout');

    let users = [];

    // 2. DATOS DE EJEMPLO
    const mockUsers = [
        { id: 1, nombre: 'Carlos Mendoza', email: 'c.mendoza@email.com', cedula: '0102030405', estado: 'APROBADO', activo: true },
        { id: 2, nombre: 'Ana Silvia Reyes', email: 'ana.reyes@email.com', cedula: '0987654321', estado: 'PENDIENTE', activo: true },
        { id: 3, nombre: 'Jorge Luis Torres', email: 'jorge.torres@email.com', cedula: '1122334455', estado: 'APROBADO', activo: false },
        { id: 4, nombre: 'Maria Fernanda', email: 'mafer@email.com', cedula: '5544332211', estado: 'PENDIENTE', activo: true }
    ];

    // 3. FUNCIONES DE RENDERIZADO
    function renderList(list) {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted)">No se encontraron resultados.</td></tr>`;
            return;
        }

        list.forEach(u => {
            const tr = document.createElement('tr');
            const isAprobado = u.estado.toUpperCase() === 'APROBADO';
            
            tr.innerHTML = `
                <td><strong>${u.nombre}</strong></td>
                <td>${u.email}</td>
                <td class="monospace">${u.cedula}</td>
                <td>
                    <span class="status-badge ${isAprobado ? 'status-verified' : 'status-pending'}">
                        ${isAprobado ? 'Aprobado' : 'Pendiente'}${u.activo ? '' : ' (Inactivo)'}
                    </span>
                </td>
                <td class="text-right">
                    <button class="btn-action btn-verify" title="Verificar/Revertir">
                        <i class='bx ${isAprobado ? 'bx-undo' : 'bx-check-circle'}'></i>
                    </button>
                    <button class="btn-action btn-toggle" title="${u.activo ? 'Desactivar' : 'Activar'}">
                        <i class='bx ${u.activo ? 'bx-hide' : 'bx-show'}'></i>
                    </button>
                    <button class="btn-action btn-delete" title="Eliminar">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;

            // Listeners dinámicos
            tr.querySelector('.btn-verify').addEventListener('click', () => toggleVerify(u.id));
            tr.querySelector('.btn-toggle').addEventListener('click', () => toggleActive(u.id));
            tr.querySelector('.btn-delete').addEventListener('click', () => deleteUser(u.id));

            tbody.appendChild(tr);
        });
    }

    // 4. LÓGICA DE DATOS
    function loadUsers() {
        users = mockUsers; // Aquí conectarías tu API
        renderList(users);
    }

    function toggleActive(id) {
        const u = users.find(x => x.id === id);
        if(u) { u.activo = !u.activo; applyFilters(); }
    }

    function toggleVerify(id) {
        const u = users.find(x => x.id === id);
        if(u) { u.estado = (u.estado === 'APROBADO') ? 'PENDIENTE' : 'APROBADO'; applyFilters(); }
    }

    function deleteUser(id) {
        (async function(){
            const ok = await showConfirm('Eliminar usuario', '¿Eliminar usuario?');
            if(ok) {
                users = users.filter(x => x.id !== id);
                applyFilters();
            }
        })();
    }

    function applyFilters() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        const status = (filterStatus?.value || 'all').toLowerCase();

        const filtered = users.filter(u => {
            const matchText = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cedula.includes(q);
            const matchStatus = status === 'all' || u.estado.toLowerCase() === status;
            return matchText && matchStatus;
        });
        renderList(filtered);
    }

    // 5. MODO OSCURO (LÓGICA)
    function initTheme() {
        // Verificar preferencia guardada o del sistema
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    function setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        
        // Cambiar icono del botón
        const icon = themeToggleBtn.querySelector('i');
        if(themeName === 'dark'){
            icon.classList.replace('bx-moon', 'bx-sun');
        } else {
            icon.classList.replace('bx-sun', 'bx-moon');
        }
    }

    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // 6. EVENT LISTENERS GENERALES
    if(searchInput) searchInput.addEventListener('input', applyFilters);
    if(filterStatus) filterStatus.addEventListener('change', applyFilters);
    if(logoutBtn) logoutBtn.addEventListener('click', async () => {
        const ok = await showConfirm('Cerrar sesión', '¿Deseas cerrar sesión?');
        if(ok) window.location.href = 'index.html';
    });

    // Función reutilizable para mostrar modal de confirmación
    function showConfirm(title, message) {
        return new Promise(resolve => {
            const modal = document.getElementById('confirm-modal');
            const overlay = modal.querySelector('.confirm-overlay');
            const elTitle = document.getElementById('confirm-title');
            const elMsg = document.getElementById('confirm-message');
            const btnOk = document.getElementById('confirm-ok');
            const btnCancel = document.getElementById('confirm-cancel');

            elTitle.textContent = title || 'Confirmar';
            elMsg.textContent = message || '';

            // Icono dinámico según acción
            const iconWrap = document.getElementById('confirm-icon');
            if(iconWrap) {
                const lc = (title || '').toLowerCase();
                iconWrap.classList.remove('danger');
                if(lc.includes('eliminar') || lc.includes('eliminar usuario')) {
                    iconWrap.innerHTML = "<i class='bx bx-trash'></i>";
                    iconWrap.classList.add('danger');
                } else if(lc.includes('cerrar') || lc.includes('salir')) {
                    iconWrap.innerHTML = "<i class='bx bx-log-out'></i>";
                    iconWrap.classList.add('danger');
                } else {
                    iconWrap.innerHTML = "<i class='bx bx-help-circle'></i>";
                }
            }

            function cleanup(result) {
                modal.classList.remove('active');
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
                overlay.removeEventListener('click', onCancel);
                resolve(result);
            }

            function onOk(e) { e.stopPropagation(); cleanup(true); }
            function onCancel(e) { e.stopPropagation(); cleanup(false); }

            btnOk.addEventListener('click', onOk);
            btnCancel.addEventListener('click', onCancel);
            overlay.addEventListener('click', onCancel);

            modal.classList.add('active');
            // foco en botón confirmar para accesibilidad
            btnOk.focus();
        });
    }

    // INICIALIZACIÓN
    initTheme();
    loadUsers();

})();