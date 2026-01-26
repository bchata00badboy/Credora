// /Front-end/Src/Pages/login/conexion.js   

// Apuntamos al prefijo /api/v1 definido en tu main.py
const API_URL = "http://localhost:8000/api/v1"; 

document.addEventListener('DOMContentLoaded', () => {
    
    // ===========================
    // 1. LÓGICA DE REGISTRO
    // ===========================
    const formRegister = document.getElementById('formRegister');
    
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Obtenemos los valores de los inputs nuevos
            const nombre = document.getElementById('regNombre').value;
            const correo = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;
            const passConfirm = document.getElementById('regConfirmPass').value; // Nuevo campo
            const btn = formRegister.querySelector('button');
            const textoOriginal = btn.innerText;

            // VALIDACIÓN EXTRA: ¿Coinciden las contraseñas?
            if (pass !== passConfirm) {
                alert("❌ Las contraseñas no coinciden.");
                return;
            }

            // Feedback visual
            btn.innerText = "Registrando...";
            btn.disabled = true;

            const datosUsuario = {
                nombre_completo: nombre,
                correo: correo,      
                contrasena: pass      
            };

            try {
                const respuesta = await fetch(`${API_URL}/auth/registro`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosUsuario)
                });

                if (respuesta.ok) {
                    alert("✅ ¡Cuenta creada con éxito! Iniciando sesión...");
                    // Auto-login tras registro
                    await realizarLogin(correo, pass);
                } else {
                    const error = await respuesta.json();
                    alert("Error en el registro: " + (error.detail || "Verifique los datos"));
                    btn.innerText = textoOriginal;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error("Error de conexión:", err);
                alert("No se pudo conectar con el servidor.");
                btn.innerText = textoOriginal;
                btn.disabled = false;
            }
        });
    }

    // ===========================
    // 2. LÓGICA DE LOGIN
    // ===========================
    const formLogin = document.getElementById('formLogin');
    
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const correo = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPass').value;
            const btn = formLogin.querySelector('button');
            const textoOriginal = btn.innerText;

            btn.innerText = "Verificando...";
            btn.disabled = true;

            await realizarLogin(correo, pass, btn, textoOriginal);
        });
    }
});

/**
 * Función centralizada para Autenticación
 */
async function realizarLogin(correo, password, btn = null, textoOriginal = "Iniciar Sesión") {
    
    const formData = new URLSearchParams();
    formData.append('username', correo); 
    formData.append('password', password);

    try {
        const respuesta = await fetch(`${API_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        if (respuesta.ok) {
            const data = await respuesta.json();
            
            // Guardar token
            localStorage.setItem('credora_token', data.access_token);
            
            console.log("Login exitoso. Token:", data.access_token);

            // Redirigir al Dashboard
            window.location.href = "../Main/Dashboard.html"; 
        } else {
            const errorData = await respuesta.json();
            alert("Error: " + (errorData.detail || "Credenciales incorrectas"));
            if(btn) {
                btn.innerText = textoOriginal;
                btn.disabled = false;
            }
        }
    } catch (err) {
        console.error("Error de login:", err);
        alert("Error de conexión. Asegúrate de que el Backend esté corriendo.");
        if(btn) {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    }
}