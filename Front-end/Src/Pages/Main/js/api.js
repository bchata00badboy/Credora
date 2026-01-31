/* /Front-end/Src/Pages/Main/js/api.js */

// CORRECCIÓN: Usar 127.0.0.1 para evitar conflictos de cookies/CORS con localhost
const API_BASE = "http://127.0.0.1:8000/api/v1"; 

const api = {
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('credora_token');
        
        // Manejo de rutas públicas (si las tuvieras)
        // if (!token && !endpoint.includes('login')) { ... }

        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            // Log para ver qué URL exacta estamos llamando
            console.log(`📡 Petición: ${method} ${API_BASE}${endpoint}`);
            
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            
            if (response.status === 401) {
                console.warn("Sesión expirada");
                // localStorage.removeItem('credora_token'); // Opcional: limpiar token
                // window.location.href = "../Login/login.html"; 
                return null;
            }

            if (!response.ok) {
                // Intentamos leer el error JSON, si falla usamos statusText
                const errorText = await response.text();
                let errorJson;
                try { errorJson = JSON.parse(errorText); } catch(e) {}
                
                throw new Error((errorJson && errorJson.detail) || `Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ Error API [${endpoint}]:`, error);
            // No relanzamos el error para no romper todo el script, devolvemos null
            return null; 
        }
    }
};

window.CredoraAPI = api;