/* /Front-end/Src/Pages/Main/js/Main.js */

/* =========================================
   1. LOGICA GLOBAL (DOM READY)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado: inicializando Main.js optimizado');

    // --- A. LOGOUT DESDE EL SIDEBAR ---
    const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
    if (btnLogoutSidebar) {
        btnLogoutSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("¿Estás seguro de que deseas cerrar sesión?")) {
                localStorage.removeItem('credora_token');
                window.location.href = "../Login/login.html";
            }
        });
    }

    // --- B. LOGICA DEL SIDEBAR (Visual) ---
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');

    // Minimizar sidebar
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('minimize');
        });
    }

    // --- C. DELEGACIÓN DE EVENTOS GLOBAL (SOLUCIÓN DROPDOWNS) ---
    // Esto maneja clicks en elementos que existen ahora O en el futuro (cargados por fetch)
    document.addEventListener('click', (e) => {
        
        // 1. Manejo de Dropdowns del Sidebar Principal
        const menuItem = e.target.closest('.menu-item-dropdown');
        if (menuItem) {
            if (sidebar && sidebar.classList.contains('minimize')) return;
            
            // Cerrar otros menús abiertos
            document.querySelectorAll('.menu-item-dropdown').forEach((item) => {
                if (item !== menuItem) {
                    item.classList.remove('sub-menu-toggle');
                    const otherSub = item.querySelector('.sub-menu');
                    if (otherSub) { otherSub.style.height = '0'; otherSub.style.padding = '0'; }
                }
            });

            // Abrir/Cerrar el actual
            const subMenu = menuItem.querySelector('.sub-menu');
            const isActive = menuItem.classList.toggle('sub-menu-toggle');
            if (subMenu) {
                subMenu.style.height = isActive ? `${subMenu.scrollHeight + 6}px` : '0';
                subMenu.style.padding = isActive ? '0.2rem 0' : '0';
            }
            return; // Detenemos aquí para no mezclar lógicas
        }

        // 2. Manejo de "Triggers" internos (ej. botón Transferir dentro del Dashboard)
        const trigger = e.target.closest('.dropdown-trigger');
        if (trigger) {
            e.preventDefault();
            const parentLi = trigger.closest('li');
            if (!parentLi) return;

            const submenuWrapper = parentLi.querySelector('.submenu-wrapper');
            if (!submenuWrapper) return;

            const isOpen = parentLi.classList.toggle('sub-menu-toggle');
            
            if (isOpen) {
                submenuWrapper.style.height = `${submenuWrapper.scrollHeight + 6}px`;
                submenuWrapper.style.padding = '0.2rem 0';
                submenuWrapper.classList.add('show');
                if (sidebar) sidebar.classList.add('hover'); // Expandir sidebar visualmente
                
                // Enfocar primer elemento si existe
                const firstLink = submenuWrapper.querySelector('.sub-menu-link');
                if(firstLink) firstLink.focus();
            } else {
                submenuWrapper.style.height = '0';
                submenuWrapper.style.padding = '0';
                submenuWrapper.classList.remove('show');
                if (sidebar) sidebar.classList.remove('hover');
            }
            
            // Limpiar búsqueda si se abre un menú de acción
            const searchInput = document.getElementById('searchInput');
            if (isOpen && searchInput) searchInput.value = '';
        }
    });

    // --- D. LÓGICA DE BÚSQUEDA GLOBAL ---
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = (e.target.value || '').toLowerCase().trim();

            // Filtrar filas de cualquier tabla visible
            const tableRows = document.querySelectorAll('tbody tr');
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });

            // Filtrar menú lateral
            const navItems = document.querySelectorAll('.nav_list li');
            navItems.forEach(li => {
                // Evitamos ocultar el profile o el logout si no queremos
                if(li.querySelector('.profile') || li.id === 'log_out') return;
                
                const text = li.textContent.toLowerCase();
                li.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // --- E. SIDEBAR: restaurar estado al salir con el mouse ---
    if (sidebar) {
        sidebar.addEventListener('mouseleave', () => {
            // Quitar estilo visual expandido
            sidebar.classList.remove('hover');

            // Restaurar visibilidad de todos los items del menú (por si se filtraron)
            document.querySelectorAll('.nav_list li').forEach(li => li.style.display = '');

            // Limpiar input de búsqueda si existe
            try { const si = document.getElementById('searchInput'); if(si) si.value = ''; } catch(e) {}

            // Cerrar submenus abiertos (pero mantener la sección marcada como active)
            document.querySelectorAll('.submenu-wrapper.show').forEach(sw => {
                sw.classList.remove('show');
                sw.style.height = '0';
                sw.style.padding = '0';
            });
        });
    }

    // Iniciar el enrutador SPA
    iniciarNavegacionSPA();
});


/* =========================================
   2. DICCIONARIO DE CONTROLADORES
   ========================================= */
