/* =========================================
   1. LOGICA GLOBAL (DOM READY)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado: Inicializando Main.js Completo');

    // Manejadores globales para abrir/cerrar modales por `data-modal`
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-modal]');
        if (trigger) {
            e.preventDefault();
            const id = trigger.dataset.modal;
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('no-scroll');
            }
            return;
        }

        // Cerrar al pulsar elementos con clase .modal-close
        const closeBtn = e.target.closest('.modal-close');
        if (closeBtn) {
            const modal = closeBtn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('no-scroll');
            }
            return;
        }

        // Cerrar al clicar fuera del contenido (click en overlay)
        const overlay = e.target.closest('.modal-overlay');
        if (overlay && e.target === overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
            return;
        }
    });

    // Cerrar modales con Escape globalmente
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => {
                m.classList.remove('active');
                m.setAttribute('aria-hidden', 'true');
            });
            document.body.classList.remove('no-scroll');
        }
    });

    // Delegado global: capturar clicks en botones KYC aunque iniciarPerfil() no se haya enlazado todavía
    document.addEventListener('click', (e) => {
        const k = e.target.closest('#btn-kyc, #btn-kyc-popover');
        if (!k) return;
        e.preventDefault();
        console.log('🔎 KYC button clicked (global)');
        // Cerrar popover si está abierto
        const pop = document.getElementById('profile-actions-popover');
        if (pop && pop.classList.contains('show')) { pop.classList.remove('show'); pop.setAttribute('aria-hidden','true'); }
        if (window.cargarVista) {
            window.cargarVista('Main_Parts/main_kyc.html');
        } else {
            console.warn('cargarVista no disponible');
        }
    });

    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const contenedor = document.getElementById('contenedor-dinamico');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    // Elemento activo actual (enlace del sidebar)
    let activeLinkEl = document.querySelector('.nav_list a.active');

    function updateCompactActive() {
        // Quitar compact-active de todos
        document.querySelectorAll('.nav_list a.compact-active').forEach(a => a.classList.remove('compact-active'));
        if (!activeLinkEl) activeLinkEl = document.querySelector('.nav_list a.active');
        if (sidebar && sidebar.classList.contains('minimize')) {
            if (activeLinkEl) activeLinkEl.classList.add('compact-active');
        } else {
            if (activeLinkEl) activeLinkEl.classList.remove('compact-active');
        }
    }

    function updateOverlayState() {
        try {
            if (!sidebarOverlay || !sidebar) return;
            const shouldShow = !sidebar.classList.contains('minimize') || sidebar.classList.contains('hover');
            if (shouldShow) {
                sidebarOverlay.classList.add('visible');
                sidebarOverlay.style.pointerEvents = 'auto';
                sidebarOverlay.style.opacity = '1';
            } else {
                sidebarOverlay.classList.remove('visible');
                sidebarOverlay.style.pointerEvents = 'none';
                sidebarOverlay.style.opacity = '0';
            }
        } catch (e) { /* safe */ }
    }

    // --- A. LOGOUT ---
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

    // --- B. MINIMIZAR SIDEBAR ---
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('minimize');
            // Ocultar contenido cuando la sidebar queda minimizada
            if (contenedor) {
                if (sidebar.classList.contains('minimize')) contenedor.classList.add('hidden-by-sidebar');
                else contenedor.classList.remove('hidden-by-sidebar');
            }
            // Actualizar estado compacto del enlace activo
            updateCompactActive();
            // Sincronizar overlay
            updateOverlayState();
        });
    }

    // --- C. DELEGACIÓN DE EVENTOS GLOBAL ---
    document.addEventListener('click', (e) => {
        
        // 1. Manejo de Dropdowns del Sidebar
        const menuItem = e.target.closest('.menu-item-dropdown');
        if (menuItem) {
            if (sidebar && sidebar.classList.contains('minimize')) return;
            
            // Cerrar otros menús
            document.querySelectorAll('.menu-item-dropdown').forEach((item) => {
                if (item !== menuItem) {
                    item.classList.remove('sub-menu-toggle');
                    const otherSub = item.querySelector('.sub-menu');
                    if (otherSub) { otherSub.style.height = '0'; otherSub.style.padding = '0'; }
                }
            });

            // Toggle del actual
            const subMenu = menuItem.querySelector('.sub-menu');
            const isActive = menuItem.classList.toggle('sub-menu-toggle');
            if (subMenu) {
                subMenu.style.height = isActive ? `${subMenu.scrollHeight + 6}px` : '0';
                subMenu.style.padding = isActive ? '0.2rem 0' : '0';
            }
            return; 
        }

        // 2. Manejo de "Triggers" internos (Botones dentro del dashboard)
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
            } else {
                submenuWrapper.style.height = '0';
                submenuWrapper.style.padding = '0';
                submenuWrapper.classList.remove('show');
            }
            return;
        }

        // --- 3. NAVEGACIÓN SPA ---
        const link = e.target.closest('.menu-link, .sub-menu-link');
        
        if (link && link.id !== 'btn-logout-sidebar') {
            const ruta = link.getAttribute('data-vista');
            
            if (ruta && ruta !== '#') {
                e.preventDefault();
                console.log("Navegando a:", ruta);

                // Actualizar clases 'active' visuales
                document.querySelectorAll('.nav_list a.active').forEach(i => i.classList.remove('active'));
                link.classList.add('active');
                if(link.closest('.menu-item-dropdown')) link.closest('.menu-item-dropdown').classList.add('active');
                // Actualizar referencia al enlace activo y estado compacto
                activeLinkEl = link;
                updateCompactActive();

                // Llamar a la función de carga
                if (window.cargarVista) window.cargarVista(ruta);

                // Cerrar sidebar en móvil
                if(sidebar) { sidebar.classList.remove('hover'); updateOverlayState(); }
            }
        }
    });

    // --- D. BUSQUEDA GLOBAL ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = (e.target.value || '').toLowerCase().trim();

            // Ocultar el contenido principal mientras se hace una búsqueda (mejor foco en menú)
            if (contenedor) {
                if (term !== '') contenedor.classList.add('hidden-by-sidebar');
                else if (!sidebar.classList.contains('minimize')) contenedor.classList.remove('hidden-by-sidebar');
            }

            // 1) Filtrar tablas si existen
            const rows = document.querySelectorAll('tbody tr');
            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
                });
            }

            // 2) Filtrar elementos del sidebar (links)
            const navItems = document.querySelectorAll('.nav_list li');
            if (navItems && navItems.length > 0) {
                navItems.forEach(li => {
                    const text = (li.textContent || '').toLowerCase();
                    // Mostrar siempre divisores y footer
                    if (li.classList.contains('divider')) { li.style.display = ''; return; }
                    li.style.display = text.includes(term) || term === '' ? '' : 'none';
                });
            }
        });
    }

    // Hacer que el icono de búsqueda abra la sidebar (quitar minimize) y enfoque el input
    const searchIcon = document.querySelector('.input-box i');
    if (searchIcon && searchInput && sidebar) {
        searchIcon.addEventListener('click', (ev) => {
            ev.stopPropagation();
            // Abrir si estaba minimizada
            sidebar.classList.remove('minimize');
            sidebar.classList.add('hover');
            // Mostrar contenedor si fue ocultado
            if (contenedor) contenedor.classList.remove('hidden-by-sidebar');
            // Forzar que el input sea claramente visible y enfocado
            setTimeout(() => { try { searchInput.focus(); } catch(e){} }, 80);
            // Actualizar icono activo
            updateCompactActive();
            // Sincronizar overlay
            updateOverlayState();
        });
    }

    // Manejador del overlay para cerrar la sidebar al clicar fuera
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('minimize');
            sidebar.classList.remove('hover');
            if (contenedor) contenedor.classList.add('hidden-by-sidebar');
            // limpiar búsqueda y restaurar menú
            try { if (searchInput) searchInput.value = ''; document.querySelectorAll('.nav_list li').forEach(li => li.style.display=''); } catch(e) {}
            updateCompactActive();
            updateOverlayState();
        });
    }

    // --- E. SIDEBAR HOVER ---
    if (sidebar) {
        sidebar.addEventListener('mouseleave', () => {
            // Quitar estado hover
            sidebar.classList.remove('hover');

            // Cerrar submenús abiertos al salir
            document.querySelectorAll('.submenu-wrapper.show, .sub-menu-toggle').forEach(el => {
                el.classList.remove('show');
                el.classList.remove('sub-menu-toggle');
                if(el.querySelector('.sub-menu')) {
                    el.querySelector('.sub-menu').style.height = '0';
                    el.querySelector('.sub-menu').style.padding = '0';
                }
                if(el.classList.contains('submenu-wrapper')) {
                    el.style.height = '0';
                    el.style.padding = '0';
                }
            });

            // Minimizar la sidebar al salir
            sidebar.classList.add('minimize');

            // Ocultar el contenido principal
            if (contenedor) contenedor.classList.add('hidden-by-sidebar');

            // Limpiar búsqueda (si existía) y restaurar visibilidad de elementos del menú
            try {
                const hadSearch = searchInput && searchInput.value && searchInput.value.trim() !== '';
                if (hadSearch && searchInput) {
                    searchInput.value = '';
                }
                // Restaurar todos los elementos del menú
                document.querySelectorAll('.nav_list li').forEach(li => { li.style.display = ''; });

                // Si el enlace activo es un sub-enlace, marcar también el padre dropdown como activo
                if (activeLinkEl && activeLinkEl.classList.contains('sub-menu-link')) {
                    const submenuWrapper = activeLinkEl.closest('.submenu-wrapper');
                    const parentLi = submenuWrapper ? submenuWrapper.parentElement : null;
                    if (parentLi) {
                        const parentTrigger = parentLi.querySelector('.dropdown-trigger');
                        if (parentTrigger) {
                            parentTrigger.classList.add('active');
                            parentLi.classList.add('active');
                        }
                    }
                }
            } catch (e) {}

            // Añadir clase compact-active al icono del enlace activo
            updateCompactActive();
            // Sincronizar overlay
            updateOverlayState();
        });
    }

    // Iniciar el enrutador
    // Asegurar estado inicial del overlay
    try { updateOverlayState(); } catch(e) {}
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
    'Main_Parts/main_data_transf.html': iniciardatamov,
    'Main_Parts/main_kyc.html': iniciarKYC, 
    'Main_Parts/main_config.html': iniciarConfiguracion,
    'Main_Parts/main_educ.html': iniciarEducacion
};

