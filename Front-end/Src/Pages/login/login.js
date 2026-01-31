/* ============================================
   CREDORA LOGIN - SCRIPT PRINCIPAL
   ============================================ */

// --- REFERENCIAS DOM ---
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn'); // Botón panel izq
const loginBtn = document.querySelector('.login-btn');       // Botón panel der

// --- DETECTAR HASH PARA IR DIRECTO A REGISTRO ---
if (window.location.hash === '#register') {
    container.classList.add('active');
}

// --- REFERENCIAS DEL MODAL ---
const modalTerms = document.getElementById('modal-terms');
const btnOpenTerms = document.getElementById('btn-open-terms');
const btnCloseTerms = document.getElementById('btn-close-terms');
const btnAcceptTerms = document.getElementById('btn-accept-terms');
const checkTerms = document.getElementById('checkTerms');
const btnDownload = document.getElementById('btn-download-pdf');

// --- 1. TOGGLE ENTRE LOGIN Y REGISTRO ---
function clearInputs() {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    // Resetear checkbox al cambiar de vista
    if(checkTerms) checkTerms.checked = false;
}

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    clearInputs();
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    clearInputs();
});

// --- 2. ANIMACIÓN BILLETERAS (FONDO) ---
function createWallet(isInitial = false) {
    const snowflakesContainer = document.getElementById('snowflakes-container');
    if (!snowflakesContainer) return;

    const wallet = document.createElement('i');
    wallet.className = 'bx bxs-wallet snowflake';
    wallet.style.left = Math.random() * 95 + '%';
    wallet.style.top = '-50px';
    
    const size = Math.random() * 25 + 15;
    wallet.style.fontSize = size + 'px';
    
    const duration = Math.random() * 15 + 10;
    wallet.style.animationDuration = duration + 's';
    
    if (isInitial) {
        wallet.style.animationDelay = -(Math.random() * duration) + 's';
    } else {
        wallet.style.animationDelay = '0s';
    }
    
    wallet.style.opacity = Math.random() * 0.4 + 0.1;
    
    snowflakesContainer.appendChild(wallet);
    
    setTimeout(() => { wallet.remove(); }, duration * 1000);
}

// Iniciar animación
for (let i = 0; i < 40; i++) createWallet(true);

function startLoop() {
    createWallet(false);
    setTimeout(startLoop, Math.random() * 800 + 400);
}
startLoop();

// --- 3. LÓGICA DEL MODAL DE TÉRMINOS ---
function abrirModal() {
    if(modalTerms) modalTerms.classList.add('active');
}

function cerrarModal() {
    if(modalTerms) modalTerms.classList.remove('active');
}

// Abrir modal
if (btnOpenTerms) btnOpenTerms.addEventListener('click', abrirModal);

// Cerrar con la X
if (btnCloseTerms) btnCloseTerms.addEventListener('click', cerrarModal);

// Cerrar con el botón "Aceptar" y marcar el checkbox
if (btnAcceptTerms) {
    btnAcceptTerms.addEventListener('click', () => {
        cerrarModal();
        if (checkTerms) checkTerms.checked = true;
    });
}

// Cerrar haciendo clic afuera
if (modalTerms) {
    modalTerms.addEventListener('click', (e) => {
        if (e.target === modalTerms) cerrarModal();
    });
}

// --- 4. LÓGICA DE DESCARGA PDF ---
if (btnDownload) {
    btnDownload.addEventListener('click', () => {
        const contenidoOriginal = btnDownload.innerHTML;
        
        // Feedback visual (Cargando...)
        btnDownload.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Descargando...";
        btnDownload.style.opacity = "0.7";
        btnDownload.style.pointerEvents = "none";
        
        setTimeout(() => {
            const link = document.createElement('a');
            
            // Ruta corregida al archivo PDF en la carpeta Assets
            link.href = '../../Assets/PDF/Terminos_Credora.pdf.pdf'; 
            link.download = 'Terminos_y_Condiciones_Credora.pdf';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Restaurar botón
            btnDownload.innerHTML = contenidoOriginal;
            btnDownload.style.opacity = "1";
            btnDownload.style.pointerEvents = "auto";
        }, 1000);
    });
}