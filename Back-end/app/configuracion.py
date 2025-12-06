# configuracion.py (Puro Setup de Infraestructura)

import os

# --- 1. Rutas del Servidor ---
# Obtiene el directorio base del proyecto, crucial para rutas relativas
DIRECTORIO_BASE = os.path.abspath(os.path.dirname(__file__))

# Define la ruta completa donde se guardarán los archivos sensibles (cédulas)
CARPETA_SUBIDAS = os.path.join(DIRECTORIO_BASE, 'uploads', 'kyc')


# --- 2. Reglas de Archivo ---
# (Definidas en P1.2 para controlar lo que el sistema debe aceptar)
EXTENSIONES_PERMITIDAS = {'png', 'jpg', 'jpeg', 'pdf'} 

# 2MB es un tamaño estándar para documentos e imágenes
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