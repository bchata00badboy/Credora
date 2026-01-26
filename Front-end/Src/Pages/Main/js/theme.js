// /Front-end/Src/Pages/Main/js/theme.js


/* theme.js - Transición Rápida y del Mismo Color (Soporta Degradados) */
(function(){
    const STORAGE_KEY = 'credora-theme';

    // --- CONFIGURACIÓN DE PERSONALIZACIÓN ---
    const VELOCIDAD = 0.25; // Segundos (Muy rápido)

    // ¡IMPORTANTE! Copia aquí el valor EXACTO de tu CSS.
    // Si usas degradados (linear-gradient), pégalos completos aquí.
    const FONDO_OSCURO = '#071022'; 
    const FONDO_CLARO  = '#ffffff'; // Si tu fondo claro es un degradado, pega aquí: 'linear-gradient(...)'

    // --- 1. Lógica Base ---
    function setThemeSilent(dark){
        if(dark) document.body.classList.add('dark');
        else document.body.classList.remove('dark');

        const toggle = document.getElementById('theme-toggle');
        if(toggle && toggle.type === 'checkbox') toggle.checked = !!dark;

        try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch(e) {}

        const root = document.documentElement;
        if(dark){
             root.style.setProperty('--color-bg', getComputedStyle(root).getPropertyValue('--color-bg-dark') || FONDO_OSCURO);
        } else {
             root.style.setProperty('--color-bg', getComputedStyle(root).getPropertyValue('--color-bg-light') || FONDO_CLARO);
        }
        
        let meta = document.querySelector('meta[name="theme-color"]');
        if(!meta){ meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        meta.content = dark ? '#071022' : '#ffffff';
    }

    // --- 2. La Animación Visual ---
    function animateThemeSwitch(dark){
        if(document.getElementById('theme-overlay')) return;

        const root = document.documentElement;
        
        // Determinar qué fondo usar para la transición
        // Intentamos leer la variable CSS primero, si no, usamos la configuración de arriba
        let bgParaTransicion;
        
        if(dark) {
            // Vamos hacia OSCURO
            const cssVar = getComputedStyle(root).getPropertyValue('--color-bg-dark').trim();
            bgParaTransicion = cssVar || FONDO_OSCURO;
        } else {
            // Vamos hacia CLARO
            const cssVar = getComputedStyle(root).getPropertyValue('--color-bg-light').trim();
            bgParaTransicion = cssVar || FONDO_CLARO;
        }

        // Crear el telón (Overlay)
        const overlay = document.createElement('div');
        overlay.id = 'theme-overlay';
        
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '99999',
            // Usamos 'background' en lugar de 'backgroundColor' para soportar degradados
            background: bgParaTransicion, 
            opacity: '0',
            transition: `opacity ${VELOCIDAD}s ease-in-out`,
            pointerEvents: 'none'
        });

        document.body.appendChild(overlay);
        void overlay.offsetWidth; // Forzar render

        // --- FASE 1: Aparecer (Tapando la pantalla con el nuevo color) ---
        overlay.style.opacity = '1';

        setTimeout(() => {
            
            // --- FASE 2: Cambiar el tema real detrás ---
            setThemeSilent(dark);

            requestAnimationFrame(() => {
                // --- FASE 3: Desaparecer (Revelando la nueva interfaz) ---
                overlay.style.opacity = '0';
                
                setTimeout(() => {
                    if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, VELOCIDAD * 1000);
            });

        }, VELOCIDAD * 1000); 
    }

    // --- 3. Inicialización ---
    function init(){
        const saved = localStorage.getItem(STORAGE_KEY);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const startDark = saved ? saved === 'dark' : prefersDark;

        setThemeSilent(startDark);

        document.addEventListener('change', (e) => {
            const target = e.target;
            if (target.id === 'theme-toggle' || target.classList.contains('theme-switch')) {
                animateThemeSwitch(target.checked);
            }
        });
    }

    window.CredoraTheme = { 
        init, 
        setTheme: (dark, animate = false) => {
            if(animate) animateThemeSwitch(dark);
            else setThemeSilent(dark);
        }
    };

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();