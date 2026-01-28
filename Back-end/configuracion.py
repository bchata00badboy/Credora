import os

# --- 1. Rutas del Servidor ---
DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
CARPETA_SUBIDAS = os.path.join(DIRECTORIO_BASE, 'uploads', 'kyc')

# Crear carpetas automáticamente
os.makedirs(CARPETA_SUBIDAS, exist_ok=True)
print(f"✅ Directorio de almacenamiento KYC listo: {CARPETA_SUBIDAS}")

# --- 2. BASE DE DATOS (CREDENTIALES DIRECTAS) ---
# Al ponerlo aquí, evitamos errores de lectura de archivos externos.
# Nota: El %24 es el código para el signo $
DB_URL = "postgresql://postgres:OAa%240512@localhost:5432/Credora"

# --- 3. SEGURIDAD ---
SECRET_KEY = "CLAVE_SUPER_SECRETA_PARA_JWT_CREDORA_2026"
ALGORITHM = "HS256"

# --- 4. Reglas de Archivo ---
EXTENSIONES_PERMITIDAS = {'png', 'jpg', 'jpeg', 'webp'}
TAMANO_MAXIMO_ARCHIVO = 5 * 1024 * 1024