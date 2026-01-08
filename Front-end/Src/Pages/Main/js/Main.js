/* =========================================
   1. LOGICA DEL SIDEBAR (Visual)
   ========================================= */
const menuItemsDropDown = document.querySelectorAll('.menu-item-dropdown');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');

// Minimizar sidebar
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('minimize');
});

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


/* =========================================
   DICCIONARIO DE CONTROLADORES
   ========================================= */
const controladores = {
    // Rutas ajustadas para coincidir con los archivos en Main_Parts
    '../Main_Parts/main_home.html': iniciarInicio,
    '../Main_Parts/main_profile.html': iniciarPerfil,
    '../Main_Parts/main_notif.html': iniciarNotificaciones,
    '../Main_Parts/main_transf1.html': iniciarTransferencias,
    '../Main_Parts/main_mov.html': iniciarMovimientos
};

/* =========================================
   3. LOGICA DE NAVEGACIÓN (SPA)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado: inicializando Main.js');
    const menuLinks = document.querySelectorAll('.menu-link, .sub-menu-link');
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) console.error('No se encontró #contenedor-dinamico');

    // Tema: delegado por theme.js (CredoraTheme). Al cargar vistas dinámicas sincronizamos.

    // Función principal de carga
    function cargarVista(rutaArchivo) {
        
        // Efecto visual de carga
        contenedor.style.opacity = '0';

        setTimeout(() => {
            fetch(rutaArchivo)
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error('No se encontró el archivo');
                    return respuesta.text();
                })
                .then(html => {
                    // Parseamos el HTML recibido para extraer <link> y <script>
                    const temp = document.createElement('div');
                    temp.innerHTML = html;

                    // 1) Inyectar hojas de estilo en <head> (si no existen)
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

                    // 2) Insertamos el HTML en el contenedor
                    contenedor.innerHTML = temp.innerHTML;

                    // 3) Re-ejecutar scripts de forma ordenada
                    const scripts = Array.from(contenedor.querySelectorAll('script'));
                    // Eliminamos los <script> insertados (no se ejecutan al setear innerHTML)
                    scripts.forEach(s => s.remove());

                    function runScriptsSequentially(list, i = 0) {
                        if (i >= list.length) {
                            afterScripts();
                            return;
                        }
                        const s = list[i];
                        const newS = document.createElement('script');
                        if (s.src) {
                            newS.src = s.src;
                            newS.onload = () => runScriptsSequentially(list, i + 1);
                            newS.onerror = () => runScriptsSequentially(list, i + 1);
                            document.body.appendChild(newS);
                        } else {
                            try { newS.text = s.textContent; } catch (e) { /* fallback */ }
                            document.body.appendChild(newS);
                            runScriptsSequentially(list, i + 1);
                        }
                    }

                    function afterScripts() {
                        contenedor.style.opacity = '1';
                        // Sincronizar tema en contenido cargado dinámicamente
                        try { if(window.CredoraTheme) window.CredoraTheme.setTheme(document.body.classList.contains('dark'), false); } catch(e) {}

                        // Ejecutar controlador si existe
                        if (controladores[rutaArchivo]) {
                            console.log(`Ejecutando controlador para: ${rutaArchivo}`);
                            controladores[rutaArchivo]();
                        }
                    }

                    // Iniciar la ejecución de scripts
                    runScriptsSequentially(scripts);
                })
                .catch(error => {
                    console.error('Error:', error);
                    contenedor.innerHTML = `<div style="padding:2rem;"><h2>Error 404</h2><p>No pudimos cargar la sección solicitada.</p></div>`;
                    contenedor.style.opacity = '1';
                });
        }, 200);
    }

    // Helper: activar visualmente el item de menú
    function setActiveMenu(linkEl) {
        try {
            document.querySelectorAll('.menu .menu-item').forEach(i => i.classList.remove('active'));
            if (!linkEl) return;
            const item = linkEl.closest('.menu-item');
            if (item) item.classList.add('active');

            // Si el link es sub-menu-link, aseguramos que el dropdown padre esté abierto
            const sub = linkEl.closest('.sub-menu');
            if (sub) {
                const parent = sub.closest('.menu-item-dropdown');
                if (parent) {
                    parent.classList.add('sub-menu-toggle');
                    const sm = parent.querySelector('.sub-menu');
                    if (sm) {
                        sm.style.height = `${sm.scrollHeight + 6}px`;
                        sm.style.padding = '0.2rem 0';
                    }
                }
            }
        } catch (e) { console.error('setActiveMenu error', e); }
    }

    // Helper: activa por ruta (data-vista)
    function setActiveByRoute(ruta) {
        if (!ruta) return;
        const selector = `.menu-link[data-vista="${ruta}"], .sub-menu-link[data-vista="${ruta}"]`;
        const link = document.querySelector(selector);
        if (link) setActiveMenu(link);
    }

    // Eventos Click en el menú
    try {
        if (menuLinks && menuLinks.length) {
            menuLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const ruta = link.getAttribute('data-vista');
                    console.log('Clic en menú, data-vista=', ruta);

                    // Si es un dropdown o no tiene ruta, ignoramos la navegación pero permitimos toggle
                    if (!ruta || ruta === '#') return;

                    e.preventDefault();
                    // Activamos visualmente el item
                    setActiveMenu(link);
                    cargarVista(ruta);
                });
            });
        } else {
            console.warn('No se encontraron enlaces de menú (.menu-link, .sub-menu-link)');
        }
    } catch (err) {
        console.error('Error al asignar eventos de menú:', err);
    }

    // Cargar Inicio por defecto (activo): carga la vista de inicio dentro de `contenedor-dinamico`
    // Si prefieres contenido estático en `Main.html`, comenta esta línea.
    cargarVista('../Main_Parts/main_home.html');
});

