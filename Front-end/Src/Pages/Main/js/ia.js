// /Front-end/Src/Pages/Main/js/ia.js

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. CONFIGURACIÓN
    // ==========================================
    const chatConfig = {
        botName: "Nelly",
        typingDelay: 800,
        responseDelay: 1500
    };

    // ==========================================
    // 2. ELEMENTOS DEL DOM (Validación de Seguridad)
    // ==========================================
    const chatbotToggler = document.querySelector(".chatbot-toggler");
    const closeBtn = document.querySelector(".close-btn");
    const chatBox = document.getElementById("chatBox");
    const suggestionsBar = document.querySelector(".suggestions-bar"); 

    if (!chatBox || !suggestionsBar) {
        console.error("⚠️ Error: Faltan elementos en el HTML. Verifica #chatBox y .suggestions-bar");
        return;
    }

    let userMessage = null;
    let userSection = null;

    // ==========================================
    // 3. BASE DE DATOS: TIPS (SOLO FINANCIEROS)
    // ==========================================
    const tipsDatabase = [
        { cat: "Finanzas", text: "La <b>inflación</b> es el enemigo silencioso. Si guardas dinero bajo el colchón, cada año compras menos. ¡Busca cuentas con rendimiento!" },
        { cat: "Finanzas", text: "Aplica la <b>Regla de las 24 horas</b>: Si ves algo que quieres comprar impulsivamente, espera un día. El 80% de las veces, el deseo se irá." },
        { cat: "Finanzas", text: "El <b>Interés Compuesto</b> es clave. Invertir $50 al mes desde los 20 años genera mucho más que $200 al mes desde los 40." },
        { cat: "Finanzas", text: "No ahorres lo que sobra después de gastar; gasta lo que sobra después de ahorrar." },
        { cat: "Finanzas", text: "Revisa tus <b>suscripciones</b>: Netflix, Spotify, Gym. ¿Realmente las usas todas? Cancelar una es ahorro inmediato." },
        { cat: "Finanzas", text: "Un <b>Fondo de Emergencia</b> debe cubrir 3 meses de gastos. Es tu blindaje contra imprevistos." },
        { cat: "Finanzas", text: "Nunca inviertas en algo que no entiendes. Si no puedes explicarlo en 1 minuto, no pongas tu dinero ahí." },
        { cat: "Finanzas", text: "Diferencia entre <b>Precio</b> y <b>Valor</b>. Precio es lo que pagas, valor es lo que obtienes." },
        { cat: "Finanzas", text: "Usa la tarjeta de crédito como medio de pago, no como dinero extra. Págala total cada mes." },
        { cat: "Finanzas", text: "El <b>Latte Factor</b>: Un gasto hormiga de $3 diarios son $1,000 al año. ¿Qué harías con ese dinero?" },
        { cat: "Finanzas", text: "Diversifica: 'No pongas todos los huevos en la misma canasta'. Mezcla inversiones seguras con variables." },
        { cat: "Finanzas", text: "Evita la <b>inflación de estilo de vida</b>. Si ganas más, no gastes más inmediatamente." },
        { cat: "Finanzas", text: "En el súper, mira el precio por unidad (litro/kilo), no el precio final del paquete." },
        { cat: "Finanzas", text: "Presupuesto Base Cero: Asigna una función a cada centavo antes de que empiece el mes." },
        { cat: "Finanzas", text: "Automatiza: Configura transferencias automáticas a tu ahorro el día que cobras." },
        { cat: "Finanzas", text: "Invierte en ti: Cursos y libros aumentan tu capacidad de ganar dinero. Es la mejor inversión." },
        { cat: "Finanzas", text: "Planifica tus comidas. Comer fuera por desorganización es una fuga de dinero enorme." },
        { cat: "Finanzas", text: "Establece metas SMART: Específicas, Medibles, Alcanzables, Relevantes y con Tiempo." }
    ];

    // ==========================================
    // 4. BASE DE CONOCIMIENTO (RESPUESTAS EXTENDIDAS)
    // ==========================================
    const knowledgeBase = [
        // --- SALUDOS ---
        {
            section: "general",
            keywords: ["hola", "buenos", "buenas", "inicio", "ayuda", "menu"],
            response: `
                <p>¡Hola! 👋 Soy <b>${chatConfig.botName}</b>, tu asistente financiera y guía de Credora.</p>
                <p style="margin-top: 10px;">Mi objetivo es doble: ayudarte a que tu dinero crezca 📈 y enseñarte a usar nuestra app como un experto 📱.</p>
                <p style="margin-top: 10px;">👇 <b>Por favor, selecciona una opción del menú para comenzar:</b></p>`
        },

        // ---------------------------------------------------------
        // SECCIÓN: EDUCACIÓN FINANCIERA
        // ---------------------------------------------------------
        {
            section: "educativa",
            keywords: ["presupuesto", "50/30/20", "regla"],
            response: `
                <p>La <b>Regla 50/30/20</b> es el sistema más equilibrado para administrar tus ingresos netos. Aquí el detalle:</p>
                <ul style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>🏠 <b>50% Necesidades (Obligatorio):</b> Renta, servicios, comida básica y transporte. <i>Error común:</i> Incluir aquí suscripciones o salidas.</li>
                    <li>🍿 <b>30% Deseos (Flexible):</b> Salidas, hobbies, ropa de moda. Es dinero libre de culpa.</li>
                    <li>🚀 <b>20% Objetivos (Tu "Yo" del futuro):</b> Ahorro de emergencia, Inversiones y Pago extra a deudas.</li>
                </ul>
                <p style="margin-top:10px;"><i>💡 Ejemplo: Si ganas $1,000, deberías vivir con $500, disfrutar $300 y ahorrar obligatoriamente $200.</i></p>`
        },
        {
            section: "educativa",
            keywords: ["ahorro", "ahorrar", "tips"],
            response: `
                <p>El secreto de los millonarios no es cuánto ganan, sino cómo ahorran. Aquí tienes 3 pilares:</p>
                <ul style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>1️⃣ <b>Págate a ti primero:</b> El error #1 es ahorrar "lo que sobra". Debes apartar el ahorro <b>apenas</b> recibas el sueldo.</li>
                    <li>2️⃣ <b>Hazlo Invisible:</b> Configura una transferencia automática a una cuenta separada (ojalá en otro banco) sin tarjeta de débito fácil de usar.</li>
                    <li>3️⃣ <b>Metas con Nombre:</b> El cerebro no ahorra para "el futuro". Ahorra para "Viaje a Europa" o "Comprar PC". Ponle nombre a tu dinero.</li>
                </ul>`
        },
        {
            section: "educativa",
            keywords: ["deuda", "salir de deudas"],
            response: `
                <p>Las deudas tienen un costo financiero y uno emocional. Te recomiendo el <b>Método Bola de Nieve</b>:</p>
                <ol style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>Enlista tus deudas de <b>menor a mayor saldo</b> (ignora los intereses por un momento).</li>
                    <li>Paga el mínimo obligatorio de todas para no dañar tu historial.</li>
                    <li>Consigue dinero extra y ataca con furia la <b>deuda más pequeña</b>.</li>
                    <li>Al liquidarla, toma ese dinero que ya no pagas y súmalo al pago de la siguiente deuda.</li>
                </ol>
                <p style="margin-top:8px;"><i>✨ El efecto psicológico de ver desaparecer deudas pequeñas te dará impulso para acabar con las grandes.</i></p>`
        },
        {
            section: "educativa",
            keywords: ["inversion", "invertir", "rendimiento"],
            response: `
                <p>Invertir es la única defensa contra la inflación. Antes de empezar, chequea esto:</p>
                <ul style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>🛡️ <b>Paso 0: Fondo de Emergencia.</b> Ten de 3 a 6 meses de gastos en una cuenta líquida. Esto evita que tengas que malvender inversiones si pasa algo malo.</li>
                    <li>🎯 <b>Define tu Plazo:</b> ¿Necesitas el dinero en 1 año? Usa Renta Fija (Bonos/Cetes). ¿En 10 años? Considera Acciones o ETFs.</li>
                    <li>🚫 <b>Alerta:</b> Si te ofrecen rendimientos "garantizados" y muy altos en poco tiempo, huye. Probablemente sea una estafa.</li>
                </ul>`
        },

        // ---------------------------------------------------------
        // SECCIÓN: APP SOPORTE (Actualizada)
        // ---------------------------------------------------------
        
        // --- KYC (CORREGIDO: Solo Foto) ---
        {
            section: "kyc",
            keywords: ["kyc", "verificar", "documentos", "identidad", "cedula", "foto"],
            response: `
                <p><b>Verificación de Identidad (KYC)</b></p>
                <p>Hemos hecho este proceso lo más simple posible. No tienes que llenar formularios largos.</p>
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin:10px 0;">
                    <p>📸 <b>Único Requisito:</b></p>
                    <ul style="margin-left: 20px;">
                        <li>Subir una <b>foto legible</b> de tu Cédula de Identidad.</li>
                    </ul>
                </div>
                <p>Ve a <b>Perfil > Verificación</b> y carga la imagen. Nuestro sistema extraerá tus datos automáticamente.</p>`
        },

        // --- Transferencias ---
        {
            section: "billetera",
            keywords: ["transferir", "enviar dinero", "envio", "transferencia"],
            response: `
                <p><b>Guía de Transferencias Seguras</b></p>
                <ol style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>Ve a <b>Billetera</b> > <b>"Transferir"</b>.</li>
                    <li>Ingresa los datos del destinatario:
                        <ul><li>Nombre, Cédula y Teléfono.</li></ul>
                    </li>
                    <li>Ingresa el monto a enviar.</li>
                    <li>🔐 <b>Paso Crítico:</b> El sistema pedirá tu <b>PIN de 4 dígitos</b> para autorizar la salida del dinero.</li>
                </ol>
                <div style="margin-top:10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top:8px;">
                    <p><b>⚠️ Solución de problemas:</b></p>
                    <ul style="font-size:0.9em; margin-left:15px;">
                        <li>¿Error de saldo? Verifica que tengas fondos disponibles.</li>
                        <li>¿Destinatario no encontrado? Revisa bien el número de cédula.</li>
                    </ul>
                </div>`
        },

        // --- Exportar ---
        {
            section: "billetera",
            keywords: ["exportar", "movimientos", "excel", "pdf", "historial"],
            response: `
                <p><b>Exportación de Historial</b></p>
                <p>Puedes descargar tus datos para llevar tu propia contabilidad:</p>
                <ul style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>1. Ve a la sección <b>Movimientos</b>.</li>
                    <li>2. Toca el icono de descarga 📥 (arriba a la derecha).</li>
                    <li>3. Elige el formato:
                        <br>📄 <b>PDF:</b> Para comprobantes y lectura.
                        <br>📊 <b>Excel (CSV):</b> Para editar y hacer cálculos.</li>
                </ul>
                <p><i>Nota: La descarga incluye todas las transacciones del mes actual por defecto.</i></p>`
        },

        // --- Eliminar Cuenta ---
        {
            section: "perfil",
            keywords: ["eliminar", "borrar cuenta", "darse de baja"],
            response: `
                <p>⚠️ <b>Zona de Peligro: Cerrar Cuenta</b></p>
                <p>Si deseas darte de baja permanentemente, sigue estos pasos:</p>
                <ol style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li><b>Requisito:</b> Tu saldo debe estar en $0.00. Retira tus fondos primero.</li>
                    <li>Ve a <b>Perfil > Configuración</b>.</li>
                    <li>Baja hasta <b>Seguridad</b> y toca <span style="color:#ff4d4d; font-weight:bold;">"Eliminar mi cuenta"</span>.</li>
                </ol>
                <p>🔴 <b>Advertencia:</b> Esta acción es irreversible. Perderás tu historial de crédito y beneficios acumulados en la plataforma.</p>`
        },

        // --- Seguridad ---
        {
            section: "perfil",
            keywords: ["contraseña", "clave", "pin", "cambiar", "seguridad"],
            response: `
                <p><b>Gestión de Seguridad</b></p>
                <p>En <b>Perfil > Seguridad</b> tienes el control total:</p>
                <ul style="margin-left: 15px; margin-top: 12px; line-height: 1.6;">
                    <li>🔑 <b>Contraseña:</b> Es tu llave de entrada. Cámbiala cada 3 meses.</li>
                    <li>🔢 <b>PIN Transaccional:</b> Es tu firma digital para mover dinero.</li>
                </ul>
                <p style="margin-top:10px; color:#ffdd57;"><b>🔔 Consejo Pro:</b> Nunca uses fechas de nacimiento (ej. 1990) ni números consecutivos (1234) como PIN. Son los primeros que prueban los ladrones.</p>`
        }
    ];

    const defaultResponse = "<p>🤔 Mmm... no estoy segura de entender tu pregunta. ¿Podrías intentar seleccionar una de las opciones del menú?.</p>";

    // ==========================================
    // 5. FUNCIONES LÓGICAS
    // ==========================================
    const normalizeText = (text) => {
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, ""); 
    };

    const getRandomTip = () => {
        const randomIndex = Math.floor(Math.random() * tipsDatabase.length);
        const tip = tipsDatabase[randomIndex];
        return `
            <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 10px; border-left: 4px solid #00d26a;">
                <p style="font-size: 0.9rem; color: #00d26a; margin-bottom: 6px; font-weight: 600;">💰 Tip Financiero</p>
                <p style="line-height: 1.5;">${tip.text}</p>
            </div>
            <p style="margin-top:8px; font-size: 0.8rem; text-align: right; opacity: 0.7;"><i>¿Otro? Pulsa el dado 🎲</i></p>
        `;
    };

    const findBestMatch = (input, section = null) => {
        const cleanInput = normalizeText(input);
        
        // Prioridad: Tip Aleatorio
        if (cleanInput.includes("dame un consejo") || cleanInput.includes("tip aleatorio") || cleanInput.includes("sorprendeme")) {
            return getRandomTip();
        }

        const match = knowledgeBase.find(entry => {
            const inSection = section ? (entry.section === section) : true;
            return inSection && entry.keywords.some(keyword => cleanInput.includes(keyword));
        });

        return match ? match.response : defaultResponse;
    };

    // ==========================================
    // 6. FUNCIONES DE UI
    // ==========================================
    const createChatLi = (message, className) => {
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", className);
        let chatContent = className === "outgoing" 
            ? `<div class="msg-content"><p>${message}</p></div>` 
            : `<div class="msg-content">${message}</div>`;
        chatLi.innerHTML = chatContent;
        return chatLi;
    }

    const generateResponse = async () => {
        const typingLi = document.querySelector(".incoming.typing");
        if(typingLi) typingLi.remove();

        const responseHTML = findBestMatch(userMessage, userSection);

        chatBox.appendChild(createChatLi(responseHTML, "incoming"));
        chatBox.scrollTo(0, chatBox.scrollHeight);
    }

    const enviarMensajeIA = (texto, section = null) => {
        const msg = (texto || '').trim();
        if (!msg) return;

        chatBox.appendChild(createChatLi(msg, "outgoing"));
        chatBox.scrollTo(0, chatBox.scrollHeight);
        
        userSection = section || null;

        setTimeout(() => {
            const loadingDots = `<div class="typing-animation"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
            const typingLi = createChatLi(loadingDots, "incoming");
            typingLi.classList.add("typing");
            chatBox.appendChild(typingLi);
            chatBox.scrollTo(0, chatBox.scrollHeight);
            
            userMessage = msg;
            setTimeout(generateResponse, chatConfig.responseDelay);
        }, chatConfig.typingDelay);
    }

    // ==========================================
    // 7. RENDERIZADO DE MENÚS
    // ==========================================
    const menus = {
        main: [
            { label: "🎓 Finanzas", action: "menu", target: "finance" },
            { label: "⚙️ App", action: "menu", target: "app" },
            { label: "🎲 Tip Aleatorio", action: "query", text: "¡Dame un consejo random! 🎲", section: "general" } 
        ],
        finance: [
            { label: "💰 Ahorro", action: "query", text: "¿Cuáles son los mejores tips de ahorro?", section: "educativa" },
            { label: "📊 Regla 50/30/20", action: "query", text: "¿En qué consiste la regla 50/30/20?", section: "educativa" },
            { label: "💳 Deudas", action: "query", text: "¿Cuál es la estrategia para salir de deudas?", section: "educativa" },
            { label: "🚀 Inversión", action: "query", text: "¿Qué debo saber antes de invertir?", section: "educativa" },
            { label: "🎲 Tip Random", action: "query", text: "¡Sorpréndeme con un tip!", section: "general" }, 
            { label: "⬅️ Volver", action: "menu", target: "main", isBack: true }
        ],
        app: [
            { label: "💸 Transferir", action: "query", text: "¿Cómo realizo una transferencia?", section: "billetera" },
            { label: "📂 Exportar", action: "query", text: "¿Cómo puedo exportar mis movimientos?", section: "billetera" },
            { label: "🪪 KYC", action: "query", text: "¿Qué necesito para verificar mi KYC?", section: "kyc" },
            { label: "🔐 Seguridad", action: "query", text: "¿Cómo cambio mi contraseña o PIN?", section: "perfil" },
            { label: "🗑️ Eliminar", action: "query", text: "¿Cuáles son los pasos para eliminar mi cuenta?", section: "perfil" },
            { label: "⬅️ Volver", action: "menu", target: "main", isBack: true }
        ]
    };

    const renderMenu = (menuName) => {
        if (!suggestionsBar) return;
        suggestionsBar.innerHTML = "";
        const options = menus[menuName] || menus["main"];

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.classList.add("chip");
            btn.innerHTML = opt.label;

            // Estilos personalizados
            if (opt.isBack) {
                btn.style.border = "1px solid rgba(255, 100, 100, 0.4)";
                btn.style.backgroundColor = "rgba(50, 10, 10, 0.3)";
            }
            if (opt.label.includes("🎲")) {
                btn.style.backgroundColor = "rgba(255, 215, 0, 0.15)";
                btn.style.borderColor = "rgba(255, 215, 0, 0.4)";
                btn.style.color = "#ffeaa7";
            }

            btn.addEventListener("click", () => {
                if (opt.action === "menu") {
                    renderMenu(opt.target);
                } else if (opt.action === "query") {
                    enviarMensajeIA(opt.text, opt.section);
                }
            });
            suggestionsBar.appendChild(btn);
        });
    };

    // ==========================================
    // 8. EVENTOS Y CARGA INICIAL
    // ==========================================
    const toggleChatbot = (forceOpen) => {
        const isOpen = document.body.classList.contains("show-chatbot");
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
        document.body.classList.toggle("show-chatbot", willOpen);
    };

    if (closeBtn) closeBtn.addEventListener("click", () => toggleChatbot(false));
    if (chatbotToggler) chatbotToggler.addEventListener("click", () => toggleChatbot(true));

    // Inicializar menú principal
    renderMenu("main");
});