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
    if (menuBtn) {
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
    'Main_Parts/main_data_transf.html': iniciardatamov,
    'Main_Parts/main_kyc.html': iniciarKYC, // <--- ¡AQUÍ ESTABA FALTANDO!
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
    // console.log("⚡ Cargando Dashboard...");

    // 1. Cargar dependencias de gráficas
    const graficaCssPath = 'css/grafica.css';
    const graficaJsPath = 'js/grafica.js';
    const chartJsCdn = 'https://cdn.jsdelivr.net/npm/chart.js';

    if (!document.querySelector(`link[href*="grafica.css"]`)) {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = graficaCssPath;
        document.head.appendChild(l);
    }

    function loadScripts() {
        if (typeof Chart === 'undefined') {
            const s1 = document.createElement('script'); s1.src = chartJsCdn;
            s1.onload = () => {
                const s2 = document.createElement('script'); s2.src = graficaJsPath;
                document.body.appendChild(s2);
            };
            document.body.appendChild(s1);
        } else if (typeof window.renderMainChart !== 'function') {
            const s2 = document.createElement('script'); s2.src = graficaJsPath;
            document.body.appendChild(s2);
        } else {
            window.renderMainChart();
            window.renderUsageChart();
        }
    }
    loadScripts();

    // 2. CONEXIÓN API
    try {
        if (window.CredoraAPI) {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            
            if (datos) {
                // Dashboard Central
                const saldoEl = document.querySelector('.saldo-amount');
                if(saldoEl) saldoEl.innerHTML = `$${datos.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="currency">${datos.moneda}</span>`;
                
                const cardNumEl = document.querySelector('.card-number');
                if(cardNumEl) cardNumEl.textContent = `**** **** **** ${datos.tarjeta_ultimos_4}`;
                
                const cardHolderEl = document.querySelector('.card-holder');
                if(cardHolderEl) cardHolderEl.textContent = datos.titular;

                const cuentaFooter = document.querySelector('.saldo-footer');
                if(cuentaFooter) cuentaFooter.textContent = `Número de Cuenta: ${datos.numero_cuenta}`;

                // --- SIDEBAR (Nombre Corto) ---
                const sidebarName = document.querySelector('.sidebar .user-data .name');
                const sidebarEmail = document.querySelector('.sidebar .user-data .email');
                
                if (sidebarName) {
                    const nombreCompleto = datos.titular || "Usuario";
                    const nombreCorto = nombreCompleto.split(' ').slice(0, 2).join(' ');
                    sidebarName.textContent = nombreCorto;
                }
                
                if (sidebarEmail) sidebarEmail.textContent = datos.email;

                // Avatar Sidebar
                const userImgContainer = document.querySelector('.sidebar .user-img');
                if (userImgContainer) {
                    const nombreLimpio = datos.titular || "Usuario";
                    const iniciales = nombreLimpio.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    
                    userImgContainer.innerHTML = `
                        <div style="
                            width: 100%; height: 100%; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; display: flex; align-items: center; justify-content: center; 
                            font-weight: bold; border-radius: 50%; font-size: 1.1rem; border: 2px solid white;">
                            ${iniciales}
                        </div>
                    `;
                }

                if (window.actualizarGraficasDesdeAPI && datos.historial) {
                    window.actualizarGraficasDesdeAPI(datos.historial);
                }
            }
        }
    } catch (err) {
        console.error("Error cargando datos:", err);
    }

    const flipCard = document.querySelector('.tarjeta-visual-container .bank-card');
    if (flipCard) {
        const newFlip = flipCard.cloneNode(true);
        flipCard.parentNode.replaceChild(newFlip, flipCard);
        newFlip.addEventListener('click', function () { this.classList.toggle('flip'); });
    }
}

