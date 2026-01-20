// ==========================================
// 1. CONFIGURACIÓN Y BASE DE CONOCIMIENTO
// ==========================================
const chatConfig = {
    botName: "Credo Bot",
    typingDelay: 600, 
    responseDelay: 1200 
};

// Base de conocimiento EXPANDIDA con los temas de los módulos
const knowledgeBase = [
    // --- SALUDOS Y GENERAL ---
    {
        keywords: ["hola", "buenos", "buenas", "inicio", "ayuda"],
        response: `¡Hola! 👋 Soy ${chatConfig.botName}. Puedo ayudarte con: <br>• 📉 <b>Presupuestos</b> (Regla 50/30/20)<br>• 💰 <b>Estrategias de Ahorro</b><br>• 🚫 <b>Salir de Deudas</b><br>• 📈 <b>Inversiones</b><br>• 🛡️ <b>Ciberseguridad</b>`
    },
    
    // --- PRESUPUESTO ---
    {
        keywords: ["presupuesto", "50/30/20", "regla", "organizar dinero"],
        response: "La <b>Regla 50/30/20</b> es el estándar de oro: <br>🏠 <b>50% Necesidades:</b> Renta, comida, servicios.<br>🍿 <b>30% Deseos:</b> Salidas, hobbies.<br>🐷 <b>20% Objetivos:</b> Ahorro, inversión y pago de deudas."
    },
    {
        keywords: ["necesidad", "deseo", "diferencia"],
        response: "Es fácil confundirlos. <b>Necesidad</b> es algo indispensable para vivir (agua, techo). <b>Deseo</b> es algo que mejora tu vida pero podrías posponer (café de marca, Netflix, Uber)."
    },

    // --- AHORRO ---
    {
        keywords: ["ahorro", "ahorrar", "tips de ahorro", "guardar dinero"],
        response: "El mejor método es <b>'Págate a ti primero'</b>: programa una transferencia automática a tu ahorro apenas recibas tu sueldo, antes de empezar a gastar. 💸"
    },
    {
        keywords: ["fondo", "emergencia", "imprevisto"],
        response: "Un <b>Fondo de Emergencia</b> es tu colchón de seguridad. Debería cubrir de 3 a 6 meses de tus gastos básicos para protegerte de despidos o enfermedades."
    },
    {
        keywords: ["gastos hormiga", "hormiga", "cafe", "snack"],
        response: "¡Cuidado con las hormigas! 🐜 El café diario o las propinas excesivas pueden comerse hasta el <b>15% de tu sueldo</b>. Identifícalos y redúcelos."
    },

    // --- DEUDAS ---
    {
        keywords: ["deuda", "debo", "pagar", "salir de deudas"],
        response: "Para salir de deudas existen dos métodos reyes:<br>❄️ <b>Bola de Nieve:</b> Paga la más pequeña primero para motivarte.<br>🏔️ <b>Avalancha:</b> Paga la de mayor interés primero para ahorrar dinero a largo plazo."
    },
    {
        keywords: ["deuda buena", "deuda mala"],
        response: "No todas son iguales. La <b>Deuda Buena</b> (hipoteca, estudios) te genera valor a futuro. La <b>Deuda Mala</b> (tarjeta de crédito por ropa o viajes) te empobrece con intereses."
    },

    // --- INVERSIÓN ---
    {
        keywords: ["inversion", "invertir", "rendimiento", "crecer"],
        response: "Ahorrar suma, pero invertir multiplica. 🚀 Aprovecha el <b>Interés Compuesto</b> y recuerda diversificar: 'No pongas todos los huevos en la misma canasta'."
    },
    {
        keywords: ["riesgo", "instrumentos", "bolsa"],
        response: "Depende de tu perfil:<br>🟢 <b>Bajo Riesgo:</b> Deuda gubernamental (Bonos).<br>🟡 <b>Medio:</b> Bienes Raíces.<br>🔴 <b>Alto:</b> Acciones o Criptomonedas."
    },

    // --- SEGURIDAD ---
    {
        keywords: ["seguridad", "estafa", "phishing", "hackear", "robo"],
        response: "Protege tu dinero digital: <br>1. Activa el <b>2FA</b> (Doble factor).<br>2. No uses la misma contraseña en todo.<br>3. Nunca des claves por teléfono (Vishing)."
    },

    // --- IMPUESTOS ---
    {
        keywords: ["impuesto", "iva", "isr", "deducir", "factura"],
        response: "Pagar impuestos es obligatorio, pero puedes optimizarlo. Pide <b>factura</b> de gastos médicos, educativos o aportes al retiro para deducirlos y pagar menos legalmente."
    }
];