/* =========================================
   4. FUNCIONES ESPECÍFICAS (Lógica por pantalla)
   ========================================= */

// --- LÓGICA DE INICIO (Con Carga Perezosa) ---
function iniciarInicio() {
    console.log("Inicio cargado. Esperando interacción...");

    // --- CARGA DINÁMICA: CSS y JS DE LA GRÁFICA ---
        function loadCssOnce(href) {
            if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    }

    function loadScriptOnce(src, cb) {
            if (document.querySelector(`script[src="${src}"]`)) {
            if (cb) cb();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.defer = false;
        s.onload = () => { if (cb) cb(); };
        s.onerror = () => console.error('No se pudo cargar script:', src);
        document.body.appendChild(s);
    }

    // Rutas relativas desde Main.html hacia Front-end/Src/Main/ia/
    const graficaCssPath = '../../Main/ia/grafica.css';
    const graficaJsPath = '../../Main/ia/grafica.js';
    const chartJsCdn = 'https://cdn.jsdelivr.net/npm/chart.js';

    // Inyectamos CSS (si no existe)
    loadCssOnce(graficaCssPath);

    // Aseguramos Chart.js antes de cargar grafica.js
    function ensureGraficaLoaded() {
        try {
            if (typeof renderChart === 'function') {
                // Si las funciones ya están disponibles, inicializamos
                try { renderChart('dia'); } catch(e){}
                try { renderUsageChart(); } catch(e){}
                return;
            }

            // Cargamos grafica.js y luego inicializamos
            loadScriptOnce(graficaJsPath, () => {
                try { if (typeof renderChart === 'function') renderChart('dia'); } catch(e){}
                try { if (typeof renderUsageChart === 'function') renderUsageChart(); } catch(e){}
            });
        } catch (e) { console.error(e); }
    }

    if (typeof Chart === 'undefined') {
        loadScriptOnce(chartJsCdn, ensureGraficaLoaded);
    } else {
        ensureGraficaLoaded();
    }

    // === LÓGICA TARJETA FLIP (NUEVA, robusta) ===
    // Buscamos la tarjeta dentro del contenedor visual para asegurarnos de seleccionar la correcta
    const flipCard = document.querySelector('.tarjeta-visual-container .bank-card');
    if (flipCard) {
        // click normal
        flipCard.addEventListener('click', function (e) {
            this.classList.toggle('flip');
            console.log('Tarjeta flip toggled:', this.classList.contains('flip'));
        });
        // soporte táctil para móviles (touchend evita doble activación en algunos navegadores)
        flipCard.addEventListener('touchend', function (e) {
            this.classList.toggle('flip');
            e.preventDefault();
        });

        // Botón explícito para voltear la tarjeta (útil en móviles)
        const flipBtn = document.getElementById('btn-voltear-tarjeta');
        if (flipBtn) {
            flipBtn.addEventListener('click', function(e) {
                e.preventDefault();
                flipCard.classList.toggle('flip');
                console.log('Flip button clicked.');
            });
            flipBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                flipCard.classList.toggle('flip');
            });
        }
    } else {
        console.log('No se encontró .tarjeta-visual-container .bank-card para el flip');
    }

    const btnRiesgo = document.getElementById('btn-simular-riesgo');
    const btnConsejo = document.getElementById('btn-simular-consejo');

    // --- FUNCIÓN AUXILIAR PARA CARGAR MICRO-ARCHIVOS ---
    // idElemento: El ID del div principal del archivo (ej: 'modal-riesgo')
    // rutaArchivo: Dónde está el HTML
    async function cargarComponente(idElemento, rutaArchivo) {
        
        // 1. Verificamos si ya existe en el DOM (para no cargarlo 2 veces)
        let elemento = document.getElementById(idElemento);
        
        if (!elemento) {
            console.log(`Descargando componente: ${rutaArchivo}...`);
            try {
                const respuesta = await fetch(rutaArchivo);
                if(!respuesta.ok) throw new Error("Error cargando componente");
                
                const html = await respuesta.text();
                
                // 2. Lo inyectamos al final del body (fuera del contenedor dinámico para evitar conflictos de z-index)
                document.body.insertAdjacentHTML('beforeend', html);
                
                // 3. Actualizamos la referencia
                elemento = document.getElementById(idElemento);
                
                // 4. Activamos sus botones de cerrar (Solo la primera vez que se carga)
                activarListenersComponente(idElemento);
                
            } catch (error) {
                console.error(error);
                return null;
            }
        } else {
            console.log("El componente ya estaba en memoria.");
        }
        return elemento;
    }

    // --- MANEJADORES DE CLIC ---

    // A) BOTÓN RIESGO
    if (btnRiesgo) {
        btnRiesgo.addEventListener('click', async () => {
            // Llamamos a la carga bajo demanda
            const modal = await cargarComponente('modal-riesgo', '../../../pop_ups/index_tips.html');
            
            if (modal) {
                modal.classList.remove('hidden'); // Mostrar
            }
        });
    }

    // B) BOTÓN CONSEJO
    if (btnConsejo) {
        btnConsejo.addEventListener('click', async () => {
            const toast = await cargarComponente('toast-consejo', '../../../pop_ups/index_tips.html');
            
            if (toast) {
                toast.classList.remove('hidden');
                setTimeout(() => {
                    if(document.body.contains(toast)) toast.classList.add('hidden');
                }, 5000);
            }
        });
    }
}

