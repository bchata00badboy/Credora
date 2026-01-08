const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("aiInput");
const sendBtn = document.getElementById("send-btn");

let userMessage = null;

// Crear elemento de lista (li) para el chat
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    // Si es "incoming" (del bot) y el mensaje contiene los puntos, inyectamos HTML, si no, texto normal
    let chatContent = className === "outgoing" 
        ? `<div class="msg-content"><p>${message}</p></div>` 
        : `<div class="msg-content">${message}</div>`; // Quitamos <p> para permitir HTML (la animación)
    chatLi.innerHTML = chatContent;
    return chatLi;
}

// Generar respuesta del Bot
const generateResponse = () => {
    const typingLi = document.querySelector(".incoming.typing");
    if(typingLi) typingLi.remove();

    let botResponse = "<p>No estoy seguro. Pregúntame sobre Ahorro o Inversión.</p>";
    const inputLower = userMessage.toLowerCase();

    if (inputLower.includes("ahorro")) {
        botResponse = "<p>Te sugiero guardar primero 3 meses de gastos como Fondo de Emergencia. 💰</p>";
    } else if (inputLower.includes("50/30/20")) {
        botResponse = "<p>Regla 50/30/20: 50% Gastos fijos, 30% Gustos, 20% Ahorro. 📊</p>";
    } else if (inputLower.includes("gastos")) {
        botResponse = "<p>Cuidado con los gastos hormiga, pueden ser el 15% de tu sueldo. 🐜</p>";
    } else if (inputLower.includes("hola")) {
        botResponse = "<p>¡Hola! 👋 Soy Credo Bot. ¿En qué te ayudo?</p>";
    }

    chatBox.appendChild(createChatLi(botResponse, "incoming"));
    chatBox.scrollTo(0, chatBox.scrollHeight);
}

// Manejar envío de mensaje
const enviarMensajeIA = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;

    // 1. Mostrar mensaje del usuario
    chatBox.appendChild(createChatLi(userMessage, "outgoing"));
    chatBox.scrollTo(0, chatBox.scrollHeight);
    chatInput.value = "";

    // 2. Mostrar animación de "Escribiendo..." (Tres puntos)
    setTimeout(() => {
        // Código HTML de la animación
        const loadingDots = `
            <div class="typing-animation">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        
        const typingLi = createChatLi(loadingDots, "incoming");
        typingLi.classList.add("typing"); // Clase para identificarlo y borrarlo luego
        chatBox.appendChild(typingLi);
        chatBox.scrollTo(0, chatBox.scrollHeight);
        
        // 3. Responder después de un tiempo
        setTimeout(generateResponse, 1200); 
    }, 600);
}

const preguntarIA = (texto) => {
    chatInput.value = texto;
    enviarMensajeIA();
}

// TOGGLE: controlar estado abierto/cerrado
const toggleChatbot = (forceOpen) => {
    const isOpen = document.body.classList.contains("show-chatbot");
    const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
    document.body.classList.toggle("show-chatbot", willOpen);
    if(willOpen) {
        setTimeout(() => chatInput.focus(), 150);
    } else {
        const toggler = document.getElementById('chatbot-toggler');
        if(toggler) toggler.focus();
    }
}

sendBtn.addEventListener("click", enviarMensajeIA);
if (closeBtn) closeBtn.addEventListener("click", () => toggleChatbot(false));
if (chatbotToggler) chatbotToggler.addEventListener("click", () => toggleChatbot(true));

chatInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        enviarMensajeIA();
    }
});