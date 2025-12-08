const container = document.querySelector('.container');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');

// Lógica del formulario (Giro)
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('active');
});

loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('active');
});

// Soporte para abrir directamente la vista de registro vía hash o query
(function openFromUrl() {
    try {
        const hash = window.location.hash || '';
        const params = new URLSearchParams(window.location.search);
        const wantRegister = hash === '#register' || params.get('tab') === 'register';
        if (wantRegister && container) {
            container.classList.add('active');
        }
    } catch (err) {
        // ignorar errores de URL
    }
})();

// Lógica de Billeteras Dispersas

function createWallet(isInitial = false) {
    const bubblesContainer = document.getElementById('wallet-container');
    const wallet = document.createElement('i');
    wallet.classList.add('bx', 'bxs-wallet', 'floating-wallet');

    // Posición horizontal aleatoria (0% a 100% de la pantalla)
    wallet.style.left = Math.random() * 95 + '%'; 

    // Tamaño aleatorio grande (entre 40px y 90px)
    const size = Math.random() * 50 + 40; 
    wallet.style.fontSize = size + 'px';

    // Velocidad aleatoria (entre 10s y 25s)
    const duration = Math.random() * 15 + 10; 
    wallet.style.animationDuration = duration + 's';

    //Si es la carga inicial, las esparcimos por toda la pantalla
    if (isInitial) {
        // Asignamos un retraso negativo aleatorio. 
        wallet.style.animationDelay = -(Math.random() * duration) + 's';
    } else {
        wallet.style.animationDelay = '0s';
    }

    // Opacidad aleatoria para dar profundidad (unas más lejos que otras)
    wallet.style.opacity = Math.random() * 0.5 + 0.1; 

    bubblesContainer.appendChild(wallet);

    //Elimina cuando termine la animación para no saturar el navegador
    const remainingTime = isInitial ? duration * 1000 : duration * 1000;
    
    setTimeout(() => {
        wallet.remove();
    }, remainingTime);
}

// Al cargar, se crean billeteras instantáneas regadas por la pantalla
for(let i = 0; i < 40; i++) {
    createWallet(true);
}

// Crea nuevas billeteras con tiempos variables para que no se acumulen
function startLoop() {
    // Crea una billetera nueva
    createWallet(false);
    
    // Espera un tiempo aleatorio entre 400ms y 1200ms antes de crear la siguiente
    let randomInterval = Math.random() * 800 + 400;
    setTimeout(startLoop, randomInterval);
}

startLoop();

// Mostrar / Ocultar contraseña (se añade dinámicamente a cada input password)
function enablePasswordToggles(){
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input, idx) => {
        // evitar duplicados
        if (input.parentElement.querySelector('.toggle-password')) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'toggle-password';
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('title', 'Mostrar contraseña');
        toggle.innerHTML = "<i class='bx bx-low-vision'></i>";

        // estilos básicos
        toggle.style.background = 'transparent';
        toggle.style.border = 'none';
        toggle.style.cursor = 'pointer';
        toggle.style.marginLeft = '8px';
        toggle.style.color = 'inherit';

        toggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.setAttribute('aria-pressed', String(isPassword));
            toggle.title = isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
            // cambiar icono
            const icon = toggle.querySelector('i');
            if(icon){
                icon.className = isPassword ? 'bx bx-show' : 'bx bx-low-vision';
            }
        });

        // inserta el toggle al lado del icono (candado) dentro de .input-box
        const iconEl = input.parentElement.querySelector('.icon');
        if (iconEl && iconEl.parentElement === input.parentElement) {
            // insertamos justo después del icono para que quede al lado
            if (iconEl.nextSibling) {
                input.parentElement.insertBefore(toggle, iconEl.nextSibling);
            } else {
                input.parentElement.appendChild(toggle);
            }
        } else {
            // fallback: append al final del parent
            input.parentElement.appendChild(toggle);
        }
    });
}

// habilita toggles al cargar
enablePasswordToggles();