//Función extra para dar vida a los botones de "Cerrar" de los elementos inyectados
function activarListenersComponente(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) return;

    // === LÓGICA PARA EL MODAL DE RIESGO ===
    if (idElemento === 'modal-riesgo') {
        
        // A. Buscamos el botón "Ignorar" por su clase
        const btnCerrar = elemento.querySelector('.btn-cerrar-modal');
        
        // B. Le damos la orden de cerrar
        if (btnCerrar) {
            btnCerrar.addEventListener('click', () => {
                console.log("Cerrando modal...");
                elemento.classList.add('hidden'); // Vuelve a ocultarlo
            });
        }

        // C. (Extra) Cerrar si hacen clic en el fondo oscuro (overlay)
        elemento.addEventListener('click', (e) => {
            // Si el clic fue directo en el fondo oscuro y no en la tarjeta blanca
            if (e.target === elemento) {
                elemento.classList.add('hidden');
            }
        });
    }

    // Lógica específica para el TOAST
    if (idElemento === 'toast-consejo') {
        const btnCerrar = elemento.querySelector('.toast-close');
        if (btnCerrar) btnCerrar.addEventListener('click', () => elemento.classList.add('hidden'));
    }

    
}
// --- LÓGICA DE PERFIL (Formularios) ---
function iniciarPerfil() {
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Contraseña actualizada correctamente!');
            formPassword.reset();
        });
    }
}

// --- LÓGICA DE NOTIFICACIONES ---
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

// --- STUB: Transferencias ---
function iniciarTransferencias() {
    console.log('Vista Transferencias cargada');
    // Inicializaciones específicas de transferencia pueden añadirse aquí
}

// --- STUB: Movimientos ---
function iniciarMovimientos() {
    console.log('Vista Movimientos cargada');
    // Inicializaciones específicas de movimientos pueden añadirse aquí
}

