// Front-end\Src\Pages\login\login.js

/* ==========================================================================
   1. CONFIGURACIÓN Y UTILIDADES
   ========================================================================== */
// URL base de tu API (Ajustado a tu puerto)
const API_BASE = 'http://127.0.0.1:8000/api/v1/auth';

// Referencias DOM principales
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// Helper local showToast (usa las clases definidas en login.css)
function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(message, type = 'info', duration = 1600) {
    try {
        const container = ensureToastContainer();
        const t = document.createElement('div');
        t.className = `toast ${type}`;

        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = type === 'success' ? "<i class='bx bx-check'></i>" : type === 'error' ? "<i class='bx bx-x'></i>" : "<i class='bx bx-info-circle'></i>";

        const msg = document.createElement('div');
        msg.className = 'toast-msg';
        msg.innerText = message;

        t.appendChild(icon);
        t.appendChild(msg);
        container.appendChild(t);

        // force reflow then show
        void t.offsetWidth;
        t.classList.add('show');

        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => { try { container.removeChild(t); } catch(e){} }, 300);
        }, duration);
    } catch (e) { console.warn('showToast error', e); }
}

/* ==========================================================================
   2. INTERFAZ DE USUARIO Y ANIMACIONES (UI)
   ========================================================================== */

// --- DETECTAR HASH (LINK DIRECTO) ---
if (window.location.hash === '#register') {
    container.classList.add('active');
}

// --- TOGGLE LOGIN/REGISTRO ---
function clearInputs() {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    const checkTerms = document.getElementById('checkTerms');
    if(checkTerms) checkTerms.checked = false;
    // Reset rules UI
    resetPasswordRules();
}

// Reset password rules UI
function resetPasswordRules() {
    const rules = document.querySelectorAll('.password-rules .rule');
    rules.forEach(r => {
        r.classList.remove('valid');
        r.classList.remove('invalid');
        const mark = r.querySelector('.mark');
        if (mark) mark.className = 'bx bx-x mark';
    });
    const err = document.querySelector('.password-error');
    if (err) err.classList.remove('show');
}

if(registerBtn) registerBtn.addEventListener('click', () => { container.classList.add('active'); clearInputs(); });
if(loginBtn) loginBtn.addEventListener('click', () => { container.classList.remove('active'); clearInputs(); });

// --- ANIMACIÓN DE FONDO (BILLETERAS) ---
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
    
    if (isInitial) wallet.style.animationDelay = -(Math.random() * duration) + 's';
    else wallet.style.animationDelay = '0s';
    
    wallet.style.opacity = Math.random() * 0.4 + 0.1;
    snowflakesContainer.appendChild(wallet);
    setTimeout(() => { wallet.remove(); }, duration * 1000);
}

for (let i = 0; i < 40; i++) createWallet(true);
function startLoop() { createWallet(false); setTimeout(startLoop, Math.random() * 800 + 400); }
startLoop();

// --- MODAL TÉRMINOS ---
const modalTerms = document.getElementById('modal-terms');
const btnOpenTerms = document.getElementById('btn-open-terms');
const btnCloseTerms = document.getElementById('btn-close-terms');
const btnAcceptTerms = document.getElementById('btn-accept-terms');
const checkTerms = document.getElementById('checkTerms');

const toggleModalTerms = (show) => { if(modalTerms) modalTerms.classList.toggle('active', show); };

if (btnOpenTerms) btnOpenTerms.onclick = () => toggleModalTerms(true);
if (btnCloseTerms) btnCloseTerms.onclick = () => toggleModalTerms(false);
if (btnAcceptTerms) btnAcceptTerms.onclick = () => { toggleModalTerms(false); if (checkTerms) checkTerms.checked = true; };
if (modalTerms) modalTerms.onclick = (e) => { if (e.target === modalTerms) toggleModalTerms(false); };

// --- DESCARGA PDF ---
const btnDownload = document.getElementById('btn-download-pdf');
if (btnDownload) {
    btnDownload.onclick = () => {
        const originalText = btnDownload.innerHTML;
        btnDownload.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Descargando...";
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = '../../Assets/PDF/Terminos_Credora.pdf.pdf'; 
            link.download = 'Terminos_y_Condiciones_Credora.pdf';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            btnDownload.innerHTML = originalText;
        }, 1000);
    };
}

/* ==========================================================================
   3. LÓGICA DE NEGOCIO (CONEXIÓN AL BACKEND)
   ========================================================================== */