const controladores = {
    'Main_Parts/main_home.html': iniciarInicio,
    'Main_Parts/main_profile.html': iniciarPerfil,
    'Main_Parts/main_notif.html': iniciarNotificaciones,
    'Main_Parts/main_transf1.html': iniciarTransferencias,
    'Main_Parts/main_mov.html': iniciarMovimientos,
    'Main_Parts/main_mov_data.html': iniciardatamov,
    'Main_Parts/main_config.html': iniciarConfiguracion,
    'Main_Parts/main_educ.html': iniciarEducacion
};

/* =========================================
   3. LOGICA DE NAVEGACIÓN (SPA)
   ========================================= */
function iniciarNavegacionSPA() {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) { console.error('CRÍTICO: No se encontró #contenedor-dinamico'); return; }

    // Interceptar clicks en enlaces del sidebar
    const menuLinks = document.querySelectorAll('.menu-link, .sub-menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'btn-logout-sidebar') return; // Dejar que el evento de logout lo maneje
            
            const ruta = link.getAttribute('data-vista');
            if (!ruta || ruta === '#') return;

            e.preventDefault();
            
            // Gestión de clases active
            document.querySelectorAll('.active').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
            if(link.closest('.menu-item-dropdown')) link.closest('.menu-item-dropdown').classList.add('active');

            window.cargarVista(ruta);
            
            // Si estamos en móvil o sidebar expandido por hover, limpiar estados
            const sidebar = document.getElementById('sidebar');
            if(sidebar) sidebar.classList.remove('hover');
        });
    });

    window.cargarVista = function(rutaArchivo) {
        const rutaLimpia = rutaArchivo.replace('./', '');
        
        // Animación simple de salida
        contenedor.style.opacity = '0';

        setTimeout(() => {
            fetch(rutaLimpia)
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} - ${rutaLimpia}`);
                    return respuesta.text();
                })
                .then(html => {
                    // Crear un contenedor temporal para procesar scripts
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;

                    // 1. Mover estilos al head (para que no se repitan)
                    tempDiv.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                        const href = link.getAttribute('href');
                        if (href && !document.querySelector(`link[href="${href}"]`)) {
                            const newLink = document.createElement('link');
                            newLink.rel = 'stylesheet';
                            newLink.href = href;
                            document.head.appendChild(newLink);
                        }
                        link.remove(); // Quitarlos del HTML inyectado
                    });

                    // 2. Insertar HTML limpio
                    contenedor.innerHTML = tempDiv.innerHTML;

                    // 3. Ejecutar Scripts incrustados (recursivamente)
                    const scripts = Array.from(contenedor.querySelectorAll('script'));
                    scripts.forEach(s => s.remove()); // Quitar los viejos para reinsertarlos y ejecutarlos

                    function runScripts(list, i = 0) {
                        if (i >= list.length) {
                            finalizarCarga(rutaLimpia); // Ejecutar controlador
                            return;
                        }
                        const s = list[i];
                        const newS = document.createElement('script');
                        if (s.src) {
                            newS.src = s.src;
                            newS.onload = () => runScripts(list, i + 1);
                            newS.onerror = () => runScripts(list, i + 1); // Continuar aunque falle uno
                            document.body.appendChild(newS);
                        } else {
                            newS.textContent = s.textContent;
                            document.body.appendChild(newS);
                            runScripts(list, i + 1);
                        }
                    }
                    runScripts(scripts);
                })
                .catch(error => {
                    console.error('Error SPA:', error);
                    contenedor.innerHTML = `<div style="padding:2rem; text-align:center;"><h3>Error cargando vista</h3><p>${error.message}</p></div>`;
                    contenedor.style.opacity = '1';
                });
        }, 150); // Pequeño delay para la transición visual
    };

    function finalizarCarga(ruta) {
        contenedor.style.opacity = '1';
        // Restaurar tema si aplica
        try { if(window.CredoraTheme) window.CredoraTheme.setTheme(document.body.classList.contains('dark'), false); } catch(e) {}

        // Ejecutar controlador específico
        if (controladores[ruta]) {
            console.log(`🚀 Ejecutando controlador: ${ruta}`);
            // Animación de entrada: aplicar clase y ejecutar controlador
            try {
                contenedor.classList.add('view-enter');
                setTimeout(() => contenedor.classList.remove('view-enter'), 420);
            } catch (e) {}
            controladores[ruta]();
        }
    }

    // Cargar vista inicial
    window.cargarVista('Main_Parts/main_home.html');
}

// Helper: configura un toggle limpio y sin listeners duplicados para el número de tarjeta
function configureCardToggle(last4) {
    const cardNumEl = document.querySelector('.card-number');
    const cardContainer = document.querySelector('.tarjeta-visual-container');
    const btn = document.getElementById('btn-toggle-card-data');

    if (!cardNumEl || !cardContainer || !btn) return;

    // Guardar último4 en data attribute
    cardNumEl.dataset.last4 = String(last4).slice(-4);

    // Estado inicial: enmascarado
    cardContainer.classList.add('masked');
    cardNumEl.textContent = '**** **** **** ****';

    // Reemplazar el botón por un clon para eliminar listeners antiguos
    const cleanBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(cleanBtn, btn);

    // Asegurar el icono y atributos ARIA iniciales
    const icon = cleanBtn.querySelector('i');
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    cleanBtn.setAttribute('aria-pressed', 'false');
    cleanBtn.title = 'Mostrar número';

    // Función que actualiza el estado visible/oculto
    function setMasked(masked) {
        if (masked) {
            cardContainer.classList.add('masked');
            cardNumEl.textContent = '**** **** **** ****';
            cleanBtn.setAttribute('aria-pressed', 'false');
            cleanBtn.title = 'Mostrar número';
            if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
        } else {
            cardContainer.classList.remove('masked');
            cardNumEl.textContent = `**** **** **** ${cardNumEl.dataset.last4 || '0000'}`;
            cleanBtn.setAttribute('aria-pressed', 'true');
            cleanBtn.title = 'Ocultar número';
            if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
        }
    }

    // Añadir listener único
    cleanBtn.addEventListener('click', () => {
        const isMasked = cardContainer.classList.contains('masked');
        setMasked(!isMasked);
    });
}


/* =========================================
   4. FUNCIONES ESPECÍFICAS (CONTROLADORES)
   ========================================= */

// --- A. INICIO (DASHBOARD) ---
async function iniciarInicio() {
    // Carga dinámica de Chart.js si no existe
    if (typeof Chart === 'undefined') {
        const scriptChart = document.createElement('script');
        scriptChart.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        scriptChart.onload = () => cargarGraficasPropias();
        document.body.appendChild(scriptChart);
    } else {
        cargarGraficasPropias();
    }

    function cargarGraficasPropias() {
        // Asumiendo que grafica.js define window.renderMainChart
        if (!document.querySelector('script[src*="grafica.js"]')) {
            const s = document.createElement('script');
            s.src = 'js/grafica.js'; // Ajusta la ruta si es necesario
            s.onload = () => { if(window.renderMainChart) window.renderMainChart(); };
            document.body.appendChild(s);
        } else if (window.renderMainChart) {
            window.renderMainChart();
        }
    }

    // Cargar datos de API
    try {
        if (window.CredoraAPI) {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            if (datos) {
                // Actualizar UI del Dashboard
                const updateText = (sel, val) => { const el = document.querySelector(sel); if(el) el.textContent = val; };
                const updateHTML = (sel, val) => { const el = document.querySelector(sel); if(el) el.innerHTML = val; };

                updateHTML('.saldo-amount', `$${datos.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="currency">${datos.moneda || 'USD'}</span>`);
                // Mantener el número en la tarjeta tal como está en el HTML (1234...)
                // Si quieres que venga desde la API, reemplaza la siguiente línea por la adecuada.
                updateText('.card-holder', datos.titular);
                updateText('.saldo-footer', `Cuenta: ${datos.numero_cuenta}`);
                
                // Actualizar Sidebar también
                updateText('.sidebar .user-data .name', (datos.titular || "Usuario").split(' ').slice(0, 2).join(' '));
                updateText('.sidebar .user-data .email', datos.email);

                // Avatar
                const userImgContainer = document.querySelector('.sidebar .user-img');
                if (userImgContainer) {
                    const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    userImgContainer.innerHTML = `<div style="width:100%; height:100%; background:linear-gradient(135deg, #667eea, #764ba2); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; border-radius:50%;">${iniciales}</div>`;
                }
                // No toggle: mostrar últimos 4 directamente
                // (antes se usaba configureCardToggle, ahora removido)
            }
        }
    } catch (err) { console.error("Error Dashboard API:", err); }
    
    // Efecto Flip Tarjeta
    const flipCard = document.querySelector('.bank-card');
    if(flipCard) {
        flipCard.onclick = () => flipCard.classList.toggle('flip');
    }

    // Configurar toggle ojo para tarjeta principal (mostrar/ocultar número)
    try {
        const btnEye = document.getElementById('btn-toggle-card-data');
        const cardContainer = document.querySelector('.tarjeta-visual-container');
        const cardNumber = document.querySelector('.card-number');
        if (btnEye && cardContainer && cardNumber) {
            // limpiar listeners previos
            const newBtn = btnEye.cloneNode(true);
            btnEye.parentNode.replaceChild(newBtn, btnEye);

            newBtn.setAttribute('aria-pressed', cardContainer.classList.contains('masked') ? 'true' : 'false');

            newBtn.addEventListener('click', (e) => {
                const isMasked = cardContainer.classList.toggle('masked');
                const ic = newBtn.querySelector('i');
                if (isMasked) {
                    if (ic) { ic.classList.remove('fa-eye'); ic.classList.add('fa-eye-slash'); }
                    newBtn.setAttribute('aria-pressed', 'true');
                } else {
                    if (ic) { ic.classList.remove('fa-eye-slash'); ic.classList.add('fa-eye'); }
                    newBtn.setAttribute('aria-pressed', 'false');
                }
            });
        }
    } catch (e) { console.warn('No se pudo configurar eye toggle', e); }
}

// --- B. PERFIL ---
async function iniciarPerfil() {
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.onsubmit = (e) => {
            e.preventDefault();
            alert('Funcionalidad de cambio de contraseña en desarrollo.');
            formPassword.reset();
        };
    }

    if (!window.CredoraAPI) return;
    const datos = await window.CredoraAPI.request('/billetera/saldo');
    if (datos) {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setVal('profile-name', datos.titular);
        setVal('profile-email', datos.email);
        setVal('profile-account', datos.numero_cuenta);
        
        const elAvatar = document.getElementById('profile-avatar');
        if (elAvatar) {
            const iniciales = (datos.titular || "U").slice(0, 2).toUpperCase();
            elAvatar.innerHTML = `<div style="width:100%; height:100%; background:#005f73; color:white; display:flex; justify-content:center; align-items:center; font-size:2rem; border-radius:50%;">${iniciales}</div>`;
        }
    }
}

// --- C. MOVIMIENTOS ---
async function iniciarMovimientos() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Cargando...</td></tr>';

    try {
        if (!window.CredoraAPI) throw new Error("API no inicializada");
        const movimientos = await window.CredoraAPI.request('/billetera/movimientos?limite=20');

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Sin movimientos recientes.</td></tr>';
            return;
        }

        tbody.innerHTML = ''; 
        movimientos.forEach(mov => {
            const fecha = new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const esIngreso = mov.tipo === 'INGRESO';
            const claseMonto = esIngreso ? 'monto-positivo' : 'monto-negativo';
            const signo = esIngreso ? '+' : '-';
            
            // Asignar clase por categoría (simple)
            let catClass = 'compras'; 
            if(['Transferencia','Ingreso'].includes(mov.categoria)) catClass = 'ingreso';
            if(mov.categoria === 'Servicios') catClass = 'entretenimiento';

            const row = `
                <tr>
                    <td>${fecha}</td>
                    <td><span class="titulo-transaccion">${mov.descripcion}</span><br><small>${mov.referencia || ''}</small></td>
                    <td><span class="badge ${catClass}">${mov.categoria || 'General'}</span></td>
                    <td>${mov.estado === 'COMPLETADO' ? '<i class="bx bxs-check-circle success"></i>' : '<i class="bx bxs-time pending"></i>'}</td>
                    <td class="text-right ${claseMonto}">${signo} $${parseFloat(mov.monto).toFixed(2)}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión.</td></tr>';
    }
}

// --- D. TRANSFERENCIAS (OPTIMIZADO) ---
async function iniciarTransferencias() {
    console.log("💸 Iniciando Transferencias...");

    // 1. Mostrar Saldo
    if (window.CredoraAPI) {
        window.CredoraAPI.request('/billetera/saldo').then(d => {
            const bal = document.querySelector('.acc-balance strong');
            if(bal && d) bal.textContent = `$${d.saldo_actual.toFixed(2)}`;
        }).catch(e => console.log(e));
    }

    // 2. Manejar el Botón
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (!btnConfirmar) { console.error("Falta botón .btn-confirmar"); return; }

    // Reemplazar nodo para limpiar eventos viejos
    const newBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);

    newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // BÚSQUEDA ROBUSTA DE INPUTS (Por ID o selectores alternativos)
        const inputDestino = document.getElementById('input-destino') || document.querySelector('input[type="email"]') || document.querySelector('input[placeholder*="Destinatario"]');
        const inputMonto = document.querySelector('.input-monto') || document.querySelector('input[type="number"]');
        const inputMotivo = document.getElementById('input-motivo') || document.querySelector('input[placeholder*="Motivo"]');

        if (!inputDestino || !inputMonto) {
            alert("Error interno: No se encuentran los campos del formulario. Revisa el HTML.");
            return;
        }

        const datos = {
            identificador: inputDestino.value.trim(),
            monto: parseFloat(inputMonto.value),
            motivo: inputMotivo ? inputMotivo.value.trim() : 'Transferencia'
        };

        if (!datos.identificador || datos.monto <= 0 || isNaN(datos.monto)) {
            alert("⚠️ Datos inválidos. Verifica el destinatario y el monto.");
            return;
        }

        // UX: Bloquear botón
        const originalText = newBtn.textContent;
        newBtn.disabled = true;
        newBtn.textContent = "Enviando...";

        try {
            const res = await window.CredoraAPI.request('/billetera/transferir', 'POST', datos);
            if (res) {
                alert(`✅ ¡Transferencia enviada con éxito!`);
                window.cargarVista('Main_Parts/main_home.html');
            }
        } catch (err) {
            alert("❌ Error: " + err.message);
            newBtn.disabled = false;
            newBtn.textContent = originalText;
        }
    });

    const btnCancelar = document.querySelector('.btn-cancelar');
    if (btnCancelar) btnCancelar.onclick = () => window.cargarVista('Main_Parts/main_home.html');
}

// --- E. NOTIFICACIONES ---
function iniciarNotificaciones() {
    const btn = document.getElementById('btn-marcar-leidas');
    if (btn) {
        btn.onclick = () => {
            document.querySelectorAll('.notificacion-item.no-leida').forEach(n => {
                n.classList.remove('no-leida');
                n.style.opacity = '0.7';
            });
            alert("Notificaciones actualizadas.");
        };
    }
}

// --- F. DATA MOVIMIENTOS ---
function iniciardatamov() {
    window.copiarAlPortapapeles = (txt) => {
        navigator.clipboard.writeText(txt).then(() => {
            const toast = document.getElementById('toast-copiado');
            if(toast) { toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 2000); }
        });
    };
    if(window.CredoraAPI) {
        window.CredoraAPI.request('/billetera/saldo').then(d => {
            const el = document.getElementById('val-cuenta');
            if(el && d) el.textContent = d.numero_cuenta;
        });
    }
}

// --- G. CONFIGURACIÓN ---
function iniciarConfiguracion() {
    const toggle = document.getElementById('config-theme-toggle');
    if(toggle) toggle.checked = document.body.classList.contains('dark');
}

// --- H. EDUCACIÓN ---
function iniciarEducacion() { console.log("Educación cargada"); }