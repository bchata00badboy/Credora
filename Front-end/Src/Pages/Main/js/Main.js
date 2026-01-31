// Front-end\Src\Pages\Main\js\Main.js

/* =========================================
   1. VARIABLES GLOBALES Y DICCIONARIO
   ========================================= */
const contenedorDinamico = document.getElementById('contenedor-dinamico');
const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');

// Mapa de rutas -> funciones
const controladores = {
    'Main_Parts/main_home.html': iniciarInicio,
    'Main_Parts/main_profile.html': iniciarPerfil,
    'Main_Parts/main_notif.html': iniciarNotificaciones,
    'Main_Parts/main_transf1.html': iniciarTransferencias,
    'Main_Parts/main_mov.html': iniciarMovimientos,
    'Main_Parts/main_data_transf.html': iniciardatamov, 
    'Main_Parts/main_mov_data.html': iniciardatamov,    
    'Main_Parts/main_kyc.html': iniciarKYC, 
    'Main_Parts/main_config.html': iniciarConfiguracion,
    'Main_Parts/main_educ.html': iniciarEducacion
};

/* =========================================
   2. MOTOR DE NAVEGACIÓN (SPA + LOADER)
   ========================================= */
async function cargarVista(ruta) {
    console.log(`🔄 Navegando a: ${ruta}`);

    // A) Mostrar Pantalla de Carga
    if (window.Loader) window.Loader.show();

    try {
        // --- Retardo Artificial (Opcional, para UX) ---
        await new Promise(r => setTimeout(r, 600)); 

        // B) Cargar HTML
        const response = await fetch(ruta);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const html = await response.text();

        // C) Inyectar HTML
        if (contenedorDinamico) {
            contenedorDinamico.innerHTML = html;
            // Reactivar scripts incrustados en el HTML parcial
            ejecutarScriptsScripts(contenedorDinamico);
            // Aplicar animación de entrada a la vista inyectada
            try {
                const firstChild = contenedorDinamico.firstElementChild;
                const useSlow = typeof ruta === 'string' && ruta.toLowerCase().includes('kyc');
                const cls = useSlow ? 'view-entry-slow' : 'view-entry';
                if (firstChild) {
                    firstChild.classList.remove('view-entry', 'view-entry-slow');
                    // forzar reflow para reiniciar la animación
                    void firstChild.offsetWidth;
                    firstChild.classList.add(cls);
                } else {
                    // fallback: animar el contenedor
                    contenedorDinamico.classList.remove('view-entry', 'view-entry-slow');
                    void contenedorDinamico.offsetWidth;
                    contenedorDinamico.classList.add(cls);
                }
            } catch (e) { console.warn('No se pudo aplicar animación de entrada:', e); }
        }

        // D) Ejecutar Lógica Específica (Controlador)
        if (controladores[ruta]) {
            // Esperamos a que la función termine (ej: cargar saldo) antes de quitar el loader
            await controladores[ruta]();
        }

    } catch (error) {
        console.error("❌ Error cargando vista:", error);
        if(contenedorDinamico) {
            contenedorDinamico.innerHTML = `
                <div style="text-align:center; padding:50px; color:#ef4444;">
                    <h2>¡Ups! Algo salió mal.</h2>
                    <p>No pudimos cargar la sección solicitada.</p>
                    <small>${error.message}</small>
                </div>`;
        }
    } finally {
        // E) Ocultar Pantalla de Carga (Siempre)
        if (window.Loader) window.Loader.hide();
        
        // F) Actualizar Sidebar (Visual)
        sidebarLinks.forEach(l => {
            l.classList.remove('active');
            if(l.getAttribute('data-vista') === ruta) l.classList.add('active');
        });
    }
}