// --- B. PERFIL ---
async function iniciarPerfil() {
    // console.log("👤 Cargando Perfil...");

    // 1. Manejo del formulario de contraseña (existente)
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Funcionalidad de cambio de contraseña en desarrollo.');
            formPassword.reset();
        });
    }

    // 2. CARGA DE DATOS DEL USUARIO
    if (!window.CredoraAPI) return;

    try {
        const datos = await window.CredoraAPI.request('/billetera/saldo');
        if (datos) {
            const mapa = {
                'profile-name': datos.titular,
                'profile-email': datos.email,
                'profile-account': datos.numero_cuenta
            };
            
            for(const [id, val] of Object.entries(mapa)) {
                const el = document.getElementById(id);
                if(el) el.textContent = val;
            }

            // Estado KYC visual en el perfil (Opcional)
            const estadoEl = document.querySelector('.value.status-active');
            if(estadoEl && datos.estado_kyc) {
                estadoEl.textContent = datos.estado_kyc;
                estadoEl.style.color = datos.estado_kyc === 'APROBADO' ? '#00d26a' : '#ffa500';
            }

            // Avatar Grande
            const elAvatar = document.getElementById('profile-avatar');
            if (elAvatar) {
                const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                elAvatar.innerHTML = `
                    <div style="
                        width: 100%; height: 100%; 
                        background: linear-gradient(135deg, #003049 0%, #005f73 100%); 
                        color: white; display: flex; align-items: center; justify-content: center; 
                        font-weight: bold; font-size: 2.5rem; border-radius: 50%;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        ${iniciales}
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}


// --- C. MOVIMIENTOS ---
async function iniciarMovimientos() {
    // console.log("📂 Cargando historial...");
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Cargando movimientos...</td></tr>';

    try {
        if (!window.CredoraAPI) throw new Error("API no disponible");

        const movimientos = await window.CredoraAPI.request('/billetera/movimientos?limite=20');

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No tienes movimientos recientes.</td></tr>';
            return;
        }

        tbody.innerHTML = ''; 

        movimientos.forEach(mov => {
            const fechaObj = new Date(mov.fecha);
            const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            
            const esIngreso = mov.tipo === 'INGRESO';
            const claseMonto = esIngreso ? 'monto-positivo' : 'monto-negativo';
            const signo = esIngreso ? '+' : '-';
            
            let iconoEstado = "<i class='bx bxs-check-circle success'></i> Completado";
            if (mov.estado === 'PENDIENTE') iconoEstado = "<i class='bx bxs-time-five pending'></i> Pendiente";
            if (mov.estado === 'FALLIDO') iconoEstado = "<i class='bx bxs-x-circle' style='color:red'></i> Fallido";

            let catClass = 'compras';
            if (mov.categoria === 'Transferencia' || mov.categoria === 'Ingreso') catClass = 'ingreso';
            if (mov.categoria === 'Servicios') catClass = 'entretenimiento';

            const row = `
                <tr>
                    <td>${fechaStr}</td>
                    <td>
                        <span class="titulo-transaccion">${mov.descripcion || 'Transacción'}</span><br>
                        <span class="subtitulo">${mov.referencia || ''}</span>
                    </td>
                    <td><span class="badge ${catClass}">${mov.categoria || 'General'}</span></td>
                    <td>${iconoEstado}</td>
                    <td class="text-right ${claseMonto}">${signo} $${parseFloat(mov.monto).toFixed(2)}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding: 2rem;">Error al cargar datos. Intenta nuevamente.</td></tr>';
    }
}


// --- D. TRANSFERENCIAS (CON PIN Y DATOS COMPLETOS) ---
async function iniciarTransferencias() {
    console.log("💸 Módulo Transferencias Iniciado");

    // 1. Cargar Saldo
    try {
        if (window.CredoraAPI) {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            if (datos) {
                const balanceDisplay = document.querySelector('.acc-balance strong');
                if (balanceDisplay) balanceDisplay.textContent = `$${datos.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            }
        }
    } catch (e) { console.error("Error cargando saldo", e); }

    // Variables de Estado
    let transferenciaPendiente = null;
    const modal = document.getElementById('pinModal');

    // --- MANEJO DEL PIN ---
    const pinInputs = document.querySelectorAll('.pin-box');
    
    // Configurar Inputs del PIN (Salto automático)
    pinInputs.forEach((input, index) => {
        // Limpiamos eventos previos clonando
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if (index < pinInputs.length - 1) pinInputs[index + 1].focus();
            }
            if (e.key === 'Backspace' && index > 0) {
                pinInputs[index - 1].focus();
            }
            if (e.key === 'Enter' && index === pinInputs.length - 1) {
                confirmarConPin();
            }
        });
    });

    // Función para ejecutar la transferencia real
    window.confirmarConPin = async () => {
        // 1. Obtener el PIN ingresado
        let pinIngresado = "";
        document.querySelectorAll('.pin-box').forEach(box => pinIngresado += box.value);

        if (pinIngresado.length !== 4) {
            alert("El PIN debe tener 4 dígitos.");
            return;
        }

        if (!transferenciaPendiente) return;

        // 2. Preparar datos finales
        const datosEnvio = {
            ...transferenciaPendiente, // Trae monto, motivo, nombre, etc.
            pin: pinIngresado // Agregamos el PIN al paquete
        };

        const btnModal = document.querySelector('.modal-actions .btn-confirmar');
        const txtOriginal = btnModal.textContent;
        btnModal.textContent = "Procesando...";
        btnModal.disabled = true;

        try {
            // 3. Enviar al Backend
            const respuesta = await window.CredoraAPI.request('/billetera/transferir', 'POST', datosEnvio);

            if (respuesta) {
                // cerrarModal(); // Definida abajo
                if(modal) modal.classList.remove('active');
                
                alert(`✅ Transferencia Exitosa!\n\nDestino: ${datosEnvio.nombre_beneficiario}\nMonto: $${datosEnvio.monto}`);
                window.cargarVista('Main_Parts/main_home.html');
            }
        } catch (error) {
            alert("❌ Error: " + error.message);
            // Limpiar PIN si falló
            document.querySelectorAll('.pin-box').forEach(box => box.value = '');
            document.getElementById('pin1').focus();
        } finally {
            btnModal.textContent = txtOriginal;
            btnModal.disabled = false;
        }
    };

    // Funciones del Modal
    window.toggleModal = (show) => {
        if (show) {
            modal.classList.add('active');
            setTimeout(() => document.getElementById('pin1').focus(), 100);
        } else {
            modal.classList.remove('active');
            document.querySelectorAll('.pin-box').forEach(box => box.value = '');
            transferenciaPendiente = null;
        }
    };

    window.validarPin = window.confirmarConPin; // Alias para el onclick del HTML

    // --- MANEJO DEL FORMULARIO PRINCIPAL ---
    const btnContinuar = document.querySelector('.form-actions .btn-confirmar');
    
    if (btnContinuar) {
        // Clonar para limpiar eventos
        const newBtn = btnContinuar.cloneNode(true);
        btnContinuar.parentNode.replaceChild(newBtn, btnContinuar);

        newBtn.addEventListener('click', () => {
            // 1. Capturar datos del HTML
            const inputs = document.querySelectorAll('.form-transferencia input');
            
            // Asumiendo el orden de tu HTML:
            // [0] = Nombre Beneficiario
            // [1] = Cédula Beneficiario
            // [2] = Teléfono Beneficiario
            // [3] = Monto
            // [4] = Motivo
            
            const nombre = inputs[0].value.trim();
            const cedula = inputs[1].value.trim();
            const telefono = inputs[2].value.trim();
            const monto = parseFloat(inputs[3].value);
            const motivo = inputs[4].value.trim();

            // 2. Validaciones
            if (!nombre || !cedula || !monto || monto <= 0) {
                alert("Por favor completa los datos obligatorios (Nombre, Cédula, Monto).");
                return;
            }

            // 3. Guardar en memoria temporal
            transferenciaPendiente = {
                nombre_beneficiario: nombre,
                cedula_destino: cedula,
                telefono_destino: telefono,
                identificador: cedula, // Usamos la cédula como ID principal para el backend
                monto: monto,
                motivo: motivo || "Transferencia Credora"
            };

            // 4. Pedir PIN
            toggleModal(true);
        });
    }

    const btnCancelar = document.querySelector('.form-actions .btn-cancelar');
    if(btnCancelar) {
        btnCancelar.addEventListener('click', () => window.cargarVista('Main_Parts/main_home.html'));
    }
    
    // Listener para cancelar en el Modal
    const btnCancelarModal = document.querySelector('.modal-actions .btn-cancelar');
    if (btnCancelarModal) {
         const newBtnCancel = btnCancelarModal.cloneNode(true);
         btnCancelarModal.parentNode.replaceChild(newBtnCancel, btnCancelarModal);
         newBtnCancel.addEventListener('click', () => window.toggleModal(false));
    }
}


// --- E. NOTIFICACIONES ---
function iniciarNotificaciones() {
    const btnMarcar = document.getElementById('btn-marcar-leidas');
    const notificaciones = document.querySelectorAll('.notificacion-item.no-leida');

    if (btnMarcar) {
        btnMarcar.addEventListener('click', () => {
            notificaciones.forEach(notif => {
                notif.classList.remove('no-leida');
                notif.style.transition = "background-color 0.5s";
            });
            alert("Todas las notificaciones marcadas como leídas.");
        });
    }
}

// --- F. DATA MOVIMIENTOS ---
function iniciardatamov() {
    window.copiarAlPortapapeles = function(texto) {
        navigator.clipboard.writeText(texto).then(() => {
            const toast = document.getElementById('toast-copiado');
            if(toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            }
        });
    };
    // Cargar datos para mostrar "Mi cuenta"
    if (window.CredoraAPI) {
        window.CredoraAPI.request('/billetera/saldo').then(datos => {
            if (datos) {
                const valCuenta = document.getElementById('val-cuenta');
                if (valCuenta) valCuenta.innerText = datos.numero_cuenta;
            }
        });
    }
}

// --- G. CONFIGURACIÓN ---
function iniciarConfiguracion() {
    const themeToggle = document.getElementById('config-theme-toggle');
    if(themeToggle) themeToggle.checked = document.body.classList.contains('dark');
}

// --- H. KYC (VERIFICACIÓN) - RECUPERADO ---
function iniciarKYC() {
    console.log(" Iniciando módulo KYC...");

    const formKyc = document.getElementById('form-kyc');
    const fileInput = document.getElementById('doc-id');
    const fileNameDisplay = document.getElementById('file-name');
    const vistaSubida = document.getElementById('vista-subida');
    const vistaCarga = document.getElementById('vista-carga');
    const vistaResultados = document.getElementById('vista-resultados');
    const barra = document.getElementById('barra-progreso');

    // 1. Mostrar nombre del archivo seleccionado
    if(fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const f = this.files[0];
                if(f.size > 5 * 1024 * 1024) {
                    alert(" Archivo muy pesado (Máx 5MB)");
                    this.value = "";
                    fileNameDisplay.textContent = "";
                } else {
                    fileNameDisplay.textContent = `Archivo: ${f.name}`;
                }
            }
        });
    }

    // 2. Enviar Documento (OCR)
    if(formKyc) {
        formKyc.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!fileInput.files[0]) { alert("Selecciona una imagen."); return; }

            // UI: Cambiar a Cargando
            vistaSubida.style.display = 'none';
            vistaCarga.style.display = 'block';

            // Simulación Barra Progreso
            let progreso = 0;
            const intervalo = setInterval(() => {
                progreso += 3;
                if(progreso > 90) progreso = 90; // Esperar al servidor
                if(barra) barra.style.width = `${progreso}%`;
            }, 100);

try {
                // Preparar FormData
                const formData = new FormData();
                formData.append('archivo', fileInput.files[0]);
                const token = localStorage.getItem('credora_token');

                console.log("Enviando imagen al servidor..."); // Log para depurar

                // Petición al Backend
                const response = await fetch('http://localhost:8000/api/v1/billetera/kyc/subir-documento', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if(!response.ok) {
                    // Intentamos leer el error del servidor, si es JSON
                    let mensajeError = "Error al analizar documento";
                    try {
                        const errorData = await response.json();
                        mensajeError = errorData.detail || mensajeError;
                    } catch (e) {
                        mensajeError = `Error del servidor: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(mensajeError);
                }
                
                const datosAPI = await response.json();
                console.log("Respuesta recibida:", datosAPI); // Ver qué llegó
                
                // Finalizar Barra
                clearInterval(intervalo);
                if(barra) barra.style.width = '100%';

                // ... resto del código (Mostrar Resultados) ...

            } catch (err) {
                console.error("Error en KYC:", err); // Ver error en consola roja
                clearInterval(intervalo);
                alert(" Ocurrió un error: " + err.message);
                
                // Reiniciar vista
                if(vistaCarga) vistaCarga.style.display = 'none';
                if(vistaSubida) vistaSubida.style.display = 'block';
            }
        });
    }

    // 3. Finalizar Proceso (Guardar Datos Extra)
    const formFinalizar = document.getElementById('form-finalizar-kyc');
    if(formFinalizar) {
        formFinalizar.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datosFinales = {
                direccion: document.getElementById('user-direccion').value,
                telefono: document.getElementById('user-phone').value,
                tipo_usuario: document.getElementById('tipe-user').value
            };

            try {
                const res = await window.CredoraAPI.request('/billetera/kyc/finalizar', 'POST', datosFinales);
                alert("✅ " + res.mensaje);
                window.cargarVista('Main_Parts/main_profile.html');
            } catch (err) {
                alert("Error guardando perfil: " + err.message);
            }
        });
    }
}

function iniciarEducacion() { console.log("Módulo educativo cargado"); }
function iniciarcredoramov() { console.log('Vista Credora Movimientos cargada'); }