/* =========================================
   3. LOGICA DE NAVEGACIÓN (SPA)
   ========================================= */
function iniciarNavegacionSPA() {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) { console.error('CRÍTICO: No se encontró #contenedor-dinamico'); return; }

    window.cargarVista = function(rutaArchivo) {
        const rutaLimpia = rutaArchivo.replace('./', '');
        contenedor.style.opacity = '0';

        setTimeout(() => {
            fetch(rutaLimpia)
                .then(res => {
                    if (!res.ok) throw new Error(`Error ${res.status}`);
                    return res.text();
                })
                .then(html => {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    
                    // Inyectar CSS
                    temp.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                        const href = l.getAttribute('href');
                        if (!document.querySelector(`link[href="${href}"]`)) {
                            const newLink = document.createElement('link');
                            newLink.rel = 'stylesheet'; newLink.href = href;
                            document.head.appendChild(newLink);
                        }
                    });

                    contenedor.innerHTML = temp.innerHTML;

                    // Ejecutar Scripts
                    const scripts = Array.from(contenedor.querySelectorAll('script'));
                    scripts.forEach(s => s.remove());
                    
                    function runScripts(list, i=0) {
                        if(i >= list.length) { finalizarCarga(rutaLimpia); return; }
                        const s = list[i];
                        const sc = document.createElement('script');
                        if(s.src) { 
                            sc.src = s.src; 
                            sc.onload = () => runScripts(list, i+1);
                            document.body.appendChild(sc); 
                        } else { 
                            sc.textContent = s.textContent; 
                            document.body.appendChild(sc); 
                            runScripts(list, i+1); 
                        }
                    }
                    runScripts(scripts);
                })
                .catch(err => {
                    console.error(err);
                    contenedor.style.opacity = '1';
                });
        }, 150);
    };

    function finalizarCarga(ruta) {
        contenedor.style.opacity = '1';
        // Animación de entrada para la vista inyectada
        try {
            contenedor.classList.remove('view-enter');
            // Forzar reflow para reiniciar la animación si ya estaba presente
            void contenedor.offsetWidth;
            contenedor.classList.add('view-enter');
            contenedor.addEventListener('animationend', () => contenedor.classList.remove('view-enter'), { once: true });
        } catch (e) { /* no bloquear si falla */ }
        // Restaurar tema si aplica
        try { if(window.CredoraTheme) window.CredoraTheme.setTheme(document.body.classList.contains('dark'), false); } catch(e) {}

        if (controladores[ruta]) {
            console.log(`🎮 Controlador activo: ${ruta}`);
            controladores[ruta]();
        }
    }

    // Cargar Inicio
    window.cargarVista('Main_Parts/main_home.html');
}


