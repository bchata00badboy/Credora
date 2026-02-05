# Back-end\app\servicios\servicio_correo.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from configuracion import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD

def enviar_correo_generico(destinatario: str, asunto: str, cuerpo_html: str):
    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"Soporte Credora <{SMTP_USER}>"
    mensaje["To"] = destinatario

    mensaje.attach(MIMEText(cuerpo_html, "html"))

    try:
        # LÓGICA HÍBRIDA SEGÚN EL PUERTO
        if SMTP_PORT == 465:
            # Conexión SSL Implícita (Gmail/Outlook puerto 465)
            context = smtplib.ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as servidor:
                servidor.login(SMTP_USER, SMTP_PASSWORD)
                servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        else:
            # Conexión STARTTLS (Gmail/Outlook puerto 587)
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as servidor:
                servidor.ehlo()
                servidor.starttls() # Encriptar conexión
                servidor.ehlo()
                servidor.login(SMTP_USER, SMTP_PASSWORD)
                servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        
        print(f"📧 Correo enviado a {destinatario}")
        return True

    except Exception as e:
        print(f"❌ Error SMTP: {e}")
        return False

# ... (Las funciones enviar_codigo_registro y enviar_codigo_recuperacion quedan igual) ...
def enviar_codigo_registro(correo: str, codigo: str):
    html = f"""
    <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #003049;">Bienvenido a Credora</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="color: #d00000; letter-spacing: 5px;">{codigo}</h1>
        <p>Ingrésalo en la plataforma para activar tu cuenta.</p>
    </div>
    """
    return enviar_correo_generico(correo, "Verifica tu cuenta Credora", html)

def enviar_codigo_recuperacion(correo: str, codigo: str):
    html = f"""
    <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #003049;">Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu clave. Usa este código:</p>
        <h1 style="color: #005f73; letter-spacing: 5px;">{codigo}</h1>
        <p>Si no fuiste tú, ignora este mensaje.</p>
    </div>
    """
    return enviar_correo_generico(correo, "Restablecer Contraseña - Credora", html)