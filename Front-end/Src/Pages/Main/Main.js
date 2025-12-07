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
    // ✅ AGREGA ../ AL INICIO DE CADA RUTA
    '../Main_Parts/main_home.html': iniciarInicio,
    '../Main_Parts/main_profile.html': iniciarPerfil,
    '../Main_Parts/notificaciones.html': iniciarNotificaciones,
    '../Main_Parts/transferir.html': iniciarTransferencias,
    '../Main_Parts/movimientos.html': iniciarMovimientos
};

/* =========================================
   3. LOGICA DE NAVEGACIÓN (SPA)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    const menuLinks = document.querySelectorAll('.menu-link, .sub-menu-link');
    const contenedor = document.getElementById('contenedor-dinamico');

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
                    // A. Insertamos el HTML
                    contenedor.innerHTML = html;
                    contenedor.style.opacity = '1';
                    
                    // B. LÓGICA INTELIGENTE:
                    // Verificamos si existe un controlador para esta ruta en el diccionario
                    if (controladores[rutaArchivo]) {
                        console.log(`Ejecutando controlador para: ${rutaArchivo}`);
                        controladores[rutaArchivo](); // <--- AQUÍ OCURRE LA MAGIA
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    contenedor.innerHTML = `<div style="padding:2rem;"><h2>Error 404</h2><p>No pudimos cargar la sección solicitada.</p></div>`;
                    contenedor.style.opacity = '1';
                });
        }, 200);
    }

    // Eventos Click en el menú
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const ruta = link.getAttribute('data-vista');

            // Si es un dropdown o no tiene ruta, ignoramos
            if (!ruta || ruta === '#') return;

            e.preventDefault();
            cargarVista(ruta);
        });
    });

    // Cargar Inicio por defecto (Si no usas renderizado inicial en HTML)
    // Asegúrate de que la ruta coincida con la del diccionario (sin ../ si estás en la raíz)
    cargarVista('../Main_Parts/main_home.html');
});

/* =========================================
   4. FUNCIONES ESPECÍFICAS (Lógica por pantalla)
   ========================================= */

// --- LÓGICA DE INICIO (Con Carga Perezosa) ---
function iniciarInicio() {
    console.log("Inicio cargado. Esperando interacción...");

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

// --- LÓGICA DE TRANSFERENCIAS (Opcional) ---
function iniciarTransferencias() {
    // Aquí podrías agregar validaciones de monto, selección de banco, etc.
    console.log("Módulo de transferencias listo.");
}

// --- LÓGICA DE MOVIMIENTOS (Opcional) ---
function iniciarMovimientos() {
    // Aquí iría la lógica de filtros de tabla
    console.log("Módulo de movimientos listo.");
}