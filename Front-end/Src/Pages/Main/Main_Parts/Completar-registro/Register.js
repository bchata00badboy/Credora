document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DE BILLETERAS (FONDO) ---
    const bubblesContainer = document.getElementById('Wallet_back');
    if (!bubblesContainer) return;

    function createWallet(isInitial = false) {
        const wallet = document.createElement('i');
        wallet.classList.add('bx', 'bxs-wallet', 'floating-wallet');
        wallet.style.left = Math.random() * 95 + '%'; 
        const size = Math.random() * 50 + 40; 
        wallet.style.fontSize = size + 'px';
        const duration = Math.random() * 15 + 10; 
        wallet.style.animationDuration = duration + 's';
        if (isInitial) {
            wallet.style.animationDelay = -(Math.random() * duration) + 's';
        }
        wallet.style.opacity = Math.random() * 0.5 + 0.1; 
        bubblesContainer.appendChild(wallet);
        setTimeout(() => { wallet.remove(); }, duration * 1000);
    }

    for(let i = 0; i < 40; i++) { createWallet(true); }
    function startLoop() {
        createWallet(false);
        setTimeout(startLoop, Math.random() * 800 + 400);
    }
    startLoop();

    // --- 2. REFERENCIAS PARA EL PROCESO KYC ---
    const formKyc = document.getElementById('form-kyc'); // ASEGÚRATE que el <form> tenga este ID
    const fileInput = document.getElementById('doc-id');
    const errorDisplay = document.getElementById('error-message');
    const campoArchivo = document.querySelector('.Campo-Archivo');
    
    const vistaSubida = document.getElementById('vista-subida');
    const vistaCarga = document.getElementById('vista-carga');
    const vistaResultados = document.getElementById('vista-resultados');
    const barra = document.getElementById('barra-progreso');

    // --- 3. VALIDACIÓN DE ARCHIVO (AL CAMBIAR) ---
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const sizeInMB = this.files[0].size / (1024 * 1024);
            if (sizeInMB > 5) {
                errorDisplay.style.display = 'block';
                campoArchivo.style.border = '2px solid #ff4d4d';
                this.value = ""; 
            } else {
                errorDisplay.style.display = 'none';
                campoArchivo.style.border = '1px dashed #ccc';
            }
        }
    });

    // --- 4. DISPARADOR DEL PROCESO (SUBMIT) ---
    formKyc.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se refresque
        
        // Iniciamos la transición visual
        vistaSubida.style.display = 'none';
        vistaCarga.style.display = 'block';

        // Animamos la barra de carga
        let progreso = 0;
        const intervaloCarga = setInterval(() => {
            progreso += Math.random() * 15;
            if (progreso > 100) progreso = 100;
            
            if (barra) barra.style.width = progreso + '%';

            if (progreso === 100) {
                clearInterval(intervaloCarga);
                // Cuando la barra llega a 100, llamamos a la simulación de la API
                simulacionAPI();
            }
        }, 300);
    });

    // --- 5. FUNCIONES DE RENDERIZADO Y API ---
    function renderizarDatosKYC(datos) {
        // Expandir el contenedor principal
        const contenedorPrincipal = document.querySelector('.Reg-box');
        contenedorPrincipal.style.width = '550px'; // Ajuste de tamaño por DOM
        contenedorPrincipal.style.transition = 'width 0.5s ease';

        // Inyectar datos en los inputs
        document.getElementById('res-nombre').value = datos.nombre;
        document.getElementById('res-nacimiento').value = datos.fecha;

        const badgeVencimiento = document.getElementById('res-vencimiento');
        if (datos.estaVencido) {
            badgeVencimiento.textContent = "Documento Vencido";
            badgeVencimiento.className = "status-badge expired";
        } else {
            badgeVencimiento.textContent = "Documento Vigente";
            badgeVencimiento.className = "status-badge valid";
        }

         const badgeEdad = document.getElementById('res-edad');
        if (datos.mayorEdad) {
            
            badgeEdad.textContent = "Es mayor de edad";
            badgeEdad.className = "status-badge valid";
        } else {
            badgeEdad.textContent = "No es mayor de Edad";
            badgeEdad.className = "status-badge invalid";
        }

        // Cambiar de vista final
        vistaCarga.style.display = 'none';
        vistaResultados.style.display = 'block';
    }

    function simulacionAPI() {
        // Simulamos un retraso de red de 1.5 segundos adicional
        setTimeout(() => {
            const respuestaFicticia = {
                nombre: "PEDRO ARMANDO LOPEZ",
                fecha: "24/01/1985",
                estaVencido: false,
                mayorEdad: true
            };
            renderizarDatosKYC(respuestaFicticia);
        }, 1500);
    }

});