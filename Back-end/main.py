# Back-end\main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORTACIONES ---
from configuracion import CARPETA_SUBIDAS
from app.db.sesion import engine, Base
from app.routers import rutas_autenticacion, rutas_billetera

# --- INICIALIZACIÓN BD ---
Base.metadata.create_all(bind=engine)

# --- APP ---
app = FastAPI(title="Credora API", version="1.0.0")

# --- CORS ---
origins = [
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5500",
    "http://localhost:5501",
    "*" # Úsalo solo para descartar problemas de conexión
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS (CONFIGURACIÓN CORRECTA) ---

# 1. Autenticación -> /api/v1/auth
app.include_router(rutas_autenticacion.router, prefix="/api/v1/auth", tags=["Autenticación"])

# 2. Billetera -> /api/v1/billetera
# NOTA: En rutas_billetera.py el router ya tiene prefix="/billetera".
# Por lo tanto, aquí usamos SOLO "/api/v1".
# Resultado matemático: "/api/v1" + "/billetera" = "/api/v1/billetera"
app.include_router(rutas_billetera.router, prefix="/api/v1", tags=["Billetera"])


# --- EVENTO DE ARRANQUE Y DIAGNÓSTICO ---
@app.on_event("startup")
async def startup_event():
    # 1. Crear carpetas
    if not os.path.exists(CARPETA_SUBIDAS):
        os.makedirs(CARPETA_SUBIDAS)
    
    # 2. IMPRIMIR RUTAS DISPONIBLES (DIAGNÓSTICO)
    print("\n" + "="*50)
    print("🚀 RUTAS ACTIVAS EN EL SERVIDOR:")
    print("="*50)
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"Ruta: {route.path}  [{','.join(route.methods)}]")
    print("="*50 + "\n")

@app.get("/")
def read_root():
    return {"estado": "Activo", "sistema": "Credora API v1"}