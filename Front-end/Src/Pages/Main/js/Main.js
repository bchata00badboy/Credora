/* /Front-end/Src/Pages/Main/js/Main.js */

/* =========================================
   1. LOGICA GLOBAL (DOM READY)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado: inicializando Main.js');

    // --- A. LOGOUT DESDE EL SIDEBAR (RECUPERADO) ---
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
    const menuItemsDropDown = document.querySelectorAll('.menu-item-dropdown');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');

    // Minimizar sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('minimize');
        });
    }

    // Lógica de menús desplegables
    menuItemsDropDown.forEach((menuItem) => {
        menuItem.addEventListener('click', (e) => {
            if (sidebar.classList.contains('minimize')) return;

            const subMenu = menuItem.querySelector('.sub-menu');
            const isActive = menuItem.classList.toggle('sub-menu-toggle');
            
            if (subMenu) {
                subMenu.style.height = isActive ? `${subMenu.scrollHeight + 6}px` : '0';
                subMenu.style.padding = isActive ? '0.2rem 0' : '0';
            }
            
            // Cerrar otros menús
            menuItemsDropDown.forEach((item) => {
                if (item !== menuItem) {
                    const otherSubmenu = item.querySelector('.sub-menu');
                    if (otherSubmenu) {
                        item.classList.remove('sub-menu-toggle');
                        otherSubmenu.style.height = '0';
                        otherSubmenu.style.padding = '0';
                    }
                }
            });
        });
    });

    // Iniciar Navegación
    iniciarNavegacionSPA();
});


/* =========================================
   2. DICCIONARIO DE CONTROLADORES
   ========================================= */
const controladores = {
    'Main_Parts/main_home.html': iniciarInicio,
    'Main_Parts/main_profile.html': iniciarPerfil, // Ahora sí cargará datos
    'Main_Parts/main_notif.html': iniciarNotificaciones,
    'Main_Parts/main_transf1.html': iniciarTransferencias,
    'Main_Parts/main_mov.html': iniciarMovimientos,
    'Main_Parts/main_data_transf.html': iniciardatamov,
    'Main_Parts/main_config.html': iniciarConfiguracion,
    'Main_Parts/main_educ.html': iniciarEducacion
};

/* =========================================
   3. LOGICA DE NAVEGACIÓN (SPA)
   ========================================= */
function iniciarNavegacionSPA() {
    const menuLinks = document.querySelectorAll('.menu-link, .sub-menu-link');
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) console.error('No se encontró #contenedor-dinamico');

    // Función principal de carga
    window.cargarVista = function(rutaArchivo) {
        const rutaLimpia = rutaArchivo.replace('./', '');
        contenedor.style.opacity = '0';

        setTimeout(() => {
            fetch(rutaLimpia)
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error('No se encontró el archivo: ' + rutaLimpia);
                    return respuesta.text();
                })
                .then(html => {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;

                    // 1) Inyectar hojas de estilo
                    temp.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                        const href = l.getAttribute('href');
                        if (!href) return;
                        if (!document.querySelector(`link[href="${href}"]`)) {
                            const nl = document.createElement('link');
                            nl.rel = 'stylesheet';
                            nl.href = href;
                            document.head.appendChild(nl);
                        }
                    });

                    // 2) Insertar HTML
                    contenedor.innerHTML = temp.innerHTML;

                    // 3) Re-ejecutar scripts
                    const scripts = Array.from(contenedor.querySelectorAll('script'));
                    scripts.forEach(s => s.remove());

                    function runScripts(list, i = 0) {
                        if (i >= list.length) {
                            afterScripts(); return;
                        }
                        const s = list[i];
                        const newS = document.createElement('script');
                        if (s.src) {
                            newS.src = s.src;
                            newS.onload = () => runScripts(list, i + 1);
                            document.body.appendChild(newS);
                        } else {
                            newS.textContent = s.textContent;
                            document.body.appendChild(newS);
                            runScripts(list, i + 1);
                        }
                    }

                    function afterScripts() {
                        contenedor.style.opacity = '1';
                        try { if(window.CredoraTheme) window.CredoraTheme.setTheme(document.body.classList.contains('dark'), false); } catch(e) {}

                        if (controladores[rutaLimpia]) {
                            console.log(`Ejecutando controlador para: ${rutaLimpia}`);
                            controladores[rutaLimpia]();
                        }
                    }
                    runScripts(scripts);
                })
                .catch(error => {
                    console.error('Error:', error);
                    contenedor.innerHTML = `<div style="padding:2rem;"><h2>Error 404</h2><p>No se pudo cargar la vista.</p></div>`;
                    contenedor.style.opacity = '1';
                });
        }, 200);
    }

    // Eventos Click en el menú
    if (menuLinks && menuLinks.length) {
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Ignorar botón de logout del sidebar
                if (link.id === 'btn-logout-sidebar') return;

                const ruta = link.getAttribute('data-vista');
                if (!ruta || ruta === '#') return;

                e.preventDefault();
                
                // Active Class Logic
                document.querySelectorAll('.active').forEach(i => i.classList.remove('active'));
                link.classList.add('active');
                if(link.closest('.menu-item-dropdown')) link.closest('.menu-item-dropdown').classList.add('active');

                window.cargarVista(ruta);
            });
        });
    }

    // Cargar Inicio por defecto
    window.cargarVista('Main_Parts/main_home.html');
}


