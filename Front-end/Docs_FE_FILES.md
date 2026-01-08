Documentación breve — Front-end (Archivos principales)

Objetivo: documentación concisa para HTML, CSS y JS modificados recientemente. Mantenerla corta y práctica.

1) Front-end/Src/Pages/Main/Main.html
- Tipo: HTML (entrada principal del panel de usuario).
- Propósito: Estructura SPA principal: sidebar, contenedor `#contenedor-dinamico`, y panel IA (chatbot flotante).
- Puntos clave:
  - `#sidebar`: menú lateral. Los enlaces usan `data-vista` para carga dinámica.
  - `#contenedor-dinamico`: donde `Main.js` inyecta vistas (Main_Parts).
  - Chatbot: requiere `ia/ia.css` y `ia/ia.js`, usa clases `chatbot-toggler`, `chatbot-interface`.
  - Iconos del chatbot usan Font Awesome (añadido CDN en `<head>`).
- Cambios importantes: rutas a `ia/ia.css` y `ia/ia.js` corregidas; fontawesome añadido.

2) Front-end/Src/Pages/Main/Main.css
- Tipo: CSS (estilos globales y del layout del Main).
- Propósito: estilos de sidebar, main-content, tarjetas, modal, y estilos integrados para el chatbot y toast.
- Puntos clave:
  - Variables `:root` para colores y modos (light/dark).
  - `.sidebar`, `.menu-link`, `.main-content` definen comportamiento SPA.
  - `.bank-card`, `.tarjeta-visual-container` y `.dashboard-grid` para el área de saldo/tarjeta.
  - Z-indexes: `modal-overlay` (1000), `toast-card` (999) y `chatbot-interface` en `ia.css` (9998) — mantener consistencia para superposición.
- Recomendación: si algo queda oculto, revisar `z-index` relativo entre `Main.css` y `ia/ia.css`.

3) Front-end/Src/Pages/Main/Main.js
- Tipo: JavaScript (control SPA + UI interactions).
- Propósito: manejar sidebar, navegación SPA (fetch de `Main_Parts`), iniciar vistas (iniciarInicio, iniciarPerfil...), cargar componentes auxiliares (modal, toast), y lógica de flip de tarjeta.
- Funciones clave:
  - `cargarVista(rutaArchivo)`: fetch y render en `#contenedor-dinamico`, luego ejecuta controlador desde `controladores`.
  - `controladores` (map): mapea rutas a funciones `iniciarInicio`, `iniciarPerfil`, etc.
  - `iniciarInicio()`: registra listeners para panel IA (carga perezosa), y flip de tarjeta.
  - Mejora: ahora marca visualmente el `menu-item` activo y sincroniza tema con `CredoraTheme.setTheme(...)`.
- Nota: revisar consola para logs añadidos (`DOM cargado`, `Clic en menú, data-vista=`, etc.)

4) Front-end/Src/Pages/Main/theme.js
- Tipo: JavaScript (gestión del tema claro/oscuro).
- Propósito: aplicar tema, animación de transición y persistencia en `localStorage` (`credora-theme`).
- API expuesta: `window.CredoraTheme.init()` y `CredoraTheme.setTheme(dark, animate)`.
- Cambios clave: `setThemeSilent` actualiza cualquier `input.theme-switch` y `#theme-toggle` para mantener interruptores sincronizados.

5) Front-end/Src/Pages/Main_Parts/main_home.html
- Tipo: HTML parcial (vista `Inicio`).
- Propósito: contiene `dashboard-grid` con `.saldo-card` y `.tarjeta-visual-container` (tarjeta flip).
- Puntos clave: la tarjeta usa `.bank-card .card-inner .card-front/.card-back` para flip; `tarjeta-visual-container .bank-card` es el objetivo del click.

6) Front-end/Src/Pages/Main_Parts/main_config.html
- Tipo: HTML parcial (vista `Configuración`).
- Propósito: contiene `input` con clase `theme-switch` (id `config-theme-toggle`) para el modo oscuro.
- Puntos clave: `theme.js` sincroniza este checkbox con el estado guardado.

7) Front-end/Src/Pages/Main/ia/ia.css
- Tipo: CSS (estilos del chatbot flotante).
- Propósito: estilos del botón flotante, ventana chatbot, mensajes, chips y textarea.
- Puntos clave: usa `body.show-chatbot` para alternar visibilidad y `z-index: 9998`.
- Recomendación: si el chatbot queda por detrás de modales, ajustar `z-index` (ej. >1000).

8) Front-end/Src/Pages/Main/ia/ia.js
- Tipo: JavaScript (lógica del chatbot local).
- Propósito: controlar apertura/cierre del chatbot, enviar/mostrar mensajes, y pequeñas respuestas automatizadas.
- Funciones clave: `toggleChatbot(forceOpen)`, `enviarMensajeIA()`, `preguntarIA(texto)`, `generateResponse()`.
- Nota: el archivo usa `document.querySelector` al cargar; asegurar que `ia.css` y `ia.js` estén correctamente referenciados (ya corregido en Main.html).

Pruebas rápidas recomendadas
- Abrir la página principal y:
  - 1) Pulsar el botón flotante del chatbot (no debe haber 404 en consola).
  - 2) Enviar mensaje y ver respuesta simulada.
  - 3) Cambiar tema en Configuración y navegar; el interruptor debe mantener estado.
  - 4) Navegar por el menú lateral y verificar que el item activo cambia (ver consola para `data-vista`).

Si quieres, puedo:
- Generar documentación en otro formato (README, MD por carpeta).
- Añadir comentarios inline en cada archivo (mínimos).
- Aumentar `z-index` del chatbot o del modal si persiste un conflicto visual.

Fin de documentación breve.
