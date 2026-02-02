# Back-end\main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Importante para imágenes

# --- IMPORTACIONES ---
from configuracion import CARPETA_SUBIDAS
from app.db.sesion import engine, Base
from app.routers import rutas_autenticacion, rutas_billetera, rutas_admin

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
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN DE IMÁGENES (CRÍTICO PARA KYC) ---
# Crea la carpeta si no existe
if not os.path.exists(CARPETA_SUBIDAS):
    os.makedirs(CARPETA_SUBIDAS)

# Permite ver las fotos en http://localhost:8000/uploads/foto.jpg
app.mount("/uploads", StaticFiles(directory=CARPETA_SUBIDAS), name="uploads")


# --- REGISTRO DE RUTAS ---
app.include_router(rutas_autenticacion.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(rutas_billetera.router, prefix="/api/v1", tags=["Billetera"])
app.include_router(rutas_admin.router, prefix="/api/v1")

# --- ROOT ---
@app.get("/")
def read_root():
    return {"estado": "Activo", "sistema": "Credora API v1"}