/* =========================================
   4. CONTROLADORES (LÓGICA DE NEGOCIO)
   ========================================= */

// --- A. INICIO (DASHBOARD) ---
async function iniciarInicio() {
    console.log("⚡ Iniciando Dashboard...");

    // 1. INICIALIZAR GRÁFICAS
    // Verificamos si las funciones globales de grafica.js ya existen (cargadas por Dashboard.html)
    // No intentamos cargar scripts dinámicamente para evitar bloqueos.
    if (typeof window.renderMainChart === 'function') {
        window.renderMainChart();
    }
    if (typeof window.renderUsageChart === 'function') {
        window.renderUsageChart();
    }

    // 2. OBTENER DATOS DE LA API
    try {
        if (window.CredoraAPI) {
            const datos = await window.CredoraAPI.request('/billetera/saldo');

            if (datos) {
                // --- ACTUALIZAR TEXTOS DEL DOM ---

                // A) Saldo Principal
                const saldoEl = document.querySelector('.saldo-amount');
                if (saldoEl) {
                    // Usamos innerHTML para mantener el span de la moneda (<span class="currency">)
                    saldoEl.innerHTML = `$${datos.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="currency">${datos.moneda || 'USD'}</span>`;
                }

                // B) Pie de tarjeta (Número de cuenta)
                const footerEl = document.querySelector('.saldo-footer');
                if (footerEl) footerEl.textContent = `Número de Cuenta: ${datos.numero_cuenta}`;

                // C) Número de Tarjeta (Lógica de Enmascarado)
                const cardNumEl = document.querySelector('.card-number');
                if (cardNumEl) {
                    // Guardamos el número real en un atributo de datos para usarlo después
                    cardNumEl.dataset.real = `**** **** **** ${datos.tarjeta_ultimos_4 || '0000'}`;
                    
                    // Verificamos si el contenedor ya tiene la clase .masked (estado actual)
                    // Usamos optional chaining (?.) por seguridad
                    const isMasked = document.querySelector('.tarjeta-visual-container')?.classList.contains('masked');
                    
                    // Mostramos asteriscos o el número según el estado
                    cardNumEl.textContent = isMasked ? "**** **** **** ****" : cardNumEl.dataset.real;
                }

                // D) Titular de la Tarjeta
                const cardHolderEl = document.querySelector('.card-holder');
                if (cardHolderEl) cardHolderEl.textContent = datos.titular.toUpperCase();

                // --- ACTUALIZAR SIDEBAR (Global) ---
                const sidebarName = document.querySelector('.sidebar .user-data .name');
                const sidebarEmail = document.querySelector('.sidebar .user-data .email');

                if (sidebarName) {
                    // Mostrar solo Primer Nombre y Primer Apellido
                    const nombres = (datos.titular || "Usuario").split(' ');
                    sidebarName.textContent = nombres.length > 1 ? `${nombres[0]} ${nombres[1]}` : nombres[0];
                }
                if (sidebarEmail) sidebarEmail.textContent = datos.email;

                // --- ACTUALIZAR AVATAR (Iniciales) ---
                const userImgContainer = document.querySelector('.sidebar .user-img');
                if (userImgContainer) {
                    const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    userImgContainer.innerHTML = `
                        <div style="
                            width: 100%; height: 100%; 
                            background: linear-gradient(135deg, #003049 0%, #005f73 100%); 
                            color: white; display: flex; align-items: center; justify-content: center; 
                            font-weight: bold; border-radius: 50%; font-size: 1.1rem; border: 2px solid white;">
                            ${iniciales}
                        </div>
                    `;
                }

                // --- ACTUALIZAR GRÁFICAS CON DATOS REALES ---
                if (typeof window.actualizarGraficasDesdeAPI === 'function' && datos.historial) {
                    window.actualizarGraficasDesdeAPI(datos.historial);
                }
            }
        }
    } catch (err) {
        console.error("Error cargando datos del Dashboard:", err);
    }

    // 3. RE-ASIGNAR EVENTOS VISUALES (Flip y Toggle Ojo)
    // Usamos un pequeño timeout para asegurar que el DOM está listo tras la inyección HTML
    setTimeout(() => {
        // A) Evento Flip (Voltear Tarjeta)
        const flipCard = document.querySelector('.bank-card');
        if (flipCard) {
            // Asignamos onclick directamente para reemplazar cualquier listener anterior
            flipCard.onclick = (e) => {
                // Si el click fue en el botón de "ojo", NO volteamos la tarjeta
                if (e.target.closest('.btn-eye')) return;
                flipCard.classList.toggle('flip');
            };
        }

        // B) Evento Toggle Ojo (Mostrar/Ocultar Saldo y Números)
        const btnEye = document.getElementById('btn-toggle-card-data');
        if (btnEye) {
            // Clonamos el botón para eliminar cualquier event listener viejo acumulado
            const newBtn = btnEye.cloneNode(true);
            btnEye.parentNode.replaceChild(newBtn, btnEye);

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el click llegue a la tarjeta y la voltee
                e.preventDefault();

                const container = document.querySelector('.tarjeta-visual-container');
                const num = document.querySelector('.card-number');
                const icon = newBtn.querySelector('i');

                // Alternar clase .masked
                const isMasked = container.classList.toggle('masked');

                if (isMasked) {
                    // Estado Oculto
                    if (num) num.textContent = "**** **** **** ****";
                    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
                    newBtn.setAttribute('aria-label', 'Mostrar número');
                    newBtn.title = "Mostrar número";
                } else {
                    // Estado Visible
                    if (num) num.textContent = num.dataset.real || "0000 0000 0000 0000";
                    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
                    newBtn.setAttribute('aria-label', 'Ocultar número');
                    newBtn.title = "Ocultar número";
                }
            });
        }
    }, 50); // 50ms de delay es suficiente
}

