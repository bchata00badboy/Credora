/* Guard para evitar doble carga en páginas SPA */
if (window.__graficaLoaded) {
    console.log('Script gráfica ya cargado: omitiendo reinicialización');
} else {
    window.__graficaLoaded = true;

    // 1. Base de Datos Simulada
    const walletData = {
        dia: {
            labels: ["08:00", "12:00", "16:00", "20:00", "00:00"],
            data: [120, 150, 180, 220, 260],
            total: "$260.00"
        },
        mes: {
            labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
            data: [1500, 2100, 1800, 2900],
            total: "$2,900.00"
        },
        anio: {
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            data: [4500, 5200, 4800, 6100, 7500, 8200, 7800, 9500, 11000, 10500, 12800, 15400],
            total: "$15,400.00"
        }
    };

    // 2. Variables de Estado
    let myChart = null;           
    let usageChartInstance = null; 
    let periodoActual = 'dia'; 

    const colorOptions = ['#003049', '#00d26a', '#f7b731', '#8854d0', '#eb3b5a'];
    let colorIndex = 0; 
    let currentColor = colorOptions[0];

    // 3. Función Principal: Gráfica de Balance (Izquierda)
    function renderChart(periodo) {
        const canvas = document.getElementById('credoraChart');
        if (!canvas) return; 

        const ctx = canvas.getContext('2d');

        // Si la instancia existe pero está ligada a un canvas distinto (DOM fue reemplazado),
        // desapuntamos la referencia para forzar recreación sobre el nuevo canvas.
        if (myChart && myChart.canvas !== canvas) {
            myChart = null; // No llamamos a destroy() por petición del usuario
        }
        const selectedData = walletData[periodo];

        // Determinar color efectivo (mejor contraste en modo oscuro)
        const effectiveColor = ensureContrastColor(currentColor);

        // Crear degradado dinámico basado en el color efectivo
        let gradient = ctx.createLinearGradient(0, 0, 0, 300); 
        gradient.addColorStop(0, hexToRgba(effectiveColor, 0.5)); 
        gradient.addColorStop(1, hexToRgba(effectiveColor, 0.0)); 

        if (myChart) {
            // --- ANIMACIÓN DE ACTUALIZACIÓN ---
            // En lugar de borrar la gráfica, actualizamos sus propiedades.
            // Chart.js animará automáticamente la transición (morphing).
            
            myChart.data.labels = selectedData.labels;
            myChart.data.datasets[0].data = selectedData.data;
            
            // Actualizamos colores
            myChart.data.datasets[0].borderColor = currentColor;
            myChart.data.datasets[0].pointBorderColor = currentColor;
            myChart.data.datasets[0].backgroundColor = gradient;
            
            myChart.update(); // Dispara la animación
        } else {
            // --- CREACIÓN INICIAL ---
            myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: selectedData.labels,
                    datasets: [{
                        data: selectedData.data,
                        borderColor: effectiveColor,
                        backgroundColor: gradient,
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: effectiveColor,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        fill: true,
                        tension: 0.4 
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { 
                            enabled: true, intersect: false, mode: 'index', displayColors: false,
                            callbacks: { label: (c) => '$ ' + c.parsed.y }
                        } 
                    },
                    scales: { y: { display: false }, x: { display: false } },
                    animation: { duration: 1000, easing: 'easeOutQuart' } // 1 segundo de animación suave
                }
            });
        }

        // Animación de texto (Fade Out -> Cambio -> Fade In)
        const textoDinero = document.getElementById('totalDisplay');
        if (textoDinero) {
            textoDinero.style.transition = "opacity 0.2s ease";
            textoDinero.style.opacity = 0; // Desvanecer
            setTimeout(() => {
                textoDinero.innerText = selectedData.total;
                textoDinero.style.opacity = 1; // Aparecer
            }, 200);
        }
    }

    // 4. Función Secundaria: Gráfica de Dona (Derecha)
    function renderUsageChart() {
        const ctxUsage = document.getElementById('usageChart');
        if (!ctxUsage) return;

        // Si la instancia existe pero está ligada a un canvas distinto, la desapuntamos
        // para permitir su recreación en el nuevo canvas. No llamamos a .destroy().
        if (usageChartInstance && usageChartInstance.canvas !== ctxUsage) {
            usageChartInstance = null;
        }

        if (usageChartInstance) {
            usageChartInstance.update();
            return;
        }

        const dataValues = [45, 30, 25];
        const dataLabels = ['Servicios', 'Comida', 'Ocio'];

        // Palette base
        const baseColors = ['#00d26a', '#003049', '#f7b731'];
        const palette = document.body.classList.contains('dark') ? baseColors.map(c => ensureContrastColor(c)) : baseColors;

        usageChartInstance = new Chart(ctxUsage, {
            type: 'doughnut',
            data: {
                labels: dataLabels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: palette,
                    borderWidth: 0, 
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c2a3a', bodyColor: '#fff',
                        callbacks: { label: (c) => ' ' + c.label + ': ' + c.parsed + '%' }
                    }
                },
                animation: { animateScale: true, animateRotate: true }
            }
        });

        // Actualizar texto central dona
        try {
            const total = dataValues.reduce((a,b) => a + b, 0);
            let maxIndex = 0;
            dataValues.forEach((v,i) => { if (v > dataValues[maxIndex]) maxIndex = i; });
            const percent = Math.round((dataValues[maxIndex] / total) * 100);
            const label = dataLabels[maxIndex];

            const centerTextBig = document.querySelector('.donut-center-text .big-percent');
            const centerTextSmall = document.querySelector('.donut-center-text .small-label');
            if (centerTextBig) centerTextBig.innerText = percent + '%';
            if (centerTextSmall) centerTextSmall.innerText = label;
        } catch (e) { console.warn('Error texto dona', e); }
    }

    // 5. Interacciones Globales

    // Cambiar periodo
    function cambiarPeriodo(nuevoPeriodo, btn) {
        periodoActual = nuevoPeriodo;
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderChart(periodoActual);
    }

    // Cambiar color
    function cambiarColorGrafica() {
        colorIndex = (colorIndex + 1) % colorOptions.length;
        currentColor = colorOptions[colorIndex];
        
        // Actualiza el CSS (para los botones)
        document.documentElement.style.setProperty('--chart-primary', currentColor);
        
        // Actualiza la gráfica (dispara la animación de color)
        renderChart(periodoActual);
    }

    // 6. Utilidades e Inicialización

    function hexToRgba(hex, alpha) {
        let c = hex.substring(1).split('');
        if(c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }

    // Devuelve un color con suficiente contraste si el documento está en modo oscuro
    function ensureContrastColor(hex) {
        try {
            const useDarkMode = document.body.classList.contains('dark');
            if (!useDarkMode) return hex;
            // Convert hex to RGB
            const rgb = hexToRgb(hex);
            if (!rgb) return hex;
            const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
            // Si ya es claro, devolver tal cual; si es oscuro, mezclar con blanco
            if (lum > 0.5) return hex;
            return lightenHex(hex, 0.6);
        } catch (e) { return hex; }
    }

    function hexToRgb(hex) {
        if (!hex) return null;
        const h = hex.replace('#','');
        const bigint = parseInt(h.length===3 ? h.split('').map(ch=>ch+ch).join('') : h, 16);
        return { r: (bigint>>16)&255, g: (bigint>>8)&255, b: bigint&255 };
    }

    function relativeLuminance(r,g,b) {
        // sRGB -> linear
        const srgb = [r,g,b].map(v => {
            v = v/255;
            return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
        });
        return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
    }

    function lightenHex(hex, amount) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const r = Math.round(rgb.r + (255 - rgb.r) * amount);
        const g = Math.round(rgb.g + (255 - rgb.g) * amount);
        const b = Math.round(rgb.b + (255 - rgb.b) * amount);
        return rgbToHex(r,g,b);
    }

    function rgbToHex(r,g,b) {
        return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
    }

    function ensureChartAvailable(callback, attempts = 0) {
        if (typeof Chart !== 'undefined') { callback(); return; }
        if (attempts >= 20) return;
        setTimeout(() => ensureChartAvailable(callback, attempts + 1), 150);
    }

    function observeWhenVisible(selector, initFn) {
        const el = document.getElementById(selector);
        if (!el) return;
        if (el.dataset && el.dataset.initialized === 'true') return;

        if (!('IntersectionObserver' in window)) {
            ensureChartAvailable(() => { initFn(); el.dataset.initialized = 'true'; });
            return;
        }

        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    ensureChartAvailable(() => {
                        initFn();
                        entry.target.dataset.initialized = 'true';
                    });
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        io.observe(el);
    }

    const initAllCharts = () => {
        observeWhenVisible('credoraChart', () => renderChart(periodoActual));
        observeWhenVisible('usageChart', renderUsageChart);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllCharts);
    } else {
        initAllCharts();
    }

    window.cambiarColorGrafica = cambiarColorGrafica;
    window.cambiarPeriodo = cambiarPeriodo;
}