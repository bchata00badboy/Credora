/* /Front-end/Src/Pages/Main/js/api.js */

const API_BASE = "http://localhost:8000/api/v1"; // Ajusta el puerto si es necesario

const api = {
    // Función genérica para peticiones autenticadas
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('credora_token');
        
        if (!token) {
            console.warn("No hay token, redirigiendo a login...");
            window.location.href = "../login/login.html";
            return null;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            
            if (response.status === 401) {
                alert("Tu sesión ha expirado.");
                localStorage.removeItem('credora_token');
                window.location.href = "../login/login.html";
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error en el servidor");
            }

            return await response.json();
        } catch (error) {
            console.error(`Error API [${endpoint}]:`, error);
            throw error;
        }
    }
};

// Exponer globalmente
window.CredoraAPI = api;