// --- B. PERFIL ---
async function iniciarPerfil() {
    if (!window.CredoraAPI) return;

    try {
        const datos = await window.CredoraAPI.request('/billetera/saldo');
        if (datos) {
            if (document.getElementById('profile-name')) document.getElementById('profile-name').textContent = datos.titular;
            if (document.getElementById('profile-email')) document.getElementById('profile-email').textContent = datos.email;
            if (document.getElementById('profile-account')) document.getElementById('profile-account').textContent = datos.numero_cuenta;

                    // Campos adicionales para la vista derecha
                    if (document.getElementById('profile-cedula')) document.getElementById('profile-cedula').textContent = datos.cedula || datos.identificador || '...';
                    if (document.getElementById('profile-direccion')) document.getElementById('profile-direccion').textContent = datos.direccion || datos.domicilio || '...';
                    if (document.getElementById('profile-ocupacion')) document.getElementById('profile-ocupacion').textContent = datos.ocupacion || datos.trabajo || '...';
                    if (document.getElementById('profile-status')) document.getElementById('profile-status').textContent = datos.estado_kyc || 'Activo';

            const estadoEl = document.querySelector('.value.status-active');
            if(estadoEl && datos.estado_kyc) {
                estadoEl.textContent = datos.estado_kyc;
                estadoEl.style.color = datos.estado_kyc === 'APROBADO' ? '#00d26a' : '#ffa500';
            }

            const elAvatar = document.getElementById('profile-avatar');
            if (elAvatar) {
                const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                elAvatar.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#003049,#005f73);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:2.5rem;border-radius:50%;box-shadow:0 4px 15px rgba(0,0,0,0.2);">${iniciales}</div>`;
            }
        }
    } catch (err) { console.error("Error Perfil:", err); }

    // --- Inicializar modales del perfil (Cambiar Contraseña / Cambiar PIN)
    try {
        const section = document.getElementById('vista-perfil');
        if (!section) return;
        const buttons = section.querySelectorAll('[data-modal]');
        const modals = section.querySelectorAll('.modal-overlay');

        function openModal(id){
            const m = document.getElementById(id);
            if(!m) return;
            m.classList.add('active');
            m.setAttribute('aria-hidden','false');
            document.body.classList.add('no-scroll');
            section.classList.add('modal-open');
        }

        function closeModal(m){
            if(!m) return;
            m.classList.remove('active');
            m.setAttribute('aria-hidden','true');
            document.body.classList.remove('no-scroll');
            section.classList.remove('modal-open');
            m.querySelector('form')?.reset();
        }

        // Vincular botones (cada botón debe tener `data-modal` con el id del modal a abrir)
        buttons.forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));

        // Toggle popover de acciones (mostrar al presionar botón)
        const btnActionsToggle = document.getElementById('btn-actions-toggle');
        const popover = document.getElementById('profile-actions-popover');
        if (btnActionsToggle && popover) {
            btnActionsToggle.addEventListener('click', (ev) => { ev.stopPropagation(); popover.classList.toggle('show'); popover.setAttribute('aria-hidden', popover.classList.contains('show') ? 'false' : 'true'); });
            // Cerrar al clicar fuera
            document.addEventListener('click', () => { if (popover.classList.contains('show')) { popover.classList.remove('show'); popover.setAttribute('aria-hidden','true'); } });
            popover.addEventListener('click', (e) => e.stopPropagation());
        }

        modals.forEach(m => {
            m.addEventListener('click', e => {
                if(e.target === m || e.target.classList.contains('modal-backdrop')) closeModal(m);
            });
            const closeBtn = m.querySelector('.modal-close');
            if (closeBtn) closeBtn.addEventListener('click', () => closeModal(m));
        });

        document.addEventListener('keydown', e => {
            if(e.key === 'Escape'){
                modals.forEach(m => { if(m.classList.contains('active')) closeModal(m); });
            }
        });

        // Form handlers
        const formPass = document.getElementById('form-change-pass');
        if (formPass) {
            formPass.addEventListener('submit', function(e){
                e.preventDefault();
                const pass1 = this['new-pass'].value;
                const pass2 = this['confirm-pass'].value;
                if (pass1 !== pass2) { alert("Las contraseñas no coinciden."); return; }
                if (pass1.length < 8) { alert("La contraseña debe tener al menos 8 caracteres."); return; }
                // TODO: llamar a API para cambiar contraseña
                alert("Contraseña actualizada con éxito.");
                closeModal(this.closest('.modal-overlay'));
            });
        }

        // Formulario para cambio de PIN (validación simple)
        const formPin = document.getElementById('form-change-pin');
        if (formPin) {
            formPin.addEventListener('submit', function(e){
                e.preventDefault();
                const p1 = this['new-pin'].value;
                const p2 = this['confirm-pin'].value;
                if (p1 !== p2) { alert("Los PIN no coinciden."); return; }
                if (!/^\d{4}$/.test(p1)) { alert("El PIN debe tener 4 dígitos numéricos."); return; }
                // TODO: llamar a API para cambiar PIN
                alert("PIN actualizado con éxito.");
                closeModal(this.closest('.modal-overlay'));
            });
        }

        // Conectar botones KYC (botón principal y popover)
        try {
            const btnKycEls = section.querySelectorAll('#btn-kyc, #btn-kyc-popover');
            btnKycEls.forEach(btn => {
                if (!btn) return;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Cerrar popover si está abierto
                    const pop = document.getElementById('profile-actions-popover');
                    if (pop && pop.classList.contains('show')) { pop.classList.remove('show'); pop.setAttribute('aria-hidden','true'); }
                    if (window.cargarVista) {
                        window.cargarVista('Main_Parts/main_kyc.html');
                    } else {
                        console.warn('cargarVista no disponible');
                    }
                });
            });
        } catch(err) { console.warn('Error al enlazar btn-kyc:', err); }

        // PIN change removed from profile to avoid showing PIN UI on profile screen
    } catch(e) { /* no bloquear si falla */ }
}

