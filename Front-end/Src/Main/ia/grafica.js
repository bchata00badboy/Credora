/* =========================================
   1. CONFIGURACIÓN Y DATOS
   ========================================= */

// Datos globales en window para persistencia
window.walletData = {
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

// Variables de estado
window.periodoActual = 'dia';
const colorOptions = ['#003049', '#00d26a', '#f7b731', '#8854d0', '#eb3b5a'];
let colorIndex = 0; 
let currentColor = colorOptions[0];

/* =========================================
   2. GRÁFICA DE BALANCE (IZQUIERDA)
   ========================================= */

window.renderChart = function(periodo) {
    const canvas = document.getElementById('credoraChart');
    
    // Si no hay canvas (el usuario está en otra pestaña), salir
    if (!canvas) return; 

    const ctx = canvas.getContext('2d');
    const selectedData = window.walletData[periodo];

    // Crear degradado
    let gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, hexToRgba(currentColor, 0.5)); 
    gradient.addColorStop(1, hexToRgba(currentColor, 0.0)); 

    // --- LÓGICA ANTI-FANTASMA ---
    // Verificamos si existe una gráfica y si su canvas sigue siendo el mismo del DOM
    if (window.myChart) {
        if (window.myChart.canvas !== canvas) {
            // El canvas cambió (usuario navegó y volvió).
            // No llamamos a .destroy() por petición del usuario, pero
            // debemos desapuntar la referencia para poder crear la gráfica
            // sobre el nuevo canvas al volver a la vista.
            window.myChart = null;
        }
    }

    if (window.myChart) {
        // ESCENARIO 1: ACTUALIZACIÓN (Animación suave)
        // La gráfica existe y es válida, solo actualizamos datos y colores
        window.myChart.data.labels = selectedData.labels;
        window.myChart.data.datasets[0].data = selectedData.data;
        window.myChart.data.datasets[0].borderColor = currentColor;
        window.myChart.data.datasets[0].pointBorderColor = currentColor;
        window.myChart.data.datasets[0].backgroundColor = gradient;
        
        window.myChart.update(); 
    } else {
        // ESCENARIO 2: CREACIÓN (Carga inicial o recarga)
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: selectedData.labels,
                datasets: [{
                    data: selectedData.data,
                    borderColor: currentColor,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: currentColor,
                    pointRadius: 3,
                    pointHoverRadius: 6,
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
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    // Actualizar texto dinero
    const textoDinero = document.getElementById('totalDisplay');
    if (textoDinero) {
        textoDinero.style.opacity = 0;
        setTimeout(() => {
            textoDinero.innerText = selectedData.total;
            textoDinero.style.opacity = 1;
        }, 150);
    }
};

/* =========================================
   3. GRÁFICA DE DONA (DERECHA)
   ========================================= */

window.renderUsageChart = function() {
    const canvas = document.getElementById('usageChart');
    if (!canvas) return;

    // Lógica Anti-Fantasma para la dona
    if (window.usageChartInstance) {
        if (window.usageChartInstance.canvas !== canvas) {
            // El canvas cambió; no destruimos la instancia por petición del usuario,
            // pero desapuntamos la referencia para permitir recrearla en el nuevo canvas.
            window.usageChartInstance = null;
        }
    }

    // Si ya existe y es válida, no la redibujamos innecesariamente (ahorra recursos)
    // Si quisieras animarla siempre, quitarías este 'return' y usarías .update()
    if (window.usageChartInstance) {
        window.usageChartInstance.update();
        return;
    }

    const dataValues = [45, 30, 25];
    const dataLabels = ['Servicios', 'Comida', 'Ocio'];

    window.usageChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: dataLabels,
            datasets: [{
                data: dataValues,
                backgroundColor: ['#00d26a', '#003049', '#f7b731'],
                borderWidth: 0, 
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } },
            animation: { animateScale: true, animateRotate: true }
        }
    });

    // Texto central
    try {
        const centerTextBig = document.querySelector('.donut-center-text .big-percent');
        const centerTextSmall = document.querySelector('.donut-center-text .small-label');
        if (centerTextBig) centerTextBig.innerText = '45%';
        if (centerTextSmall) centerTextSmall.innerText = 'Servicios';
    } catch (e) {}
};

/* =========================================
   4. INTERACCIONES Y UTILIDADES
   ========================================= */

window.cambiarPeriodo = function(nuevoPeriodo, btn) {
    window.periodoActual = nuevoPeriodo;
    
    // Gestión visual de botones activos
    const contenedor = btn.parentElement; // Buscamos solo en el contenedor del botón clickeado
    if(contenedor) {
        contenedor.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
    
    renderChart(window.periodoActual);
};

window.cambiarColorGrafica = function() {
    colorIndex = (colorIndex + 1) % colorOptions.length;
    currentColor = colorOptions[colorIndex];
    document.documentElement.style.setProperty('--chart-primary', currentColor);
    renderChart(window.periodoActual);
};

function hexToRgba(hex, alpha) {
    let c = hex.substring(1).split('');
    if(c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    c = '0x'+c.join('');
    return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
}

/* =========================================
   5. INICIALIZACIÓN
   ========================================= */

// Función maestra de inicio
function initAll() {
    // Intentar renderizar si los elementos existen
    if(document.getElementById('credoraChart')) renderChart('dia');
    if(document.getElementById('usageChart')) renderUsageChart();
}
window.addEventListener('load', initAll);
// También intentar al cambiar de pestaña (Anti-Fantasma)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initAll();
    }
});
