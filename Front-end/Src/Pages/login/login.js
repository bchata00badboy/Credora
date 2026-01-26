/**
 * CREDORA LOGIN - SCRIPT PRINCIPAL
 * ==================================
 * Archivo: script.js
 * Descripción: Funcionalidades interactivas de la página de login
 *   - Toggle entre formularios de login y registro
 *   - Limpieza de campos al cambiar de formulario
 *   - Generación dinámica de billeteras animadas (efecto nieve)
 *   - Posicionamiento aleatorio y duración variable
 */

// ============================================
// 1. REFERENCIAS A ELEMENTOS DEL DOM
// ============================================

/** Contenedor principal que cambia de estado activo */
const container = document.querySelector('.container');

/** Botón de registro (en el panel deslizante) */
const registerBtn = document.querySelector('.register-btn');

/** Botón de login (en el panel deslizante) */
const loginBtn = document.querySelector('.login-btn');

// ============================================
// 2. FUNCIONES UTILITARIAS
// ============================================

/**
 * Limpia todos los campos de input del formulario
 * Se ejecuta al cambiar entre login y registro
 */
function clearInputs() {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });
}

// ============================================
// 3. EVENT LISTENERS - TOGGLE PANELS
// ============================================

/**
 * Evento: Click en botón "Registrarse" (panel izquierdo)
 * Acción: Activa la clase 'active' para mostrar formulario de registro
 * Efecto: Panel desliza, formulario cambia, se limpian inputs
 */
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    clearInputs();
});

/**
 * Evento: Click en botón "Iniciar Sesión" (panel derecho)
 * Acción: Desactiva la clase 'active' para mostrar formulario de login
 * Efecto: Panel desliza al revés, formulario cambia, se limpian inputs
 */
loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    clearInputs();
});

// ============================================
// 4. ANIMACIÓN DE BILLETERAS (COPOS DE NIEVE)
// ============================================

/**
 * Crea una billetera animada que cae desde la parte superior
 * 
 * @param {boolean} isInitial - Si es true, la animación comienza desde un punto aleatorio
 *                             Si es false, comienza desde arriba
 * 
 * Características:
 *   - Tamaño aleatorio entre 15-40px
 *   - Duración de caída entre 10-25 segundos
 *   - Posición horizontal aleatoria
 *   - Opacidad variable para efecto de profundidad
 *   - Rotación de 360 grados durante la caída
 */
function createWallet(isInitial = false) {
    // Obtener contenedor de billeteras
    const snowflakesContainer = document.getElementById('snowflakes-container');
    
    // Crear elemento billetera
    const wallet = document.createElement('i');
    wallet.className = 'bx bxs-wallet snowflake';
    
    // Posición horizontal aleatoria (0-95% del ancho)
    wallet.style.left = Math.random() * 95 + '%';
    
    // Inicio desde arriba
    wallet.style.top = '-50px';
    
    // Tamaño aleatorio entre 15-40px
    const size = Math.random() * 25 + 15;
    wallet.style.fontSize = size + 'px';
    
    // Duración de caída aleatoria entre 10-25 segundos
    const duration = Math.random() * 15 + 10;
    wallet.style.animationDuration = duration + 's';
    
    // Delay de animación
    if (isInitial) {
        // Para iniciales: comienzan desde puntos aleatorios de la caída
        wallet.style.animationDelay = -(Math.random() * duration) + 's';
    } else {
        // Para nuevas: comienzan desde el inicio
        wallet.style.animationDelay = '0s';
    }
    
    // Opacidad aleatoria para efecto de profundidad (10-50%)
    wallet.style.opacity = Math.random() * 0.4 + 0.1;
    
    // Añadir al contenedor
    snowflakesContainer.appendChild(wallet);
    
    // Remover cuando termina la animación
    setTimeout(() => {
        wallet.remove();
    }, duration * 1000);
}

// ============================================
// 5. INICIALIZACIÓN
// ============================================

/**
 * Crear 40 billeteras iniciales
 * Estas empiezan con delay negativo para que parezca que ya estaban cayendo
 */
for (let i = 0; i < 40; i++) {
    createWallet(true);
}

/**
 * Loop continuo de generación de billeteras
 * Crea nuevas billeteras en intervalos aleatorios (400-1200ms)
 */
function startLoop() {
    createWallet(false);
    let randomInterval = Math.random() * 800 + 400; // 400-1200ms
    setTimeout(startLoop, randomInterval);
}

// Iniciar el loop de generación
startLoop();