const defaultResponse = "<p>Mmm, no estoy seguro de entender eso. 🤔 Prueba preguntándome sobre <b>la regla 50/30/20</b>, <b>cómo salir de deudas</b> o <b>tips de seguridad</b>.</p>";

// ==========================================
// 2. LÓGICA DEL DOM Y VARIABLES
// ==========================================
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("aiInput");
const sendBtn = document.getElementById("send-btn");

let userMessage = null;

// ==========================================
// 3. MOTOR DE INTELIGENCIA (LÓGICA)
// ==========================================

// Función para normalizar texto (quita acentos y pone minúsculas)
const normalizeText = (text) => {
    return text.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
                .replace(/[^\w\s]/gi, ""); // Quita caracteres especiales
};

// Algoritmo de búsqueda de respuesta
const findBestMatch = (input) => {
    const cleanInput = normalizeText(input);
    
    // Busca la primera coincidencia en la base de conocimientos
    const match = knowledgeBase.find(entry => {
        return entry.keywords.some(keyword => cleanInput.includes(keyword));
    });

    return match ? `<p>${match.response}</p>` : defaultResponse;
};

// ==========================================
// 4. MANEJO DE INTERFAZ (UI)
// ==========================================

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" 
        ? `<div class="msg-content"><p>${message}</p></div>` 
        : `<div class="msg-content">${message}</div>`; // Incoming permite HTML
    chatLi.innerHTML = chatContent;
    return chatLi;
}

const generateResponse = async () => {
    const typingLi = document.querySelector(".incoming.typing");
    if(typingLi) typingLi.remove();

    const responseHTML = findBestMatch(userMessage);

    chatBox.appendChild(createChatLi(responseHTML, "incoming"));
    chatBox.scrollTo(0, chatBox.scrollHeight);
}

const enviarMensajeIA = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;

    // Mostrar mensaje del usuario
    chatBox.appendChild(createChatLi(userMessage, "outgoing"));
    chatBox.scrollTo(0, chatBox.scrollHeight);
    chatInput.value = "";

    // Simular "Escribiendo..."
    setTimeout(() => {
        const loadingDots = `
            <div class="typing-animation">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>`;
        const typingLi = createChatLi(loadingDots, "incoming");
        typingLi.classList.add("typing");
        chatBox.appendChild(typingLi);
        chatBox.scrollTo(0, chatBox.scrollHeight);
        
        // Generar respuesta
        setTimeout(generateResponse, chatConfig.responseDelay); 
    }, chatConfig.typingDelay);
}

// Función global para los botones de sugerencias (chips)
window.preguntarIA = function(texto) {
    chatInput.value = texto;
    enviarMensajeIA();
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================

const toggleChatbot = (forceOpen) => {
    const isOpen = document.body.classList.contains("show-chatbot");
    const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
    document.body.classList.toggle("show-chatbot", willOpen);
    
    if(willOpen) {
        setTimeout(() => chatInput.focus(), 150);
    }
}

if (sendBtn) sendBtn.addEventListener("click", enviarMensajeIA);
if (closeBtn) closeBtn.addEventListener("click", () => toggleChatbot(false));
if (chatbotToggler) chatbotToggler.addEventListener("click", () => toggleChatbot(true));

if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
        if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
            e.preventDefault();
            enviarMensajeIA();
        }
    });
}