// --- A. INICIAR SESIÓN (CON REDIRECCIÓN POR ROL) ---
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const btn = formLogin.querySelector('button');
        const txtOriginal = btn.innerText;

        btn.innerText = "Verificando..."; btn.disabled = true;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', pass);

            const res = await fetch(`${API_BASE}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // 1. Guardar el token
                localStorage.setItem('credora_token', data.access_token);
                
                // 2. Redirección Inteligente según el ROL
                // Nota: Asegúrate de haber creado la carpeta Admin
                if (data.rol === 'admin') {
                    console.log("👑 Acceso concedido: Administrador");
                    window.location.href = "../Admin/AdminDashboard.html";
                } else {
                    console.log("👤 Acceso concedido: Cliente");
                    window.location.href = "../Main/Dashboard.html";
                }

            } else {
                showToast("❌ " + (data.detail || "Credenciales incorrectas"), 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("Error de conexión con el servidor.", 'error');
        } finally {
            btn.innerText = txtOriginal; btn.disabled = false;
        }
    });
}

// --- B. REGISTRO DE USUARIO (SOLUCIÓN DEL PROBLEMA) ---
const formRegister = document.getElementById('formRegister');
if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('regNombre').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPass').value;
        const confirmPass = document.getElementById('regConfirmPass').value;
        const terms = document.getElementById('checkTerms').checked;
        const btn = formRegister.querySelector('button');

        if (pass !== confirmPass) { showToast("Las contraseñas no coinciden.", 'error'); return; }
        // Validar reglas de contraseña
        const rulesOk = validatePasswordRules(pass);
        if (!rulesOk) {
            const errEl = document.querySelector('.password-error') || createPasswordError();
            errEl.classList.add('show');
            errEl.textContent = 'Tu contraseña debe cumplir las reglas indicadas.';
            return;
        }
        if (!terms) { showToast("Acepta los términos para continuar.", 'info'); return; }

        btn.innerText = "Procesando..."; btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_completo: nombre, correo: email, contrasena: pass })
            });

            const data = await res.json();

            if (res.ok) {
                // ----------------------------------------------------
                // AQUÍ ESTABA EL ERROR ANTES: NO HACEMOS LOGIN AUTOMÁTICO
                // ----------------------------------------------------
                console.log("✅ Usuario creado. Esperando verificación.");
                
                // 1. Guardar correo temporalmente
                localStorage.setItem('temp_email', email);

                // 2. Mostrar Modal de Verificación
                const modalVerify = document.getElementById('modal-verify');
                if (modalVerify) {
                    modalVerify.style.display = 'flex';
                    modalVerify.style.zIndex = '10000'; // Asegurar que esté encima
                    container.style.filter = 'blur(5px)'; // Efecto visual
                }

                formRegister.reset(); // Limpiar formulario
                resetPasswordRules();
            } else {
                showToast("⚠️ " + (data.detail || "Error al registrarse."), 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("Error de conexión con el servidor.", 'error');
        } finally {
            btn.innerText = "Registrarse"; btn.disabled = false;
        }
    });
}

// ---------------- Password rules logic ----------------
const regPassInput = document.getElementById('regPass');
const passwordRulesEl = document.getElementById('passwordRules');
if (regPassInput && passwordRulesEl) {
    regPassInput.addEventListener('input', () => {
        const val = regPassInput.value;
        updateRule('length', /.{8,}/);
        updateRule('case', /(?=.*[a-z])(?=.*[A-Z])/);
        updateRule('number', /(?=.*\d)/);
        updateRule('special', /(?=.*[!@#\$%\^&\*\(\)_\+\-\=\[\]{};:'"\\|,.<>\/?`~])/);
    });
}

function updateRule(name, regex) {
    const ruleEl = document.querySelector(`.password-rules .rule[data-rule="${name}"]`);
    if (!ruleEl) return false;
    const val = regPassInput.value || '';
    if (regex.test(val)) {
        ruleEl.classList.add('valid');
        ruleEl.classList.remove('invalid');
        ruleEl.querySelector('.mark').className = 'bx bxs-check-square mark';
        return true;
    } else {
        ruleEl.classList.remove('valid');
        ruleEl.classList.add('invalid');
        ruleEl.querySelector('.mark').className = 'bx bx-x mark';
        return false;
    }
}

