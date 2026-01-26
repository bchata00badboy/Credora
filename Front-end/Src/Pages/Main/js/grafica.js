// /Front-end/Src/Pages/Main/js/grafica.js

/* ==========================================
   LOGICA DE GRÁFICAS - SPA + CONEXIÓN API
   ========================================== */

(function() {
    console.log('>>> Sistema de Gráficas: Iniciado y vigilando...');

    // --- 1. CONFIGURACIÓN Y DATOS INICIALES (Placeholders) ---
    // Estos datos se mostrarán mientras carga la API o si falla la conexión
    const walletData = {
        dia: { 
            labels: ["08:00", "12:00", "16:00", "20:00", "00:00"], 
            data: [0, 0, 0, 0, 0], 
            total: "$0.00" 
        },
        mes: { 
            labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], 
            data: [0, 0, 0, 0], 
            total: "$0.00" 
        },
        anio: { 
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], 
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
            total: "$0.00" 
        }
    };

    // Variables de Estado
    let periodoActual = 'dia'; 
    
    // Configuración de Colores
    const colorOptions = ['#003049', '#00d26a', '#f7b731', '#8854d0', '#eb3b5a'];
    let colorIndex = 1; // Verde por defecto
    let currentColor = colorOptions[colorIndex];

    // Variables para las instancias de Chart.js
    window.chartInstanceMain = null;
    window.chartInstanceUsage = null;

    // --- 2. UTILIDADES ---
    function hexToRgba(hex, alpha) {
        let c = hex.substring(1).split('');
        if(c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }

    // --- 3. FUNCIONES DE RENDERIZADO ---

    // A) Gráfica Principal (Líneas)
    window.renderMainChart = function(periodo = periodoActual) {
        const canvas = document.getElementById('credoraChart');
        if (!canvas) return; 

        // Destruir anterior si existe para evitar superposiciones
        if (window.chartInstanceMain instanceof Chart) {
            window.chartInstanceMain.destroy();
        }

        const ctx = canvas.getContext('2d');
        const selectedData = walletData[periodo];
        const colorPrincipal = currentColor; 

        // Crear degradado dinámico
        let gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, hexToRgba(colorPrincipal, 0.5));
        gradient.addColorStop(1, hexToRgba(colorPrincipal, 0.0));

        window.chartInstanceMain = new Chart(ctx, {
            type: 'line',
            data: {
                labels: selectedData.labels,
                datasets: [{
                    label: 'Balance',
                    data: selectedData.data,
                    borderColor: colorPrincipal,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: colorPrincipal,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 500 }
            }
        });

        // Actualizar texto de dinero en la tarjeta
        const totalDisplay = document.getElementById('totalDisplay');
        if(totalDisplay) totalDisplay.innerText = selectedData.total;
        
        canvas.classList.add('chart-initialized');
    };

    // B) Gráfica Secundaria (Dona - Gastos)
    window.renderUsageChart = function() {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;

        if (window.chartInstanceUsage instanceof Chart) {
            window.chartInstanceUsage.destroy();
        }

        const ctx = canvas.getContext('2d');
        const donutColors = ['#00d26a', '#003049', '#f7b731'];

        window.chartInstanceUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Servicios', 'Comida', 'Ocio'],
                datasets: [{
                    data: [45, 30, 25], // Valores por defecto
                    backgroundColor: donutColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
        
        canvas.classList.add('chart-initialized');
    };

    // --- 4. INTERACCIÓN GLOBAL ---
    
    window.cambiarPeriodo = function(nuevoPeriodo, btn) {
        periodoActual = nuevoPeriodo;
        if(btn) {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        window.renderMainChart(periodoActual);
    };
    
    window.cambiarColorGrafica = function() {
        colorIndex = (colorIndex + 1) % colorOptions.length;
        currentColor = colorOptions[colorIndex];
        // Opcional: Actualizar variable CSS si se usa en otros elementos
        document.documentElement.style.setProperty('--chart-primary', currentColor);
        window.renderMainChart(periodoActual);
    };

    // --- 5. PUENTE DE DATOS (NUEVO) ---
    // Esta función será llamada por Main.js cuando reciba datos del backend
    window.actualizarGraficasDesdeAPI = function(datosBackend) {
        console.log("📊 Actualizando gráficas con datos reales...", datosBackend);
        
        if (!datosBackend) return;

        // 1. Actualizar Gráfica Lineal (Historial)
        // Se asume que el backend envía una estructura compatible o un array de movimientos
        if (datosBackend.lineal) {
            // Actualizamos los datos locales
            walletData.dia.data = datosBackend.lineal.valores || walletData.dia.data;
            walletData.dia.labels = datosBackend.lineal.etiquetas || walletData.dia.labels;
            walletData.dia.total = datosBackend.lineal.total_fmt || walletData.dia.total;
            
            // Renderizamos de nuevo con los datos frescos
            window.renderMainChart(periodoActual);
        }

        // 2. Actualizar Gráfica de Dona (Distribución de Gastos)
        if (datosBackend.categorias && window.chartInstanceUsage) {
            // Ejemplo: datosBackend.categorias = { valores: [10, 50, 40], etiquetas: [...] }
            window.chartInstanceUsage.data.datasets[0].data = datosBackend.categorias.valores;
            // Opcional: actualizar etiquetas si el diseño tuviera leyenda dinámica
            window.chartInstanceUsage.update();
        }
    };

    // --- 6. EL VIGILANTE (OBSERVER) ---
    // Detecta cuando el HTML de las gráficas se inyecta en el DOM
    const observer = new MutationObserver((mutations) => {
        const mainCanvas = document.getElementById('credoraChart');
        const usageCanvas = document.getElementById('usageChart');

        if (mainCanvas && !mainCanvas.classList.contains('chart-initialized')) {
            window.renderMainChart();
        }

        if (usageCanvas && !usageCanvas.classList.contains('chart-initialized')) {
            window.renderUsageChart();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Intento inicial por si ya existen los elementos
    setTimeout(() => {
        window.renderMainChart();
        window.renderUsageChart();
    }, 100);

})();