// Helper: Reactiva <script> dentro de las vistas cargadas con innerHTML
function ejecutarScriptsScripts(contenedor) {
    const scripts = contenedor.querySelectorAll("script");
    scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

/* =========================================
   3. INICIALIZACIÓN (DOM READY) - TÚ LÓGICA ORIGINAL
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado: Inicializando Main.js Completo');

    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');

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
                if (isActive) {
                    subMenu.classList.add('show');
                    subMenu.style.maxHeight = `${subMenu.scrollHeight + 6}px`;
                    subMenu.style.padding = '0.2rem 0';
                } else {
                    subMenu.classList.remove('show');
                    subMenu.style.maxHeight = '0';
                    subMenu.style.padding = '0';
                }
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
                submenuWrapper.classList.add('show');
                submenuWrapper.style.maxHeight = `${submenuWrapper.scrollHeight + 6}px`;
                submenuWrapper.style.padding = '0.2rem 0';
                if (sidebar) sidebar.classList.add('hover');
            } else {
                submenuWrapper.classList.remove('show');
                submenuWrapper.style.maxHeight = '0';
                submenuWrapper.style.padding = '0';
                if (sidebar) sidebar.classList.remove('hover');
            }
            return;
        }

        // --- 3. NAVEGACIÓN SPA (MODIFICADO PARA USAR CARGARVISTA) ---
        const link = e.target.closest('.menu-link, .sub-menu-link');
        
        if (link && link.id !== 'btn-logout-sidebar') {
            const ruta = link.getAttribute('data-vista');
            
            if (ruta && ruta !== '#') {
                e.preventDefault();
                
                // Actualizar clases 'active' visuales
                document.querySelectorAll('.active').forEach(i => i.classList.remove('active'));
                link.classList.add('active');
                if(link.closest('.menu-item-dropdown')) link.closest('.menu-item-dropdown').classList.add('active');

                // LLAMAR A LA NUEVA FUNCIÓN CON LOADER
                cargarVista(ruta);

                // Cerrar sidebar en móvil
                if(sidebar) sidebar.classList.remove('hover');
            }
        }
    });

    // --- D. BUSQUEDA GLOBAL ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = (e.target.value || '').toLowerCase().trim();

            // 1) Si existe el sidebar, filtrar los items del menú
            const navList = document.querySelector('.nav_list');
            if (navList) {
                const items = Array.from(navList.querySelectorAll(':scope > li'));
                items.forEach(li => {
                    // Ignorar separadores u otros elementos sin enlaces
                    const anchors = Array.from(li.querySelectorAll('a'));
                    if (!anchors.length) { li.style.display = ''; return; }

                    // Si alguno de los anchors dentro del li coincide, mostrar el li
                    const matches = anchors.some(a => {
                        const nameEl = a.querySelector('.links_name');
                        const text = (nameEl ? nameEl.textContent : a.textContent || '').toLowerCase();
                        return text.includes(term);
                    });

                    li.style.display = matches ? '' : 'none';
                });
                return;
            }

            // 2) Fallback: si hay tablas cargadas, filtrar filas
            const rows = document.querySelectorAll('tbody tr');
            if (rows.length) {
                rows.forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
                });
            }
        });
    }

    // --- E. SIDEBAR HOVER ---
    if (sidebar) {
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        function resetSidebarToActive() {
            // quitar estado hover visual
            sidebar.classList.remove('hover');
            if(sidebarOverlay) { sidebarOverlay.style.pointerEvents = 'none'; sidebarOverlay.style.opacity = '0'; sidebarOverlay.setAttribute('aria-hidden','true'); }

            // Reiniciar campo de búsqueda y mostrar todos los items
            const searchInputEl = document.getElementById('searchInput');
            if (searchInputEl && searchInputEl.value) {
                searchInputEl.value = '';
                // disparar evento input para que el listener restablezca la lista
                const ev = new Event('input', { bubbles: true });
                searchInputEl.dispatchEvent(ev);
            }

            // cerrar todos los submenús excepto el que corresponde al item activo
            const allSubmenus = Array.from(document.querySelectorAll('.submenu-wrapper, .sub-menu'));
            allSubmenus.forEach(sub => {
                const li = sub.closest('li');
                const isActive = li && li.classList && li.classList.contains('active');
                    if (isActive) {
                        // abrir el del activo
                        sub.classList.add('show');
                        sub.style.maxHeight = `${sub.scrollHeight + 6}px`;
                        sub.style.padding = '0.2rem 0';
                        const parent = li;
                        if(parent) parent.classList.add('sub-menu-toggle');
                    } else {
                        // cerrar los demás
                        sub.classList.remove('show');
                        if(sub.style) { sub.style.maxHeight = '0'; sub.style.padding = '0'; }
                        const parent = li;
                        if(parent) parent.classList.remove('sub-menu-toggle');
                    }
            });
        }

        // Cuando el mouse entra, expandemos de forma temporal si está minimizada
        sidebar.addEventListener('mouseenter', () => {
            if (sidebar.classList.contains('minimize')) {
                sidebar.classList.add('hover');
                if(sidebarOverlay) { sidebarOverlay.style.pointerEvents = 'auto'; sidebarOverlay.style.opacity = '1'; sidebarOverlay.setAttribute('aria-hidden','false'); }
            }
        });

        // Cuando el mouse sale del sidebar, reiniciamos al estado con el item activo
        sidebar.addEventListener('mouseleave', () => {
            // Solo quitar hover si la expansión fue temporal (sidebar minimizada)
            if (sidebar.classList.contains('minimize')) {
                sidebar.classList.remove('hover');
            }
            resetSidebarToActive();
        });

        // Si el mouse entra sobre el overlay, tratar como salida (por si el overlay cubre espacio)
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('mouseenter', () => resetSidebarToActive());
            sidebarOverlay.addEventListener('click', () => resetSidebarToActive());
        }
    }

    // Iniciar el enrutador (Carga inicial)
    cargarVista('Main_Parts/main_home.html');
});


/* =========================================
   4. CONTROLADORES (LÓGICA DE NEGOCIO)
   ========================================= */

// --- A. DASHBOARD (INICIO) + RECARGA SIMULADA ---
async function iniciarInicio() {
    console.log("⚡ Init Dashboard...");
    
    // 1. Gráficas
    if (typeof window.renderMainChart === 'function') window.renderMainChart();
    if (typeof window.renderUsageChart === 'function') window.renderUsageChart();

    // 2. Datos API (Cargar saldo inicial)
    let saldoActual = 0; // Guardamos el saldo en memoria
    if (window.CredoraAPI) {
        try {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            if (datos) {
                saldoActual = datos.saldo_actual;
                actualizarDOMSaldo(datos);
                
                // Actualizar Sidebar y Avatar
                const sbName = document.querySelector('.sidebar .user-data .name');
                if(sbName) sbName.textContent = datos.titular.split(' ')[0];
                const sbEmail = document.querySelector('.sidebar .user-data .email');
                if(sbEmail) sbEmail.textContent = datos.email;
                
                const userImg = document.querySelector('.sidebar .user-img');
                if (userImg) {
                    const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    userImg.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#003049,#005f73);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;border-radius:50%;">${iniciales}</div>`;
                }

                if (typeof window.actualizarGraficasDesdeAPI === 'function' && datos.historial) {
                    window.actualizarGraficasDesdeAPI(datos.historial);
                }
            }
        } catch(e) { console.error("Error Dashboard:", e); }
    }

    // 3. LOGICA DE RECARGA (SIMULACIÓN)
    iniciarModuloRecarga();

    // 4. Eventos Visuales (Flip Card)
    setTimeout(() => {
        const card = document.querySelector('.bank-card');
        if(card) card.onclick = (e) => {
            if(!e.target.closest('.btn-eye')) card.classList.toggle('flip');
        };
        // Ojo
        const btnEye = document.getElementById('btn-toggle-card-data');
        if(btnEye) {
            const newBtn = btnEye.cloneNode(true);
            btnEye.parentNode.replaceChild(newBtn, btnEye);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const container = document.querySelector('.tarjeta-visual-container');
                const num = document.querySelector('.card-number');
                const isMasked = container.classList.toggle('masked');
                const icon = newBtn.querySelector('i');
                if(num) num.textContent = isMasked ? "**** **** **** ****" : (num.dataset.real || "0000");
                if(icon) icon.className = isMasked ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            });
        }
    }, 100);

    // --- FUNCIONES AUXILIARES INTERNAS ---

    function actualizarDOMSaldo(datos) {
        const elSaldo = document.querySelector('.saldo-amount');
        if(elSaldo) elSaldo.innerHTML = `$${datos.saldo_actual.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="currency">USD</span>`;
        
        const elCuenta = document.querySelector('.saldo-footer');
        if(elCuenta) elCuenta.textContent = `Cuenta: ${datos.numero_cuenta}`;
        
        const elCard = document.querySelector('.card-number');
        if(elCard) {
            elCard.dataset.real = `**** **** **** ${datos.tarjeta_ultimos_4 || '0000'}`;
            elCard.textContent = elCard.dataset.real;
        }
        const elTitular = document.querySelector('.card-holder');
        if(elTitular) elTitular.textContent = datos.titular.toUpperCase();
    }

    function iniciarModuloRecarga() {
        const btnAbrir = document.getElementById('btn-abrir-recarga');
        const modal = document.getElementById('modal-recarga');
        const btnCerrar = document.getElementById('btn-cerrar-modal');
        const btnConfirmar = document.getElementById('btn-confirmar-pago');
        const inputBs = document.getElementById('input-bs');
        const resUsd = document.getElementById('res-usd');
        const TASA = 45.50; // Tasa de cambio simulada

        if(!btnAbrir || !modal) return;

        // Abrir Modal
        btnAbrir.onclick = () => {
            modal.style.display = 'flex';
            inputBs.value = '';
            resUsd.textContent = '0.00';
            setTimeout(() => inputBs.focus(), 100);
        };

        // Cerrar Modal
        const cerrar = () => {
            modal.style.display = 'none';
        };
        btnCerrar.onclick = cerrar;
        
        modal.onclick = (e) => { if(e.target === modal) cerrar(); };

        // Calculadora en tiempo real
        inputBs.oninput = () => {
            const bs = parseFloat(inputBs.value) || 0;
            const usd = bs / TASA;
            // Mostrar máximo 2 decimales
            resUsd.textContent = usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        };

        // --- LÓGICA DE ENVÍO REAL AL BACKEND ---
        btnConfirmar.onclick = async () => {
            const bs = parseFloat(inputBs.value);
            if(!bs || bs <= 0) { alert("Ingresa un monto válido en Bolívares."); return; }

            const usdRecarga = bs / TASA; // Monto a enviar al backend
            
            // UI: Bloquear botón (Loading)
            const textoOriginal = btnConfirmar.textContent;
            btnConfirmar.textContent = "Procesando...";
            btnConfirmar.disabled = true;

            try {
                // LLAMADA AL SERVIDOR
                const payload = { monto_usd: usdRecarga };
                const respuesta = await window.CredoraAPI.request('/billetera/recargar', 'POST', payload);

                if (respuesta) {
                    alert(`✅ ¡Recarga Exitosa!\nHas abonado $${usdRecarga.toFixed(2)} USD a tu cuenta.`);
                    
                    // Actualizar el saldo visualmente con el dato real del servidor
                    const elSaldo = document.querySelector('.saldo-amount');
                    if(elSaldo) {
                        elSaldo.innerHTML = `$${respuesta.nuevo_saldo.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="currency">USD</span>`;
                    }

                    // (Opcional) Si quieres que la gráfica se actualice también, podrías recargar la vista:
                    // window.cargarVista('Main_Parts/main_home.html'); 
                    
                    cerrar();
                }

            } catch (error) {
                console.error(error);
                alert("❌ Error en la recarga: " + error.message);
            } finally {
                // UI: Restaurar botón
                btnConfirmar.textContent = textoOriginal;
                btnConfirmar.disabled = false;
            }
        };
    }
}

