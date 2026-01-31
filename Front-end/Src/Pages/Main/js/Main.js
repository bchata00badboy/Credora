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

// --- A. DASHBOARD (INICIO) ---
async function iniciarInicio() {
    console.log("⚡ Init Dashboard...");
    
    // Gráficas
    if (typeof window.renderMainChart === 'function') window.renderMainChart();
    if (typeof window.renderUsageChart === 'function') window.renderUsageChart();

    // Datos API
    if (window.CredoraAPI) {
        try {
            const datos = await window.CredoraAPI.request('/billetera/saldo');
            if (datos) {
                // Textos
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

                // Sidebar
                const sbName = document.querySelector('.sidebar .user-data .name');
                if(sbName) sbName.textContent = datos.titular.split(' ')[0];

                const sbEmail = document.querySelector('.sidebar .user-data .email');
                if(sbEmail) sbEmail.textContent = datos.email;

                // Avatar
                const userImg = document.querySelector('.sidebar .user-img');
                if (userImg) {
                    const iniciales = (datos.titular || "U").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    userImg.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#003049,#005f73);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;border-radius:50%;">${iniciales}</div>`;
                }

                // Gráficas con datos reales
                if (typeof window.actualizarGraficasDesdeAPI === 'function' && datos.historial) {
                    window.actualizarGraficasDesdeAPI(datos.historial);
                }
            }
        } catch(e) { console.error("Error Dashboard:", e); }
    }

    // Eventos UI (Flip Card y Ojo)
    setTimeout(() => {
        const card = document.querySelector('.bank-card');
        if(card) card.onclick = (e) => {
            if(!e.target.closest('.btn-eye')) card.classList.toggle('flip');
        };
        
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
                if(icon) {
                    icon.className = isMasked ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
                }
            });
        }
    }, 100);
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
async function iniciarPerfil() {
    console.log("Perfil...");
    // Inicializar modales y botones específicos de la vista de perfil
    // 1) Manejo genérico de abrir/cerrar modales mediante atributo data-modal
    function openModalById(id){
        const m = document.getElementById(id);
        if(!m) return;
        m.classList.add('active');
        m.setAttribute('aria-hidden','false');
        const card = m.querySelector('.modal-card');
        if(card) card.focus && card.focus();
    }
    function closeModal(el){
        if(!el) return;
        el.classList.remove('active');
        el.setAttribute('aria-hidden','true');
    }

    // Triggers: botones con data-modal
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e)=>{
            e.preventDefault();
            const id = btn.getAttribute('data-modal');
            if(id) openModalById(id);
        });
    });

    // Cerrar modales: botones .modal-close y click fuera del card
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        const closeBtn = overlay.querySelector('.modal-close');
        if(closeBtn) closeBtn.addEventListener('click', ()=> closeModal(overlay));
        overlay.addEventListener('click', (ev)=>{
            if(ev.target === overlay) closeModal(overlay);
        });
    });

    // KYC: navegar a la vista KYC
    const btnKyc = document.getElementById('btn-kyc');
    if(btnKyc) btnKyc.addEventListener('click', (e)=>{ e.preventDefault(); cargarVista('Main_Parts/main_kyc.html'); });
    const btnKycPopover = document.getElementById('btn-kyc-popover');
    if(btnKycPopover) btnKycPopover.addEventListener('click', (e)=>{ e.preventDefault(); cargarVista('Main_Parts/main_kyc.html'); });

    // Manejo de formulario de cambio de contraseña (form-change-pass)
    const formChangePass = document.getElementById('form-change-pass');
    if(formChangePass){
        formChangePass.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const oldPass = formChangePass.querySelector('input[name="old-pass"]').value;
            const newPass = formChangePass.querySelector('input[name="new-pass"]').value;
            const conf = formChangePass.querySelector('input[name="confirm-pass"]').value;
            if(!oldPass || !newPass || !conf){ alert('Completa todos los campos.'); return; }
            if(newPass !== conf){ alert('La nueva contraseña y su confirmación no coinciden.'); return; }

            // Si existe API, enviar petición; si no, simular éxito
            try{
                if(window.CredoraAPI && typeof window.CredoraAPI.request === 'function'){
                    await window.CredoraAPI.request('/usuario/cambiar-password', 'POST', { old_password: oldPass, new_password: newPass });
                } else {
                    console.log('Simulando cambio de contraseña (no hay CredoraAPI).');
                    await new Promise(r=>setTimeout(r,400));
                }
                alert('Contraseña actualizada correctamente.');
                formChangePass.reset();
                const modal = document.getElementById('modal-pass');
                if(modal) closeModal(modal);
            }catch(err){
                console.error('Error cambiar contraseña:', err);
                alert('No se pudo cambiar la contraseña: ' + (err.message||err));
            }
        });
    }

    // Manejo de formulario de cambio de PIN (form-change-pin) — ya prepara hidden inputs en la vista
    const formChangePin = document.getElementById('form-change-pin');
    if(formChangePin){
        formChangePin.addEventListener('submit', async (e)=>{
            // la lógica de validación de 4 dígitos ya existe en la vista; solo enviamos
            e.preventDefault();
            // asegurar que los hidden inputs están llenos
            document.querySelectorAll('.pin-input').forEach(group=>{
                const hidden = group.querySelector('input[type="hidden"]');
                const val = Array.from(group.querySelectorAll('.pin-digit')).map(i=>i.value||'').join('');
                if(hidden) hidden.value = val;
            });

            const oldPin = formChangePin.querySelector('input[name="old-pin"]').value;
            const newPin = formChangePin.querySelector('input[name="new-pin"]').value;
            const confirmPin = formChangePin.querySelector('input[name="confirm-pin"]').value;
            if(newPin.length !== 4 || confirmPin.length !== 4){ alert('El PIN debe tener 4 dígitos.'); return; }
            if(newPin !== confirmPin){ alert('El nuevo PIN y la confirmación no coinciden.'); return; }

            try{
                if(window.CredoraAPI && typeof window.CredoraAPI.request === 'function'){
                    await window.CredoraAPI.request('/usuario/cambiar-pin', 'POST', { old_pin: oldPin, new_pin: newPin });
                } else {
                    await new Promise(r=>setTimeout(r,300));
                }
                alert('PIN actualizado correctamente.');
                formChangePin.reset();
                const modal = document.getElementById('modal-pin');
                if(modal) closeModal(modal);
            }catch(err){
                console.error('Error cambiar PIN:', err);
                alert('No se pudo cambiar el PIN: ' + (err.message||err));
            }
        });
    }

    if(!window.CredoraAPI) {
        // Aún así, intentamos rellenar algunos datos visuales sin la API
        try {
            const datos = await Promise.resolve(null);
            // Si no hay API, no hacemos más
        } catch(e){ console.error(e); }
        return;
    }

    try {
        const datos = await window.CredoraAPI.request('/billetera/saldo');
        if(datos) {
            // 1. Llenar Textos
            if(document.getElementById('profile-name')) document.getElementById('profile-name').textContent = datos.titular;
            if(document.getElementById('profile-email')) document.getElementById('profile-email').textContent = datos.email;
            if(document.getElementById('profile-account')) document.getElementById('profile-account').textContent = datos.numero_cuenta;
            
            // 2. Estado KYC
            const badge = document.querySelector('.status-active');
            if(badge && datos.estado_kyc) {
                badge.textContent = datos.estado_kyc;
                badge.style.color = datos.estado_kyc === 'APROBADO' ? '#00d26a' : 'orange';
            }

            // 3. GENERAR AVATAR CON INICIALES (Esto es lo que faltaba)
            const elAvatar = document.getElementById('profile-avatar');
            if (elAvatar) {
                // Extraer iniciales (Ej: Alejandro Bueno -> AB)
                const iniciales = (datos.titular || "U").split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                
                // Inyectar HTML del círculo
                elAvatar.innerHTML = `
                    <div style="
                        width: 100%; 
                        height: 100%; 
                        background: linear-gradient(135deg, #003049, #005f73); 
                        color: white; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-weight: bold; 
                        font-size: 2.5rem; 
                        border-radius: 50%;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        ${iniciales}
                    </div>
                `;
            }
        }
    } catch(e) { console.error("Error cargando perfil:", e); }
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