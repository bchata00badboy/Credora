// Lógica del tutorial integrada al Dashboard - VERSIÓN FINAL (Orden Correcto)
function initTutorialModule() {

  // CONFIGURACIÓN VISUAL
  const AVATAR_SIZE = 250; 
  const BOTTOM_POSITION = '20px';
  const RIGHT_POSITION = '20px';

  function waitForSelector(selector, timeout = 6000) {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const el = document.querySelector(selector);
        if (el && (el.offsetWidth > 0 || el.offsetHeight > 0)) return resolve(el);
        if (Date.now() - start > timeout) return resolve(el || null);
        requestAnimationFrame(check);
      };
      check();
    });
  }

  function createTourElements() {
    const Z_INDEX_CONTAINER = '999999';

    const container = document.createElement('div');
    container.className = 'tutorial-container';
    container.id = 'tutorial-fixed-container';

    // ESTILOS FIJOS
    container.style.position = 'fixed';
    container.style.bottom = BOTTOM_POSITION;
    container.style.right = RIGHT_POSITION;
    container.style.zIndex = Z_INDEX_CONTAINER;
    container.style.display = 'flex';
    container.style.flexDirection = 'column-reverse'; 
    container.style.alignItems = 'center'; 
    container.style.pointerEvents = 'none'; 
    container.style.filter = 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))';
    container.style.transition = 'opacity 0.5s ease';

    // 1. Burbuja de texto
    const bubble = document.createElement('div');
    bubble.style.pointerEvents = 'auto';
    bubble.style.position = 'relative';
    bubble.style.background = '#ffffff';
    bubble.style.color = '#1e293b';
    bubble.style.padding = '20px 24px';
    bubble.style.borderRadius = '16px';
    bubble.style.width = '350px'; 
    bubble.style.marginBottom = '10px';
    bubble.style.border = '1px solid rgba(0,0,0,0.05)';
    bubble.innerHTML = `
      <button id="tutorial-exit" style="position:absolute; top:12px; right:12px; border:none; background:transparent; font-size:24px; cursor:pointer; color:#94a3b8; transition: color 0.2s;">&times;</button>
      <span class="tutorial-title" style="display:block; font-weight:700; margin-bottom:8px; font-size:18px; color:#0f172a;">Guía Rápida</span>
      <div id="tutorial-text" style="font-size:15px; line-height:1.6; color:#475569;"></div>
      <div style="text-align:right; margin-top:20px;">
        <button id="tutorial-next" style="background: #2563eb; color:#fff; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); transition: all 0.2s;">
          Siguiente
        </button>
      </div>
    `;

    // 2. Triángulo
    const triangle = document.createElement('div');
    triangle.style.width = '0';
    triangle.style.height = '0';
    triangle.style.borderLeft = '12px solid transparent';
    triangle.style.borderRight = '12px solid transparent';
    triangle.style.borderTop = '14px solid #ffffff'; 
    triangle.style.marginBottom = '-5px'; 
    triangle.style.zIndex = '2';

    // 3. Avatar
    const avatar = document.createElement('img');
    avatar.className = 'tutorial-avatar';
    avatar.src = '../../Assets/Images/image.png'; 
    avatar.alt = 'Avatar';
    avatar.style.width = `${AVATAR_SIZE}px`;
    avatar.style.height = `${AVATAR_SIZE}px`;
    avatar.style.objectFit = 'contain';
    avatar.style.pointerEvents = 'auto'; 

    avatar.onerror = function() { this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/4712/4712035.png'; };

    container.appendChild(avatar);   
    container.appendChild(triangle); 
    container.appendChild(bubble);   

    document.body.appendChild(container);

    return { container, bubble, textElem: bubble.querySelector('#tutorial-text'), nextBtn: bubble.querySelector('#tutorial-next'), exitBtn: bubble.querySelector('#tutorial-exit') };
  }

  function cleanupOverlay(container) {
    if (!container) return;
    container.style.opacity = '0';
    setTimeout(() => { if (container && container.parentNode) container.parentNode.removeChild(container); }, 500);
  }

  async function startTourIfNeeded(opts = { force: false }) {
    const already = localStorage.getItem('credora_tutorial_shown');
    if (already && !opts.force) return;
    
    const homePresent = await waitForSelector('#contenedor-dinamico', 8000);
    if (!homePresent && typeof window.cargarVista === 'function') {
        try { await window.cargarVista('Main_Parts/main_home.html'); await new Promise(r => setTimeout(r, 400)); } catch (e) {}
    }

    // --- LISTA DE PASOS ORDENADA ---
    const steps = [
      // 1. INICIO - Saludo y Saldo
      { 
        text: '¡Hola! Bienvenido a <b>Credora</b>. Empecemos en el <b>Inicio</b>. Aquí arriba puedes ver tu saldo disponible.',
        route: 'Main_Parts/main_home.html',
        scrollTo: '#balance-card'
      },

      // 2. INICIO - Recarga (Baja la pantalla)
      { 
        text: 'Más abajo tienes los botones para realizar una <b>Recarga</b> de saldo rápidamente.', 
        route: 'Main_Parts/main_home.html',
        scrollTo: '#btn-abrir-recarga' // Hace scroll hacia el botón de recarga
      },

      // 3. MOVIMIENTOS (Sección Nueva)
      { 
        text: 'En la sección <b>Movimientos</b> puedes consultar todo tu historial de transacciones detallado.', 
        route: 'Main_Parts/main_mov.html', // VERIFICA EL NOMBRE DE ESTE ARCHIVO
        scrollTo: 'h1' 
      },

      // 4. METAS FINANCIERAS
      { 
        text: 'En <b>Metas Financieras</b> define tus objetivos de ahorro y cúmplelos paso a paso.', 
        route: 'Main_Parts/main_ahorro.html',
        scrollTo: 'h1'
      },
      
      // 5. TRANSFERENCIAS
      { 
        text: 'Usa <b>Transferencias</b> para enviar dinero a otros usuarios de forma segura.', 
        route: 'Main_Parts/main_transf1.html',
        scrollTo: '.form-transfer'
      },
      
      // 6. EDUCACIÓN
      { 
        text: 'En <b>Educación</b> encontrarás consejos útiles para mejorar tu salud financiera.', 
        route: 'Main_Parts/main_educ.html',
        scrollTo: 'h1'
      },

      // 7. CONFIGURACIÓN
      { 
        text: 'En <b>Configuración</b> puedes ajustar tus preferencias y opciones de seguridad.', 
        route: 'Main_Parts/main_config.html',
        scrollTo: 'h1'
      },

      // 8. PERFIL
      { 
        text: 'Finalmente, tu <b>Perfil</b>. Mantén tus datos siempre actualizados.', 
        route: 'Main_Parts/main_profile.html',
        scrollTo: '#profile-form'
      },

      // CIERRE
      { 
        text: '¡Listo! Ya conoces todas las secciones. ¡Éxito con Credora!',
        scrollTo: 'body'
      }
    ];

    const ui = createTourElements();
    let current = 0;

    async function endTour() {
        cleanupOverlay(ui.container);
        localStorage.setItem('credora_tutorial_shown', '1');
        if (typeof window.cargarVista === 'function') {
            try { await window.cargarVista('Main_Parts/main_home.html'); } catch(e) { }
        }
    }

    async function showStep(i) {
      const step = steps[i];
      ui.textElem.style.opacity = '0';
      
      // Cargar Vista
      if (step.route && typeof window.cargarVista === 'function') {
        try { window.cargarVista(step.route); } catch(e) { }
      }

      setTimeout(() => {
        ui.textElem.innerHTML = step.text;
        ui.textElem.style.opacity = '1';
        ui.textElem.style.transition = 'opacity 0.3s';

        // Lógica de Scroll (El avatar NO se mueve)
        if (step.scrollTo) {
            const el = document.querySelector(step.scrollTo);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
      }, 500); 

      // Texto de botones
      if (i === steps.length - 1) {
          ui.nextBtn.innerText = 'Finalizar';
          ui.nextBtn.style.background = '#10b981'; 
      } else {
          ui.nextBtn.innerText = 'Siguiente';
          ui.nextBtn.style.background = '#2563eb'; 
      }
    }

    ui.nextBtn.addEventListener('click', async () => {
      if (current === steps.length - 1) {
          await endTour();
          return;
      }
      ui.nextBtn.style.transform = 'scale(0.95)';
      setTimeout(() => ui.nextBtn.style.transform = 'scale(1)', 150);
      current++;
      await showStep(current);
    });

    if (ui.exitBtn) {
      ui.exitBtn.addEventListener('click', () => { endTour(); });
    }

    showStep(0);
    window.addEventListener('beforeunload', () => { try { ui.container && ui.container.remove(); } catch(e){} });
  }

  try { startTourIfNeeded(); } catch(e) { console.error('Error iniciando tutorial:', e); }
  window.startCredoraTour = startTourIfNeeded;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTutorialModule);
} else {
  initTutorialModule();
}