# Back-end\main.py

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORTACIONES DEL PROYECTO ---
# 1. Configuración (Al importarlo, ya crea las carpetas automáticamente)
from configuracion import CARPETA_SUBIDAS

# 2. Base de Datos
from app.db.sesion import engine, Base

# 3. Routers (Tus endpoints de lógica)
from app.routers import rutas_autenticacion, rutas_billetera

# --- INICIALIZACIÓN DE TABLAS ---
# Esto crea las tablas en PostgreSQL si no existen (incluyendo las nuevas columnas)
Base.metadata.create_all(bind=engine)

# --- CONFIGURACIÓN DE LA APP ---
app = FastAPI(
    title="Credora API",
    description="Backend financiero con soporte de IA (KYC) y Billetera Virtual",
    version="1.0.0"
)

# --- CONFIGURACIÓN DE CORS (SEGURIDAD) ---
# Permite que el Frontend (HTML/JS) se comunique con el Backend
origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",  # Live Server típico de VS Code
    "*"  # En modo desarrollo permitimos todo para evitar bloqueos
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EVENTOS DE ARRANQUE ---
@app.on_event("startup")
async def startup_event():
    print("🚀 Iniciando sistema Credora...")
    
    # Verificación visual de carpetas
    if os.path.exists(CARPETA_SUBIDAS):
        print(f" Sistema de archivos listo en: {CARPETA_SUBIDAS}")
    else:
        print(f" Advertencia: La carpeta {CARPETA_SUBIDAS} no existe (se intentará crear al usarla).")

# --- REGISTRO DE RUTAS (ENDPOINTS) ---
# Autenticación: /api/v1/auth/registro, /api/v1/auth/token
app.include_router(rutas_autenticacion.router, prefix="/api/v1/auth", tags=["Autenticación"])

# Billetera y KYC: /api/v1/billetera/saldo, /api/v1/billetera/kyc/...
app.include_router(rutas_billetera.router, prefix="/api/v1", tags=["Billetera"])

# --- ARCHIVOS ESTÁTICOS (OPCIONAL) ---
# Si necesitas servir las imágenes subidas públicamente (útil para debug), descomenta esto:
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {
        "estado": "Activo",
        "proyecto": "Credora",
        "docs": "/docs"  # Link directo a Swagger UI
    }