// --- B. KYC (VERIFICACIÓN) ---
function iniciarKYC() {
    console.log("🔐 Módulo KYC: Iniciado.");

    const formKyc = document.getElementById('form-kyc');
    const fileInput = document.getElementById('doc-id');
    const fileNameDisplay = document.getElementById('file-name');
    
    // Vistas
    const vistaSubida = document.getElementById('vista-subida');
    const vistaCarga = document.getElementById('vista-carga');
    const vistaResultados = document.getElementById('vista-resultados');
    
    // Feedback
    const barra = document.getElementById('barra-progreso');
    const textoCarga = document.querySelector('#vista-carga h3'); // El título "Analizando..."
    const subtextoCarga = document.querySelector('#vista-carga p'); // El texto de abajo

    if(fileInput) {
        fileInput.addEventListener('change', function() {
            if(this.files && this.files[0]) {
                fileNameDisplay.textContent = `📷 ${this.files[0].name}`;
                fileNameDisplay.style.color = "#00d26a";
            }
        });
    }

    if(formKyc) {
        formKyc.addEventListener('submit', async (e) => {
            e.preventDefault();

            if(!fileInput.files[0]) {
                alert("⚠️ Selecciona una foto de tu cédula.");
                return;
            }

            // 1. PREPARAR UI PARA ESPERA LARGA
            vistaSubida.style.display = 'none';
            vistaResultados.style.display = 'none';
            vistaCarga.style.display = 'block';
            
            // Resetear textos
            if(textoCarga) textoCarga.textContent = "Subiendo imagen...";
            if(subtextoCarga) subtextoCarga.textContent = "Esto puede tardar unos segundos.";

            // 2. BARRA DE PROGRESO ASINTÓTICA (Para 2 minutos)
            let progreso = 0;
            barra.style.width = '0%';
            
            // Actualizamos cada 500ms
            const intervalo = setInterval(() => {
                // Lógica: Sube rápido al principio, luego muy lento
                if (progreso < 30) {
                    progreso += 2; // Inicio rápido (Subida)
                } else if (progreso < 70) {
                    progreso += 0.5; // Proceso medio (OCR)
                    if(textoCarga) textoCarga.textContent = "Analizando documento...";
                    if(subtextoCarga) subtextoCarga.textContent = "Nuestra IA está leyendo tu cédula (EasyOCR)...";
                } else if (progreso < 95) {
                    progreso += 0.1; // Final lento (Validaciones)
                    if(textoCarga) textoCarga.textContent = "Verificando datos...";
                    if(subtextoCarga) subtextoCarga.textContent = "Por favor espera, no cierres la página (Máx 2 min).";
                }
                
                // Nunca llega a 100% solo con el timer
                if (progreso > 95) progreso = 95;
                
                barra.style.width = progreso + '%';
            }, 500);

            try {
                // 3. PETICIÓN AL SERVIDOR (Tiempo de espera largo)
                const formData = new FormData();
                formData.append('archivo', fileInput.files[0]);
                const token = localStorage.getItem('credora_token');

                console.log("⏳ Enviando a EasyOCR (puede tardar 30s-120s)...");

                const response = await fetch('http://127.0.0.1:8000/api/v1/billetera/kyc/subir-documento', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if(!response.ok) {
                    const errJson = await response.json().catch(() => ({}));
                    throw new Error(errJson.detail || `Error del servidor: ${response.status}`);
                }

                const data = await response.json();
                console.log("✅ OCR Completado:", data);

                // 4. FINALIZACIÓN
                clearInterval(intervalo);
                barra.style.width = '100%';
                if(textoCarga) textoCarga.textContent = "¡Análisis Completado!";

                setTimeout(() => {
                    // Llenar campos
                    const info = data.datos_extraidos || {};
                    document.getElementById('res-nombre').value = info.nombre || "";
                    document.getElementById('res-cedula').value = info.cedula || "";
                    
                    const badge = document.getElementById('res-vencimiento');
                    if(badge) {
                        if (info.documento_valido) {
                            badge.textContent = "Vigente ✅";
                            badge.className = "status-badge valid";
                            badge.style.color = "green";
                        } else {
                            badge.textContent = "Vencido/No legible ⚠️";
                            badge.className = "status-badge expired";
                            badge.style.color = "red";
                        }
                    }

                    // Mostrar formulario manual
                    vistaCarga.style.display = 'none';
                    vistaResultados.style.display = 'block';
                    
                }, 500);

            } catch (err) {
                clearInterval(intervalo);
                console.error("❌ Fallo en KYC:", err);
                alert("Hubo un problema: " + err.message);
                
                // Reiniciar
                vistaCarga.style.display = 'none';
                vistaSubida.style.display = 'block';
                barra.style.width = '0%';
            }
        });
    }

    // 3. Guardado Final
    const formFinalizar = document.getElementById('form-finalizar-kyc');
    if(formFinalizar) {
        formFinalizar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formFinalizar.querySelector('button[type="submit"]');
            const txtOriginal = btn.innerText;
            btn.innerText = "Guardando...";
            btn.disabled = true;

            const payload = {
                direccion: document.getElementById('user-direccion').value,
                telefono: document.getElementById('user-phone').value,
                tipo_usuario: document.getElementById('tipe-user').value
            };

            try {
                const res = await window.CredoraAPI.request('/billetera/kyc/finalizar', 'POST', payload);
                alert("✅ " + (res.mensaje || "Perfil verificado exitosamente"));
                window.cargarVista('Main_Parts/main_profile.html');
            } catch (err) {
                alert("Error al guardar: " + err.message);
                btn.innerText = txtOriginal;
                btn.disabled = false;
            }
        });
    }
}