// --- C. MOVIMIENTOS ---
async function iniciarMovimientos() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Cargando historial...</td></tr>';

    try {
        if (!window.CredoraAPI) throw new Error("API no disponible");
        const movimientos = await window.CredoraAPI.request('/billetera/movimientos?limite=20');

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No hay movimientos recientes.</td></tr>';
            return;
        }

        tbody.innerHTML = ''; 
        movimientos.forEach(mov => {
            const fechaObj = new Date(mov.fecha);
            const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            const esIngreso = mov.tipo === 'INGRESO';
            const claseMonto = esIngreso ? 'monto-positivo' : 'monto-negativo';
            const signo = esIngreso ? '+' : '-';
            
            let icono = mov.estado === 'COMPLETADO' ? "<i class='bx bxs-check-circle success'></i> Completado" : "<i class='bx bxs-time-five pending'></i> Pendiente";
            if (mov.estado === 'FALLIDO') icono = "<i class='bx bxs-x-circle' style='color:red'></i> Fallido";

            let catClass = 'compras';
            const catLower = (mov.categoria || '').toLowerCase();
            if(catLower.includes('transferencia') || catLower.includes('ingreso')) catClass = 'ingreso';
            if(catLower.includes('servicio')) catClass = 'entretenimiento';

            const row = `<tr>
                <td>${fechaStr}</td>
                <td><span class="titulo-transaccion">${mov.descripcion || 'Transacción'}</span><br><span class="subtitulo">${mov.referencia || ''}</span></td>
                <td><span class="badge ${catClass}">${mov.categoria || 'General'}</span></td>
                <td>${icono}</td>
                <td class="text-right ${claseMonto}">${signo} $${parseFloat(mov.monto).toFixed(2)}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar datos.</td></tr>';
    }
}

// --- D. TRANSFERENCIAS (RECUPERADO) ---
async function iniciarTransferencias() {
    console.log("💸 Módulo Transferencias Iniciado");

    // Saldo
    if (window.CredoraAPI) {
        window.CredoraAPI.request('/billetera/saldo').then(d => {
            const el = document.querySelector('.acc-balance strong');
            if(el) el.textContent = `$${d.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        });
    }

    let transferenciaPendiente = null;
    const modal = document.getElementById('pinModal');

    // Inputs PIN
    const pinInputs = document.querySelectorAll('.pin-box');
    pinInputs.forEach((input, index) => {
        const ni = input.cloneNode(true);
        input.parentNode.replaceChild(ni, input);
        ni.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9 && index < 3) document.querySelectorAll('.pin-box')[index+1].focus();
            if (e.key === 'Backspace' && index > 0) document.querySelectorAll('.pin-box')[index-1].focus();
            if (e.key === 'Enter') confirmarConPin();
        });
    });

    window.confirmarConPin = async () => {
        let pin = "";
        document.querySelectorAll('.pin-box').forEach(b => pin += b.value);
        if (pin.length !== 4) { alert("El PIN debe tener 4 dígitos."); return; }
        if (!transferenciaPendiente) return;

        const datos = { ...transferenciaPendiente, pin: pin };
        const btn = document.querySelector('.modal-actions .btn-confirmar');
        const txt = btn.textContent;
        btn.textContent = "Procesando..."; btn.disabled = true;

        try {
            const res = await window.CredoraAPI.request('/billetera/transferir', 'POST', datos);
            if (res) {
                if(modal) modal.classList.remove('active');
                alert(`✅ Transferencia Exitosa!\nEnviado a: ${datos.nombre_beneficiario}`);
                window.cargarVista('Main_Parts/main_home.html');
            }
        } catch (e) {
            alert("❌ " + e.message);
            document.querySelectorAll('.pin-box').forEach(b => b.value='');
            document.getElementById('pin1').focus();
        } finally {
            btn.textContent = txt; btn.disabled = false;
        }
    };

    // Modal Helpers
    window.toggleModal = (show) => {
        if(modal) {
            if(show) { modal.classList.add('active'); setTimeout(()=>document.getElementById('pin1').focus(),100); }
            else { modal.classList.remove('active'); document.querySelectorAll('.pin-box').forEach(b=>b.value=''); }
        }
    }
    window.validarPin = window.confirmarConPin;

    // Formulario
    const btnCont = document.querySelector('.form-actions .btn-confirmar');
    if (btnCont) {
        const nb = btnCont.cloneNode(true);
        btnCont.parentNode.replaceChild(nb, btnCont);
        nb.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.form-transferencia input');
            const nombre = inputs[0]?.value.trim();
            const cedula = inputs[1]?.value.trim();
            const telefono = inputs[2]?.value.trim();
            const monto = parseFloat(inputs[3]?.value);
            const motivo = inputs[4]?.value.trim();

            if (!nombre || !cedula || !monto) { alert("Datos incompletos."); return; }

            transferenciaPendiente = { nombre_beneficiario: nombre, cedula_destino: cedula, telefono_destino: telefono, identificador: cedula, monto: monto, motivo: motivo||"Pago" };
            window.toggleModal(true);
        });
    }
    const btnCan = document.querySelector('.form-actions .btn-cancelar');
    if(btnCan) btnCan.addEventListener('click', ()=> window.cargarVista('Main_Parts/main_home.html'));
}