/* =========================================
   4. FUNCIONES ESPECÍFICAS (CONTROLADORES)
   ========================================= */

// --- A. INICIO (DASHBOARD) ---
async function iniciarInicio() {
    console.log("⚡ Cargando Dashboard...");

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

// --- B. PERFIL (CORREGIDO - AHORA CARGA DATOS) ---
async function iniciarPerfil() {
    console.log("👤 Cargando Perfil...");

    // 1. Manejo del formulario de contraseña (existente)
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Funcionalidad de cambio de contraseña en desarrollo.');
            formPassword.reset();
        });
    }

    // 2. CARGA DE DATOS DEL USUARIO (LO QUE FALTABA)
    if (!window.CredoraAPI) return;

    try {
        const datos = await window.CredoraAPI.request('/billetera/saldo');
        if (datos) {
            // Nombre Completo
            const elName = document.getElementById('profile-name');
            if (elName) elName.textContent = datos.titular; 

            // Correo
            const elEmail = document.getElementById('profile-email');
            if (elEmail) elEmail.textContent = datos.email;

            // Cuenta
            const elAccount = document.getElementById('profile-account');
            if (elAccount) elAccount.textContent = datos.numero_cuenta;

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
    console.log("📂 Cargando historial...");
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


// --- D. TRANSFERENCIAS (CON PIN DE SEGURIDAD) ---
async function iniciarTransferencias() {
    console.log("💸 Módulo Transferencias Iniciado");

    // 1. Cargar Saldo (Igual que antes)
    try {
        if (window.CredoraAPI) {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            if (datos) {
                const balanceDisplay = document.querySelector('.acc-balance strong');
                if (balanceDisplay) balanceDisplay.textContent = `$${datos.saldo_actual.toFixed(2)}`;
            }
        }
    } catch (e) { console.error("Error cargando saldo", e); }


    // --- VARIABLES DE ESTADO ---
    // Aquí guardaremos los datos mientras el usuario escribe el PIN
    let transferenciaPendiente = null;
    let botonOriginalRef = null; // Para devolverle el texto al botón si falla


    // --- LÓGICA DEL MODAL Y PIN ---
    const modal = document.getElementById('pinModal');
    
    // Función interna para cerrar modal y limpiar
    const cerrarModal = () => {
        if(modal) modal.classList.remove('active');
        document.querySelectorAll('.pin-box').forEach(input => input.value = '');
    };

    // Función que se ejecuta SOLO si el PIN es correcto
    const ejecutarTransferenciaReal = async () => {
        if (!transferenciaPendiente) return;

        const { identificador, monto, motivo, btn } = transferenciaPendiente;
        
        // Efectos visuales de carga (en el botón original o en el modal)
        const textoOriginal = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Procesando...";
        cerrarModal(); // Cerramos el modal para ver el proceso en el fondo

        try {
            // 🔥 TU LLAMADA API ORIGINAL
            const resultado = await window.CredoraAPI.request('/billetera/transferir', 'POST', {
                identificador: identificador, 
                monto: monto,
                motivo: motivo
            });

            if (resultado) {
                alert(`✅ ¡Transferencia Exitosa!\nEnviado a: ${resultado.destinatario}\nNuevo Saldo: $${resultado.nuevo_saldo}`);
                window.cargarVista('Main_Parts/main_home.html');
            }
        } catch (err) {
            alert("❌ Falló la transferencia:\n" + err.message);
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
        
        // Limpiamos la variable temporal
        transferenciaPendiente = null;
    };

    // Configuración de inputs del PIN (Auto-salto y Validación)
    const pinInputs = document.querySelectorAll('.pin-box');
    if (pinInputs.length > 0) {
        // Clonamos para limpiar listeners viejos si se recarga la vista
        pinInputs.forEach(oldInput => {
            const newInput = oldInput.cloneNode(true);
            oldInput.parentNode.replaceChild(newInput, oldInput);
        });
        
        // Re-seleccionamos los nuevos inputs limpios
        const inputsLimpios = document.querySelectorAll('.pin-box');
        
        inputsLimpios.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                // Auto-focus siguiente
                if (input.value.length === 1 && index < inputsLimpios.length - 1) {
                    inputsLimpios[index + 1].focus();
                }
                // Backspace
                if (e.key === 'Backspace' && index > 0) {
                    inputsLimpios[index - 1].focus();
                }
                // Enter en el último input
                if (e.key === 'Enter' && index === inputsLimpios.length - 1) {
                    validarYEnvia();
                }
            });
        });

        // Función interna para chequear el PIN
        const validarYEnvia = () => {
            let pin = '';
            inputsLimpios.forEach(i => pin += i.value);
            
            // 🔥 AQUÍ VALIDAS EL PIN (Simulado 1234)
            if (pin === "1234") {
                ejecutarTransferenciaReal();
            } else {
                // Efecto de error visual
                const container = document.querySelector('.pin-container');
                if(container) {
                    container.style.animation = "shake 0.3s";
                    setTimeout(() => container.style.animation = "", 300);
                }
                inputsLimpios.forEach(i => i.value = '');
                inputsLimpios[0].focus();
            }
        };

        // Listener para el botón "Autorizar" del Modal
        const btnAutorizarModal = document.querySelector('.modal-actions .btn-confirmar');
        if (btnAutorizarModal) {
            // Clonar para limpiar eventos previos
            const newBtnAuth = btnAutorizarModal.cloneNode(true);
            btnAutorizarModal.parentNode.replaceChild(newBtnAuth, btnAutorizarModal);
            newBtnAuth.addEventListener('click', validarYEnvia);
        }

        // Listener para cancelar en el Modal
        const btnCancelarModal = document.querySelector('.modal-actions .btn-cancelar');
        if (btnCancelarModal) {
             const newBtnCancel = btnCancelarModal.cloneNode(true);
             btnCancelarModal.parentNode.replaceChild(newBtnCancel, btnCancelarModal);
             newBtnCancel.addEventListener('click', cerrarModal);
        }
    }


    // --- 2. CONFIGURACIÓN DEL BOTÓN "CONTINUAR" PRINCIPAL ---
    const btnConfirmar = document.querySelector('.btn-confirmar'); // El del formulario
    if (btnConfirmar) {
        const newBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // Recolección de datos
            const destinoInput = document.getElementById('input-destino');
            const montoInput = document.querySelector('.input-monto');
            const motivoInput = document.getElementById('input-motivo');

            const identificador = (destinoInput ? destinoInput.value : document.querySelector('.input-with-icon input[type="text"]').value).trim();
            const monto = montoInput ? parseFloat(montoInput.value) : 0;
            const motivo = motivoInput ? motivoInput.value.trim() : 'Transferencia';

            // Validación básica
            if (!identificador || monto <= 0) {
                alert("Por favor ingresa un destinatario válido y un monto mayor a 0.");
                return;
            }

            // 🔥 AQUÍ ESTÁ EL CAMBIO: No enviamos, solo guardamos y abrimos modal
            transferenciaPendiente = {
                identificador,
                monto,
                motivo,
                btn: newBtn
            };

            // Abrir Modal
            if(modal) {
                modal.classList.add('active');
                setTimeout(() => document.getElementById('pin1')?.focus(), 100);
            } else {
                alert("Error: No se encontró el modal de seguridad en el HTML");
            }
        });
    }
    
    // Botón cancelar del formulario principal
    const btnCancelar = document.querySelector('.form-actions .btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => { window.cargarVista('Main_Parts/main_home.html'); });
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

function iniciarEducacion() { console.log("Módulo educativo cargado"); }
function iniciarcredoramov() { console.log('Vista Credora Movimientos cargada'); }