// --- C. MOVIMIENTOS ---
async function iniciarMovimientos() {
    const tbody = document.querySelector('table tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando...</td></tr>';

    if(window.CredoraAPI) {
        try {
            const movs = await window.CredoraAPI.request('/billetera/movimientos?limite=20');
            if(movs && movs.length > 0) {
                tbody.innerHTML = '';
                movs.forEach(m => {
                    const esIngreso = m.tipo === 'INGRESO';
                    const signo = esIngreso ? '+' : '-';
                    const colorClass = esIngreso ? 'monto-positivo' : 'monto-negativo';
                    
                    const row = `<tr>
                        <td>${new Date(m.fecha).toLocaleDateString()}</td>
                        <td>${m.descripcion}<br><small>${m.referencia||''}</small></td>
                        <td><span class="badge">${m.categoria}</span></td>
                        <td>${m.estado}</td>
                        <td class="${colorClass}">${signo} $${parseFloat(m.monto).toFixed(2)}</td>
                    </tr>`;
                    tbody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Sin movimientos.</td></tr>';
            }
        } catch(e) { 
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión.</td></tr>';
        }
    }
}

// --- D. TRANSFERENCIAS ---
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

// --- E. PERFIL ---
// --- E. PERFIL ---
// --- E. PERFIL (COMPLETA) ---
async function iniciarPerfil() {
    console.log("👤 Iniciando módulo Perfil...");

    // ------------------------------------------------------
    // 1. CARGA DE DATOS DEL USUARIO (API)
    // ------------------------------------------------------
    if (window.CredoraAPI) {
        try {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            
            if (datos) {
                // Helper interno para asignar texto
                const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };

                // A) Llenar Campos Básicos
                setTxt('profile-name', datos.titular);
                setTxt('profile-email', datos.email);
                setTxt('profile-account', datos.numero_cuenta);
                
                // B) Llenar Campos Extra (Con validación de nulos)
                setTxt('profile-cedula', datos.cedula || '--');
                setTxt('profile-direccion', datos.direccion || '--');
                setTxt('profile-telefono', datos.telefono || '--');

                // C) Estado KYC y Botón
                const estadoEl = document.getElementById('profile-status');
                const btnKyc = document.getElementById('btn-kyc');
                
                if (estadoEl && datos.estado_kyc) {
                    estadoEl.textContent = datos.estado_kyc;
                    if (datos.estado_kyc === 'APROBADO') {
                        estadoEl.style.color = '#00d26a'; // Verde
                        // Si está aprobado, ocultamos el botón de verificarse
                        if(btnKyc) btnKyc.style.display = 'none'; 
                    } else {
                        estadoEl.style.color = '#ffa500'; // Naranja
                        if(btnKyc) btnKyc.style.display = 'inline-flex';
                    }
                }

                // D) Generar Avatar con Iniciales
                const elAvatar = document.getElementById('profile-avatar');
                if (elAvatar) {
                    const iniciales = (datos.titular || "U").split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                    
                    elAvatar.innerHTML = `
                        <div style="
                            width: 100%; height: 100%; 
                            background: linear-gradient(135deg, #003049, #005f73); 
                            color: white; display: flex; align-items: center; justify-content: center; 
                            font-weight: bold; font-size: 2.5rem; border-radius: 50%; 
                            box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                            ${iniciales}
                        </div>`;
                }
            }
        } catch (e) {
            console.error("Error cargando perfil:", e);
        }
    }

    // ------------------------------------------------------
    // 2. LÓGICA DE MODALES (ABRIR / CERRAR)
    // ------------------------------------------------------
    const openModal = (id) => { 
        const m = document.getElementById(id); 
        if(m) m.classList.add('active'); 
    };
    
    const closeModal = (el) => { 
        if(el) el.classList.remove('active'); 
        // Limpiar formularios al cerrar
        const form = el.querySelector('form');
        if(form) form.reset();
    };

    // Eventos para abrir (data-modal)
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        };
    });

    // Eventos para cerrar (X o fondo oscuro)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.onclick = (e) => {
            if (e.target === overlay || e.target.classList.contains('modal-close')) {
                closeModal(overlay);
            }
        };
    });

    // ------------------------------------------------------
    // 3. LÓGICA DE INPUTS PIN (AUTO-FOCUS)
    // ------------------------------------------------------
    const pinInputs = document.querySelectorAll('.pin-digit');
    pinInputs.forEach((input, index) => {
        // Limpiar al iniciar
        input.value = '';
        
        input.addEventListener('input', (e) => {
            // Solo permitir números
            input.value = input.value.replace(/\D/g, '').slice(0, 1);
            
            // Saltar al siguiente input automáticamente
            if (input.value && index < pinInputs.length - 1) {
                // Verificar si el siguiente input pertenece al mismo grupo (misma fila)
                const nextInput = pinInputs[index + 1];
                if (nextInput.parentNode === input.parentNode) {
                    nextInput.focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            // Borrar y regresar al anterior
            if (e.key === 'Backspace' && !input.value && index > 0) {
                const prevInput = pinInputs[index - 1];
                if (prevInput.parentNode === input.parentNode) {
                    prevInput.focus();
                }
            }
        });
    });

    // ------------------------------------------------------
    // 4. FORMULARIO: CAMBIAR CONTRASEÑA
    // ------------------------------------------------------
    const formPass = document.getElementById('form-change-pass');
    if (formPass) {
        formPass.onsubmit = async (e) => {
            e.preventDefault();
            const nPass = formPass.querySelector('input[name="new-pass"]').value;
            const cPass = formPass.querySelector('input[name="confirm-pass"]').value;

            if (nPass.length < 6) { alert("La contraseña debe tener al menos 6 caracteres."); return; }
            if (nPass !== cPass) { alert("Las contraseñas no coinciden."); return; }

            // Aquí iría la llamada real a la API
            // await window.CredoraAPI.request('/auth/cambiar-password', 'POST', { ... });
            
            alert("✅ Contraseña actualizada correctamente.");
            closeModal(document.getElementById('modal-pass'));
        };
    }

    // ------------------------------------------------------
    // 5. FORMULARIO: CAMBIAR PIN
    // ------------------------------------------------------
    const formPin = document.getElementById('form-change-pin');
    if (formPin) {
        formPin.onsubmit = async (e) => {
            e.preventDefault();
            
            // Función para concatenar los 4 dígitos de un grupo específico
            const getPinValue = (groupName) => {
                const group = formPin.querySelector(`.pin-input[data-group="${groupName}"]`);
                if(!group) return "";
                return Array.from(group.querySelectorAll('.pin-digit'))
                            .map(i => i.value)
                            .join('');
            };

            const oldP = getPinValue('old');
            const newP = getPinValue('new');
            const confP = getPinValue('confirm');

            if (newP.length < 4 || confP.length < 4) { 
                alert("Por favor completa los 4 dígitos del PIN."); return; 
            }
            if (newP !== confP) { 
                alert("El nuevo PIN y la confirmación no coinciden."); return; 
            }

            // Aquí iría la llamada real a la API
            // await window.CredoraAPI.request('/auth/cambiar-pin', 'POST', { old: oldP, new: newP });

            alert("✅ PIN de seguridad actualizado.");
            closeModal(document.getElementById('modal-pin'));
        };
    }

    // ------------------------------------------------------
    // 6. NAVEGACIÓN A KYC (Desde el perfil)
    // ------------------------------------------------------
    const btnKycLink = document.getElementById('btn-kyc');
    if(btnKycLink) {
        btnKycLink.onclick = (e) => {
            e.preventDefault();
            if (window.cargarVista) window.cargarVista('Main_Parts/main_kyc.html');
        };
    }
}
// Helper pequeño para seguridad (evita errores si el ID no existe)
function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

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


function iniciarConfiguracion() {
    const t = document.getElementById('config-theme-toggle');
    if(t) t.checked = document.body.classList.contains('dark');
}



function iniciarEducacion() { console.log("Educación..."); }


function setupModalRecarga() {
    const modal = document.getElementById('modal-recarga');
    const btnAbrir = document.getElementById('btn-abrir-recarga');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const inputBS = document.getElementById('input-bs');
    const resUSD = document.getElementById('res-usd');
    const tasa = 45.50; // Valor simulado

    if (!btnAbrir || !modal) return;

    // Abrir
    btnAbrir.onclick = () => {
        modal.style.display = 'flex';
        inputBS.focus();
    };

    // Cerrar
    btnCerrar.onclick = () => {
        modal.style.display = 'none';
        inputBS.value = '';
        resUSD.textContent = '0.00';
    };

    // Cálculo en tiempo real
    inputBS.oninput = () => {
        const montoBS = parseFloat(inputBS.value) || 0;
        resUSD.textContent = (montoBS / tasa).toFixed(2);
    };

    // Confirmación simulada
    document.getElementById('btn-confirmar-pago').onclick = () => {
        if (parseFloat(resUSD.textContent) > 0) {
            alert(`Simulación exitosa: Se han enviado $${resUSD.textContent} a tu cuenta.`);
            btnCerrar.onclick(); // Limpia y cierra
        }
    };
}