/* =========================================
   Logica para manejar el sidebar 
   ========================================= */
const menuItemsDropDown = document.querySelectorAll('.menu-item-dropdown');
const menuItemsStatic = document.querySelectorAll('.menu-item-static');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');

// Minimizar sidebar
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('minimize');
});

// Lógica de menús desplegables
menuItemsDropDown.forEach((menuItem) => {
    menuItem.addEventListener('click', (e) => {
        // Si sidebar está minimizado, no expandir acordeón
        if (sidebar.classList.contains('minimize')) return;

        const subMenu = menuItem.querySelector('.sub-menu');
        const isActive = menuItem.classList.toggle('sub-menu-toggle');
        
        if (subMenu) {
            if (isActive) {
                subMenu.style.height = `${subMenu.scrollHeight + 6}px`;
                subMenu.style.padding = '0.2rem 0';
            } else {
                subMenu.style.height = '0';
                subMenu.style.padding = '0';
            }
        }
        
        // Cerrar otros menús hermanos
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
    Logica para Navegar de forma dinamica
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    const menuLinks = document.querySelectorAll('.menu-link, .sub-menu-link');
    const contenedor = document.getElementById('contenedor-dinamico');

    // Función para cargar archivos HTML externos
    function cargarVista(rutaArchivo) {
        
        // 1. Efecto visual de carga (opcional pero recomendado)
        contenedor.style.opacity = '0';

        setTimeout(() => {
            // 2. Pedimos el archivo al servidor
            fetch(rutaArchivo)
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error('No se encontró el archivo');
                    return respuesta.text();
                })
                .then(html => {
                    // 3. Insertamos el HTML dentro del main
                    contenedor.innerHTML = html;
                    
                    // 4. Restauramos la opacidad con animación
                    contenedor.style.opacity = '1';
                    
                    // IMPORTANTE: Si la vista cargada tiene formularios (como perfil),
                    // hay que reconectar sus scripts aquí.
                    reconectarScripts();
                })
                .catch(error => {
                    console.error('Error:', error);
                    contenedor.innerHTML = `<h2>Error 404: No se encontró la sección</h2>`;
                    contenedor.style.opacity = '1';
                });
        }, 200); // Pequeña pausa para la transición
    }

    // Eventos Click
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Leemos la ruta del atributo data-vista
            const ruta = link.getAttribute('data-vista');

            // Si no tiene ruta (es un dropdown), no hacemos nada
            if (!ruta) return;

            e.preventDefault();
            cargarVista(ruta);
        });
    });

    // Cargar Inicio por defecto
    cargarVista('../Main_Parts/main_home.html');
});

// Función auxiliar para que funcionen los botones dentro de las vistas cargadas
function reconectarScripts() {
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Contraseña actualizada! (Desde archivo externo)');
            formPassword.reset();
        });
    }
}

/*
================================

Logica del apartado de notificaciones

================================
*/