// --- E. NOTIFICACIONES (RECUPERADO) ---
function iniciarNotificaciones() {
    const btn = document.getElementById('btn-marcar-leidas');
    if (btn) {
        btn.onclick = () => {
            document.querySelectorAll('.notificacion-item.no-leida').forEach(n => {
                n.classList.remove('no-leida');
                n.style.opacity = '0.7';
            });
            alert("Todas las notificaciones marcadas como leídas.");
        };
    }
}

// --- F. DATA MOVIMIENTOS (RECUPERADO) ---
function iniciardatamov() {
    window.copiarAlPortapapeles = (txt) => {
        navigator.clipboard.writeText(txt).then(() => {
            const t = document.getElementById('toast-copiado');
            if(t) { t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2000); }
        });
    };
    if (window.CredoraAPI) {
        window.CredoraAPI.request('/billetera/saldo').then(datos => {
            if (datos) {
                const valCuenta = document.getElementById('val-cuenta');
                if (valCuenta) valCuenta.innerText = datos.numero_cuenta;
                const valAlias = document.getElementById('val-alias');
                if (valAlias && datos.alias) valAlias.textContent = datos.alias;
            }
        });
    }
}

// --- G. CONFIGURACIÓN (RECUPERADO) ---
function iniciarConfiguracion() {
    const t = document.getElementById('config-theme-toggle');
    if(t) t.checked = document.body.classList.contains('dark');
}

