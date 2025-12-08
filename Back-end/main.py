# main.py (COMPLETO CON SOLUCIÓN DE IMPORTACIÓN)

from fastapi import FastAPI
import uvicorn
import os
import sys # Importación del módulo del sistema

# --- CORRECCIÓN DEFINITIVA DEL PATH ---
# Obtener el directorio donde reside este archivo (Back-end/)
DIRECTORIO_RAIZ = os.path.dirname(os.path.abspath(__file__))

# Añadir la ruta al PYTHONPATH. Esto asegura que 'app' sea reconocible como un paquete.
sys.path.append(DIRECTORIO_RAIZ)
# --------------------------------------

# Importamos la configuración y la función de inicialización de la P1.2
from configuracion import inicializar_almacenamiento

# Importamos los routers de la Fase 2 (Ahora deberían funcionar)
from app.routers import rutas_autenticacion, rutas_kyc, rutas_billetera

# ... (resto del código de FastAPI: app = FastAPI(...), @app.on_event("startup"), etc.)
# ... (asegúrate de que las importaciones dentro de los routers y servicios sean absolutas/relativas correctas)

# --- 1. INICIALIZACIÓN DE LA APLICACIÓN ---
app = FastAPI(
    title="Credora - Billetera Fintech Educativa",
    version="2.0",
    description="Backend desarrollado para la gestión financiera y educación."
)


# --- 2. EVENTO DE INICIO (INFRAESTRUCTURA DE LA FASE 1) ---
@app.on_event("startup")
def setup_proyecto():
    """
    Función que se ejecuta al inicio del servidor.
    Garantiza que la infraestructura esté lista (P1.2).
    """
    print("Iniciando infraestructura de Credora...")
    
    # 2.1. Inicialización de Almacenamiento (P1.2)
    if inicializar_almacenamiento():
        print("✅ P1.2 COMPLETA: Directorio de subidas verificado.")
    else:
        # En un sistema real, se debería registrar un error crítico y detener la app.
        print("❌ Error de infraestructura: Falló la creación del directorio de subidas.") 
    
    # Aquí iría la inicialización de la Base de Datos (ej. creación de tablas si no existen)
    # print("Conectando y verificando modelos de Base de Datos...")


# --- 3. INCLUSIÓN DE RUTERS (FUNCIONALIDAD DE LA FASE 2) ---

# Rutas de Autenticación (P2.1: Login/Registro Tradicional)
app.include_router(rutas_autenticacion.router)

# Rutas de KYC (P2.2: Carga de Documentos)
# Notar: Estas rutas requieren autenticación (JWT)
app.include_router(rutas_kyc.router)

app.include_router(rutas_billetera.router)

# --- 4. BLOQUE DE EJECUCIÓN DEL SERVIDOR ---
if __name__ == '__main__':
    # Usamos uvicorn para correr la aplicación
    # La opción --reload es útil durante el desarrollo
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)