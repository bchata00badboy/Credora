/* ==========================================
   LOGICA DE GRÁFICAS - SPA + CAMBIO DE COLOR
   ========================================== */

(function() {
    console.log('>>> Sistema de Gráficas: Iniciado y vigilando...');

    // --- 1. CONFIGURACIÓN Y DATOS ---
    const walletData = {
        dia: { labels: ["08:00", "12:00", "16:00", "20:00", "00:00"], data: [120, 150, 180, 220, 260], total: "$260.00" },
        mes: { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], data: [1500, 2100, 1800, 2900], total: "$2,900.00" },
        anio: { labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], data: [4500, 5200, 4800, 6100, 7500, 8200, 7800, 9500, 11000, 10500, 12800, 15400], total: "$15,400.00" }
    };

    // Variables de Estado
    let periodoActual = 'dia'; 
    
    // Configuración de Colores (Restaurada)
    const colorOptions = ['#003049', '#00d26a', '#f7b731', '#8854d0', '#eb3b5a'];
    let colorIndex = 1; // Empezamos con el verde (índice 1) por defecto
    let currentColor = colorOptions[colorIndex];

    // Variables para las instancias de Chart.js
    window.chartInstanceMain = null;
    window.chartInstanceUsage = null;

    // --- 2. UTILIDADES ---
    
    // Función necesaria para crear el degradado transparente bajo la línea
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

        // Destruir anterior si existe
        if (window.chartInstanceMain instanceof Chart) {
            window.chartInstanceMain.destroy();
        }

        const ctx = canvas.getContext('2d');
        const selectedData = walletData[periodo];

        // Usamos el color actual seleccionado
        const colorPrincipal = currentColor; 

        // Crear degradado dinámico basado en el color actual
        let gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, hexToRgba(colorPrincipal, 0.5)); // 50% opacidad
        gradient.addColorStop(1, hexToRgba(colorPrincipal, 0.0)); // 0% opacidad (transparente)

        window.chartInstanceMain = new Chart(ctx, {
            type: 'line',
            data: {
                labels: selectedData.labels,
                datasets: [{
                    label: 'Balance',
                    data: selectedData.data,
                    borderColor: colorPrincipal,       // Borde del color seleccionado
                    backgroundColor: gradient,         // Fondo degradado del color seleccionado
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: colorPrincipal,  // Puntos del color seleccionado
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 500 } // Animación suave al cambiar
            }
        });

        // Actualizar texto de dinero
        const totalDisplay = document.getElementById('totalDisplay');
        if(totalDisplay) totalDisplay.innerText = selectedData.total;
        
        // Marcar canvas como "iniciado"
        canvas.classList.add('chart-initialized');
    };

    // B) Gráfica Secundaria (Dona)
    window.renderUsageChart = function() {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;

        if (window.chartInstanceUsage instanceof Chart) {
            window.chartInstanceUsage.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Colores de la dona (fijos o puedes hacerlos dinámicos también si gustas)
        const donutColors = ['#00d26a', '#003049', '#f7b731'];

        window.chartInstanceUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Servicios', 'Comida', 'Ocio'],
                datasets: [{
                    data: [45, 30, 25],
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

    // --- 4. BOTONES (GLOBALES) ---
    
    // Cambiar Periodo (Día/Mes/Año)
    window.cambiarPeriodo = function(nuevoPeriodo, btn) {
        periodoActual = nuevoPeriodo;
        if(btn) {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        window.renderMainChart(periodoActual);
    };
    
    // Cambiar Color (La función que pediste restaurar)
    window.cambiarColorGrafica = function() {
        // 1. Avanzar al siguiente color en la lista
        colorIndex = (colorIndex + 1) % colorOptions.length;
        
        // 2. Actualizar la variable de color actual
        currentColor = colorOptions[colorIndex];
        
        console.log('Cambiando color a:', currentColor);

        // 3. (Opcional) Actualizar variable CSS si tienes botones que dependen de ella
        document.documentElement.style.setProperty('--chart-primary', currentColor);

        // 4. Redibujar la gráfica con el nuevo color
        // Nota: Al llamar a renderMainChart, este destruirá la vieja y creará la nueva con el nuevo color
        window.renderMainChart(periodoActual);
    };

    // --- 5. EL VIGILANTE (MUTATION OBSERVER) ---
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

    // Intento inicial
    setTimeout(() => {
        window.renderMainChart();
        window.renderUsageChart();
    }, 100);

})();