// --- H. KYC (TU VERSIÓN CORRECTA) ---
function iniciarKYC() {
    console.log("🔐 KYC Iniciado");
    const formKyc = document.getElementById('form-kyc');
    const fileInput = document.getElementById('doc-id');
    const vistaSubida = document.getElementById('vista-subida');
    const vistaCarga = document.getElementById('vista-carga');
    const vistaResultados = document.getElementById('vista-resultados');
    const barra = document.getElementById('barra-progreso');

    if(fileInput) {
        fileInput.addEventListener('change', function() {
            if(this.files[0]) document.getElementById('file-name').textContent = this.files[0].name;
        });
    }

    if(formKyc) {
        formKyc.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!fileInput.files[0]) { alert("Sube una imagen."); return; }

            vistaSubida.style.display = 'none';
            vistaCarga.style.display = 'block';
            let p = 0;
            const interv = setInterval(() => { p+=2; if(p>90) p=90; if(barra) barra.style.width=p+'%'; }, 100);

            try {
                const formData = new FormData();
                formData.append('archivo', fileInput.files[0]);
                const token = localStorage.getItem('credora_token');

                const res = await fetch('http://127.0.0.1:8000/api/v1/billetera/kyc/subir-documento', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if(!res.ok) throw new Error("Error analizando documento.");
                const data = await res.json();

                clearInterval(interv);
                if(barra) barra.style.width = '100%';

                setTimeout(() => {
                    document.getElementById('res-nombre').value = data.datos_extraidos.nombre || "No legible";
                    document.getElementById('res-cedula').value = data.datos_extraidos.cedula || "No legible";
                    
                    const badge = document.getElementById('res-vencimiento');
                    if(badge) {
                        badge.textContent = data.datos_extraidos.documento_valido ? "Vigente ✅" : "Vencido ❌";
                        badge.className = data.datos_extraidos.documento_valido ? "status-badge valid" : "status-badge expired";
                    }
                    vistaCarga.style.display = 'none';
                    vistaResultados.style.display = 'block';
                }, 500);

            } catch (err) {
                clearInterval(interv);
                alert("❌ Error: " + err.message);
                vistaCarga.style.display = 'none';
                vistaSubida.style.display = 'block';
            }
        });
    }

    const formFin = document.getElementById('form-finalizar-kyc');
    if(formFin) {
        formFin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                direccion: document.getElementById('user-direccion').value,
                telefono: document.getElementById('user-phone').value,
                tipo_usuario: document.getElementById('tipe-user').value
            };
            try {
                const res = await window.CredoraAPI.request('/billetera/kyc/finalizar', 'POST', payload);
                alert("✅ " + res.mensaje);
                window.cargarVista('Main_Parts/main_profile.html');
            } catch (e) { alert(e.message); }
        });
    }
}

function iniciarEducacion() { console.log("Educación..."); }