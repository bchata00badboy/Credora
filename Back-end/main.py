from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <--- 1. IMPORTANTE: Importar CORS
import uvicorn
import os
import sys 

# --- CORRECCIÓN PATH (Mantenemos tu lógica) ---
DIRECTORIO_RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.append(DIRECTORIO_RAIZ)
# ----------------------------------------------

from configuracion import inicializar_almacenamiento
from app.routers import rutas_autenticacion, rutas_kyc, rutas_billetera

# --- 1. INICIALIZACIÓN DE LA APLICACIÓN ---
app = FastAPI(
    title="Credora - Billetera Fintech Educativa",
    version="2.0",
    description="Backend desarrollado para la gestión financiera y educación."
)

# --- 2. CONFIGURACIÓN DE CORS (SOLUCIÓN A "BLOCKED BY CORS POLICY") ---
# Definimos quién tiene permiso para hablar con el backend
origenes_permitidos = [
    "http://localhost",
    "http://localhost:5500",      # Puerto estándar de Live Server
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",      # Tu puerto actual según el error que enviaste
    "*"                           # Comodín para desarrollo (acepta todo)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos, # Lista de orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],               # Permitir todos los métodos (GET, POST, PUT...)
    allow_headers=["*"],               # Permitir todas las cabeceras
)

# --- 3. EVENTO DE INICIO ---
@app.on_event("startup")
def setup_proyecto():
    print("Iniciando infraestructura de Credora...")
    if inicializar_almacenamiento():
        print(" P1.2 COMPLETA: Directorio de subidas verificado.")
    else:
        print(" Error de infraestructura: Falló la creación del directorio de subidas.") 

# --- 4. INCLUSIÓN DE ROUTERS (SOLUCIÓN A ERROR 404) ---

# A) Autenticación
# El JS llama a: /api/v1/auth/token
# El router tiene: /auth/token
# Solución: Agregamos prefix="/api/v1"
app.include_router(rutas_autenticacion.router, prefix="/api/v1")

# B) Billetera
# El JS llama a: /api/v1/billetera/...
# Solución: Agregamos prefix="/api/v1"
app.include_router(rutas_billetera.router, prefix="/api/v1")

# C) KYC
# Nota: Según tu código anterior, rutas_kyc ya tiene definido prefix="/api/v1/kyc" internamente.
# Por lo tanto, NO agregamos prefijo aquí para evitar duplicarlo (/api/v1/api/v1/kyc).
app.include_router(rutas_kyc.router) 

# --- Endpoint de prueba raíz ---
@app.get("/")
def root():
    return {"mensaje": "Servidor Credora en línea 🚀. Documentación en /docs"}

# --- 5. EJECUCIÓN ---
if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)