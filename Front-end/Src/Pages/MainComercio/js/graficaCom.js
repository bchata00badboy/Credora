// /Front-end/Src/Pages/Main/js/grafica.js

// /Front-end/Src/Pages/Main/js/grafica.js

(function() {
    console.log('📊 Sistema de Gráficas: Módulo cargado correctamente.');

    const CONFIG = {
        colors: ['#003049', '#00d26a', '#f7b731', '#8854d0', '#eb3b5a'],
        defaultColorIndex: 1, // Verde
        fontFamily: "'Poppins', sans-serif"
    };

    let currentColorIndex = CONFIG.defaultColorIndex;
    let periodoActual = 'dia'; 

    // --- DATOS LOCALES (Estructura Base) ---
    // Estas son las etiquetas predeterminadas que definen el eje X
    const datosLocales = {
        dia: { 
            labels: ["06:00", "10:00", "14:00", "18:00", "22:00"], 
            data: [0, 0, 0, 0, 0] 
        },
        mes: { 
            labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], 
            data: [0, 0, 0, 0] 
        },
        anio: { 
            labels: ["Ene", "Abr", "Jul", "Oct", "Dic"], 
            data: [0, 0, 0, 0, 0] 
        }
    };

    function hexToRgba(hex, alpha) {
        let c = hex.substring(1).split('');
        if(c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }

    // --- RENDERIZADO GRÁFICA PRINCIPAL ---
    window.renderMainChart = function(periodo = periodoActual) {
        const canvas = document.getElementById('credoraChart');
        if (!canvas) return;

        // Protección contra carga prematura
        if (typeof Chart === 'undefined') {
            setTimeout(() => window.renderMainChart(periodo), 500);
            return;
        }

        const chartExistente = Chart.getChart(canvas);
        if (chartExistente) chartExistente.destroy();

        const ctx = canvas.getContext('2d');
        const color = CONFIG.colors[currentColorIndex];
        
        // Selección de datos segura
        const dataSet = datosLocales[periodo] || datosLocales['dia'];

        // Gradiente seguro
        const height = canvas.height || 160;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, hexToRgba(color, 0.5));
        gradient.addColorStop(1, hexToRgba(color, 0.01));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataSet.labels,
                datasets: [{
                    label: 'Balance',
                    data: dataSet.data, // Array numérico
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: color,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // Curva suave
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false, min: 0 } },
                animation: { duration: 800 }
            }
        });
    };

    // --- RENDERIZADO GRÁFICA DONA ---
    window.renderUsageChart = function() {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;
        if (typeof Chart === 'undefined') return;

        const chartExistente = Chart.getChart(canvas);
        if (chartExistente) chartExistente.destroy();

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Servicios', 'Comida', 'Ocio'],
                datasets: [{
                    data: [30, 50, 20], // Placeholder inicial
                    backgroundColor: ['#00d26a', '#003049', '#f7b731'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
    };

    // --- INTERACCIÓN ---
    window.cambiarPeriodo = function(nuevoPeriodo, btn) {
        periodoActual = nuevoPeriodo;
        if(btn) {
            btn.parentElement.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        window.renderMainChart(periodoActual);
    };

    window.cambiarColorGrafica = function() {
        currentColorIndex = (currentColorIndex + 1) % CONFIG.colors.length;
        window.renderMainChart(periodoActual);
    };

    // =========================================================
    //  PUENTE DE DATOS CON LÓGICA DE RELLENO (FIX)
    // =========================================================
    window.actualizarGraficasDesdeAPI = function(historial) {
        console.log("📥 API Data recibida en JS:", historial);

        if (!historial) return;

        /**
         * FUNCIÓN DE NORMALIZACIÓN:
         * Si el array tiene 1 solo dato (ej: saldo actual), lo repetimos 
         * para que coincida con la cantidad de etiquetas (ej: 5 para dia).
         * Esto crea una línea plana visualmente agradable.
         */
        const normalizarDatos = (arrEntrada, cantidadObjetivo) => {
            // Si no es array o está vacío, devolvemos ceros
            if (!Array.isArray(arrEntrada) || arrEntrada.length === 0) {
                return new Array(cantidadObjetivo).fill(0);
            }

            // Si tiene datos suficientes, lo devolvemos tal cual
            if (arrEntrada.length >= cantidadObjetivo) {
                return arrEntrada.slice(0, cantidadObjetivo);
            }

            // CASO CLAVE: Pocos datos (ej: 1 punto).
            // Rellenamos el resto del array con el último valor conocido.
            const ultimoValor = arrEntrada[arrEntrada.length - 1];
            const relleno = new Array(cantidadObjetivo - arrEntrada.length).fill(ultimoValor);
            return [...arrEntrada, ...relleno];
        };

        // 1. Mapeo para 'DIA' (Esperamos 5 puntos según labels de dia)
        if (historial.dia) {
            const rawData = Array.isArray(historial.dia) ? historial.dia : (historial.dia.data || []);
            datosLocales.dia.data = normalizarDatos(rawData, datosLocales.dia.labels.length);
            
            // Si el backend envía etiquetas personalizadas, las usamos
            if (historial.dia.labels && Array.isArray(historial.dia.labels)) {
                datosLocales.dia.labels = historial.dia.labels;
            }
        }

        // 2. Mapeo para 'MES' (Esperamos 4 puntos)
        if (historial.mes) {
            const rawData = Array.isArray(historial.mes) ? historial.mes : (historial.mes.data || []);
            datosLocales.mes.data = normalizarDatos(rawData, datosLocales.mes.labels.length);
        }

        // 3. Mapeo para 'ANIO' (Esperamos 5 puntos)
        if (historial.anio) {
            const rawData = Array.isArray(historial.anio) ? historial.anio : (historial.anio.data || []);
            datosLocales.anio.data = normalizarDatos(rawData, datosLocales.anio.labels.length);
        }

        // 4. Actualizar total de texto
        const totalDisplay = document.getElementById('totalDisplay');
        if(totalDisplay) {
            // Preferimos el valor explícito del backend, sino usamos el último punto de la gráfica
            const ultimoValorGrafica = datosLocales.dia.data[datosLocales.dia.data.length -1];
            const total = historial.total_actual !== undefined ? historial.total_actual : ultimoValorGrafica;
            
            totalDisplay.innerText = typeof total === 'number' 
                ? `$${total.toLocaleString('en-US', {minimumFractionDigits: 2})}` 
                : total;
        }

        console.log("✅ Datos normalizados para gráfica:", datosLocales);

        // 5. Renderizar
        window.renderMainChart(periodoActual);
    };

    // Auto-inicio
    if (document.getElementById('credoraChart')) {
        window.renderMainChart();
        window.renderUsageChart();
    }

})();