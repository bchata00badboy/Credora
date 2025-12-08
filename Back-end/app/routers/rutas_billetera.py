# app/routers/rutas_billetera.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.sesion import get_db
from app.db.modelos import Usuario

# Importamos al GUARDIA que acabamos de crear
from app.dependencias import obtener_usuario_actual, requerir_kyc_aprobado

router = APIRouter(prefix="/billetera", tags=["Billetera (Core)"])

# --- RUTA NIVEL 1: Solo requiere Login (Cualquiera entra) ---
@router.get("/perfil")
def ver_mi_perfil(usuario: Usuario = Depends(obtener_usuario_actual)):
    """
    Cualquier usuario logueado puede ver su perfil, tenga o no KYC.
    """
    return {
        "nombre": usuario.nombre_completo,
        "correo": usuario.correo,
        "estado_kyc": usuario.estado_kyc,
        "mensaje": "Puedes ver esto porque tienes cuenta."
    }

# --- RUTA NIVEL 2: BLINDADA (Requiere KYC Aprobado) ---
@router.get("/saldo-disponible")
def ver_saldo_real(
    # AQUÍ PONEMOS AL GUARDIA EN LA PUERTA:
    usuario_verificado: Usuario = Depends(requerir_kyc_aprobado) 
):
    """
    SOLO usuarios con Cédula Verificada y Aprobada pueden ver esto.
    """
    # Si el código llega aquí, el usuario es 100% confiable.
    return {
        "propietario": usuario_verificado.nombre_completo, # Nombre real de la cédula
        "cedula": usuario_verificado.cedula,
        "saldo": 1000.00, # Simulado, aquí iría usuario_verificado.cuenta.saldo
        "mensaje": "Acceso autorizado a fondos."
    }