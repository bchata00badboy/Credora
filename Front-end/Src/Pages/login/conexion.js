// Ajustamos la URL base para apuntar a la API correcta
// /Front-end/Src/Pages/login/conexion.js   

const API_URL = "http://localhost:8000/api/v1"; 

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DE LOGIN ---
    const formLogin = document.getElementById('formLogin');
    
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue
            
            const correo = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPass').value;
            
            // Feedback visual básico (opcional)
            const btn = formLogin.querySelector('button');
            const textoOriginal = btn.innerText;
            btn.innerText = "Verificando...";
            btn.disabled = true;

            await realizarLogin(correo, pass, btn, textoOriginal);
        });
    }

    // --- 2. LÓGICA DE REGISTRO ---
    const formRegister = document.getElementById('formRegister');
    
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('regNombre').value;
            const correo = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;

            // Estructura que espera tu Backend (UserCreate)
            const datosUsuario = {
                nombre_completo: nombre,
                email: correo,      // Ojo: verifica si tu backend espera "email" o "correo"
                password: pass      // Ojo: verifica si tu backend espera "password" o "contrasena"
            };

            try {
                // Ajusta la ruta "/users/" si tu backend usa otra ruta para crear usuarios
                const respuesta = await fetch(`${API_URL}/users/`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosUsuario)
                });

                if (respuesta.ok) {
                    alert("¡Cuenta creada con éxito! Iniciando sesión automáticamente...");
                    // Auto-login después de registrarse
                    await realizarLogin(correo, pass);
                } else {
                    const error = await respuesta.json();
                    alert("Error en el registro: " + (error.detail || "Verifique los datos"));
                }
            } catch (err) {
                console.error("Error de conexión:", err);
                alert("No se pudo conectar con el servidor.");
            }
        });
    }
});

/**
 * Función centralizada para Login
 */
async function realizarLogin(correo, password, btn = null, textoOriginal = "") {
    // FastAPI OAuth2 espera los datos como Form Data, no JSON
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
            
            // 1. Guardar token
            localStorage.setItem('credora_token', data.access_token);
            
            console.log("Login exitoso. Token guardado:", data.access_token);

            // 2. Redirigir al Dashboard
            // Ajusta los "../" según tu estructura de carpetas real
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
        alert("Error de conexión. Revisa que el backend esté encendido.");
        if(btn) {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    }
}