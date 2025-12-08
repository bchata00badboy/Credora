import os
from dotenv import load_dotenv # Asegúrate de que no haya texto antes de 'from'

# Cargar las variables de entorno del archivo .env
load_dotenv()

# --- 1. Rutas del Servidor (P1.2) ---
DIRECTORIO_BASE = os.path.abspath(os.path.dirname(__file__))
CARPETA_SUBIDAS = os.path.join(DIRECTORIO_BASE, 'uploads', 'kyc')

# --- 2. Variables de Entorno y Seguridad (P2.1 y P1.1) ---

# ESTA LÍNEA DEBE EXISTIR: (P1.1)
DB_URL = os.getenv("DB_URL", "postgresql://user:password@localhost/credora_db")

# ESTA LÍNEA DEBE EXISTIR: (P2.1)
SECRET_KEY = os.getenv("SECRET_KEY", "SUGERENCIA_CLAVE_DEBIL_CAMBIAR_EN_.env")

# --- 3. Reglas de Archivo (P1.2) ---
EXTENSIONES_PERMITIDAS = {'png', 'jpg', 'jpeg', 'pdf'} 
TAMANO_MAXIMO_ARCHIVO = 2 * 1024 * 1024

# --- 3. Inicialización del Directorio (Punto final de P1.2) ---
def inicializar_almacenamiento():
    """Garantiza que la estructura de carpetas de subida exista."""
    try:
        os.makedirs(CARPETA_SUBIDAS, exist_ok=True)
        print(f"Directorio de almacenamiento listo: {CARPETA_SUBIDAS}")
        return True
    except Exception as e:
        print(f"Error al crear el directorio: {e}")
        return False