function validatePasswordRules(value) {
    if (!value) return false;
    const lenOk = /.{8,}/.test(value);
    const caseOk = /(?=.*[a-z])(?=.*[A-Z])/.test(value);
    const numOk = /(?=.*\d)/.test(value);
    const specOk = /(?=.*[!@#\$%\^&\*\(\)_\+\-\=\[\]{};:'"\\|,.<>\/?`~])/.test(value);
    return lenOk && caseOk && numOk && specOk;
}

function createPasswordError() {
    const el = document.createElement('div');
    el.className = 'password-error';
    const form = document.getElementById('formRegister');
    if (form) form.appendChild(el);
    return el;
}

// --- C. VERIFICAR CÓDIGO (BOTÓN DEL MODAL) ---
const btnVerifyAction = document.getElementById('btn-verify-action');
if (btnVerifyAction) {
    btnVerifyAction.addEventListener('click', async () => {
        const email = localStorage.getItem('temp_email');
        const code = document.getElementById('verify-code').value.trim();

        if(!code || code.length !== 6) { showToast("Ingresa el código de 6 dígitos.", 'info'); return; }

        btnVerifyAction.innerText = "Validando..."; btnVerifyAction.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/verificar-cuenta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, codigo: code })
            });

            if (res.ok) {
                showToast("✅ ¡Cuenta verificada!\nAhora puedes iniciar sesión.", 'success');
                window.location.reload(); // Recargar para ir al login limpio
            } else {
                const data = await res.json();
                showToast("❌ " + (data.detail || "Código inválido."), 'error');
                btnVerifyAction.innerText = "Verificar"; btnVerifyAction.disabled = false;
            }
        } catch (e) {
            showToast("Error de conexión.", 'error');
            btnVerifyAction.innerText = "Verificar"; btnVerifyAction.disabled = false;
        }
    });
}

// --- D. RECUPERACIÓN DE CONTRASEÑA ---
const modalRecover = document.getElementById('modal-recover');
const linkForgot = document.querySelector('.forgot_link a'); // <--- Esto busca el enlace

if (linkForgot && modalRecover) {
    linkForgot.onclick = (e) => {
        e.preventDefault();
        console.log("🔓 Abriendo recuperación de contraseña..."); // Agrega este log para depurar
        modalRecover.classList.add('active');
        container.style.filter = 'blur(4px)';
    };
}

// Paso 1: Enviar Código
const btnSendCode = document.getElementById('btn-send-code');
if (btnSendCode) {
    btnSendCode.onclick = async () => {
        const email = document.getElementById('recover-email').value.trim();
        if(!email) return showToast("Ingresa tu correo.", 'info');

        localStorage.setItem('recover_email', email);
        btnSendCode.innerText = "Enviando..."; btnSendCode.disabled = true;

        try {
            await fetch(`${API_BASE}/solicitar-recuperacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email })
            });
            
            document.getElementById('recover-step-1').style.display = 'none';
            document.getElementById('recover-step-2').style.display = 'block';
            showToast("Revisa tu correo para ver el código.", 'info');
        } catch (e) { showToast("Error de conexión.", 'error'); }
        finally { btnSendCode.innerText = "Enviar Código"; btnSendCode.disabled = false; }
    };
}

// Paso 2: Cambiar Clave
const btnResetPass = document.getElementById('btn-reset-pass');
if (btnResetPass) {
    btnResetPass.onclick = async () => {
        const email = localStorage.getItem('recover_email');
        const code = document.getElementById('recover-code').value.trim();
        const newPass = document.getElementById('recover-new-pass').value.trim();

        if(!code || !newPass) return showToast("Completa todos los campos.", 'info');

        btnResetPass.innerText = "Procesando..."; btnResetPass.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/restablecer-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, codigo: code, nueva_password: newPass })
            });

            if (res.ok) {
                showToast("✅ Contraseña actualizada. Inicia sesión.", 'success');
                window.location.reload();
            } else {
                showToast("❌ Código incorrecto.", 'error');
                btnResetPass.innerText = "Cambiar Contraseña"; btnResetPass.disabled = false;
            }
        } catch (e) { showToast("Error de conexión.", 'error'); }
    };
}

// Close modal listeners (for any modal using data-close)
document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-close');
        const m = document.getElementById(id);
        if (m) {
            m.classList.remove('active');
            container.style.filter = '';
        }
    });
});

// Clicking outside modal-body should close recover modal
if (modalRecover) {
    modalRecover.addEventListener('click', (e) => {
        if (e.target === modalRecover) {
            modalRecover.classList.remove('active');
            container.style.filter = '';
        }
    });
}

// Ensure rules cleared initially
resetPasswordRules();