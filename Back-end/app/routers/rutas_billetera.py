# Back-end\app\routers\rutas_billetera.py

# Back-end\app\routers\rutas_billetera.py

import shutil
import os
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Importaciones de Base de Datos y Modelos
from app.db.sesion import get_db
from app.db.modelos import Usuario, Transaccion, Cuenta, SolicitudKYC, EstadoKYC

# Seguridad
from app.seguridad.jwt_utils import decodificar_token
from fastapi.security import OAuth2PasswordBearer

# Importaciones del Servicio KYC (IA)
from app.servicios.servicio_kyc import (
    es_extension_permitida,
    generar_nombre_seguro,
    registrar_subida_en_bd,
    extraer_datos_venezuela,
    finalizar_proceso_kyc
)
from configuracion import CARPETA_SUBIDAS

# Configuración del Router
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
router = APIRouter(prefix="/billetera", tags=["Billetera"])


def convertir_tipos_numpy(obj):
    """
    Convierte recursivamente tipos de NumPy a tipos nativos de Python.
    Crucial para evitar errores de serialización JSON en FastAPI.
    """
    if isinstance(obj, dict):
        return {k: convertir_tipos_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convertir_tipos_numpy(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return convertir_tipos_numpy(obj.tolist())
    else:
        return obj


# --- DEPENDENCIA DE USUARIO ---
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# ======================================================================
# 1. ENDPOINT SALDO
# ======================================================================
@router.get("/saldo")
def obtener_saldo(
    db: Session = Depends(get_db), 
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # Auto-reparación (Bono)
    if not usuario.cuenta:
        print(f"⚠️ Usuario {usuario.correo} sin billetera. Generando Bono $100...")
        nueva_cuenta = Cuenta(
            id_usuario=usuario.id_usuario,
            saldo=100.00, 
            moneda='USD'
        )
        db.add(nueva_cuenta)
        db.commit()
        db.refresh(usuario) 

    saldo_real = float(usuario.cuenta.saldo)
    cuenta_real = usuario.numero_cuenta
    tarjeta_real = usuario.numero_tarjeta
    ultimos_4 = tarjeta_real[-4:] if tarjeta_real else "0000"

    return {
        "saldo_actual": saldo_real,
        "moneda": "USD",
        "titular": usuario.nombre_completo,
        "email": usuario.correo,
        "numero_cuenta": cuenta_real,
        "tarjeta_ultimos_4": ultimos_4,
        "estado_kyc": usuario.estado_kyc,
        "historial": {
            "lineal": {
                "valores": [saldo_real * 0.9, saldo_real * 0.95, saldo_real, saldo_real * 1.05, saldo_real],
                "total_fmt": f"${saldo_real:,.2f}"
            },
            "dia": [saldo_real], 
            "mes": [saldo_real], 
            "anio": [saldo_real] 
        }
    }

# ======================================================================
# 2. ENDPOINT MOVIMIENTOS
# ======================================================================
@router.get("/movimientos")
def historial_movimientos(
    limite: int = 20, 
    db: Session = Depends(get_db), 
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    try:
        movimientos = db.query(Transaccion).filter(
            (Transaccion.remitente_id == usuario.id_usuario) | 
            (Transaccion.destinatario_id == usuario.id_usuario)
        ).order_by(Transaccion.fecha.desc()).limit(limite).all()
        
        datos_formateados = []
        for mov in movimientos:
            es_ingreso = (mov.destinatario_id == usuario.id_usuario)
            datos_formateados.append({
                "fecha": mov.fecha,
                "descripcion": mov.motivo or "Transferencia",
                "categoria": "General", 
                "monto": float(mov.monto),
                "tipo": "INGRESO" if es_ingreso else "EGRESO",
                "estado": mov.estado,
                "referencia": f"REF-{mov.id_transaccion}"
            })
        return datos_formateados

    except Exception as e:
        print(f"Error movimientos: {e}")
        return []

# ======================================================================
# 3. ENDPOINT TRANSFERENCIAS
# ======================================================================
class EsquemaTransferencia(BaseModel):
    identificador: str
    monto: float
    motivo: Optional[str] = "Transferencia"
    pin: str
    cedula_destino: Optional[str] = None
    telefono_destino: Optional[str] = None
    nombre_beneficiario: Optional[str] = None

@router.post("/transferir")
def realizar_transferencia(
    datos: EsquemaTransferencia,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    if datos.pin != "1234":
        raise HTTPException(status_code=403, detail="PIN de seguridad incorrecto.")

    if usuario.cuenta.saldo < datos.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente.")
    
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")

    destinatario = db.query(Usuario).filter(
        (Usuario.correo == datos.identificador) | 
        (Usuario.numero_cuenta == datos.identificador)
    ).first()

    # Opcional: buscar por cédula si no se encontró por correo/cuenta
    if not destinatario and datos.cedula_destino:
         # destinatario = db.query(Usuario).filter(Usuario.cedula == datos.cedula_destino).first()
         pass

    if not destinatario:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado. Verifique los datos.")
        
    if destinatario.id_usuario == usuario.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes transferirte a ti mismo.")

    try:
        # Lógica Transaccional
        usuario.cuenta.saldo -= datos.monto
        
        if not destinatario.cuenta:
            destinatario_cuenta = Cuenta(id_usuario=destinatario.id_usuario, saldo=0.0, moneda='USD')
            db.add(destinatario_cuenta)
            db.commit()
            db.refresh(destinatario)

        destinatario.cuenta.saldo += datos.monto
        
        nueva_transaccion = Transaccion(
            remitente_id=usuario.id_usuario,
            destinatario_id=destinatario.id_usuario,
            monto=datos.monto,
            motivo=datos.motivo,
            estado="COMPLETADO",
            fecha=datetime.now()
        )
        db.add(nueva_transaccion)
        db.commit()
        
        return {
            "mensaje": "Transferencia exitosa",
            "destinatario": destinatario.nombre_completo,
            "id_transaccion": nueva_transaccion.id_transaccion,
            "nuevo_saldo": float(usuario.cuenta.saldo)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# ======================================================================
# 4. ENDPOINT KYC: SUBIR DOCUMENTO (IA) - CORREGIDO
# ======================================================================
@router.post("/kyc/subir-documento")
def subir_documento_kyc(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # 1. Validar extensión
    if not es_extension_permitida(archivo.filename):
        raise HTTPException(status_code=400, detail="Formato no permitido. Use JPG o PNG.")

    # 2. Guardar archivo
    nombre_seguro = generar_nombre_seguro(archivo.filename)
    ruta_destino = os.path.join(CARPETA_SUBIDAS, nombre_seguro)
    
    try:
        with open(ruta_destino, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error guardando imagen: {e}")

    # 3. Registrar en BD
    solicitud = registrar_subida_en_bd(db, usuario.id_usuario, nombre_seguro)

    # 4. Ejecutar IA
    try:
        datos_extraidos = extraer_datos_venezuela(ruta_destino)
    except Exception as e:
        print(f"Error IA: {e}")
        raise HTTPException(status_code=500, detail="Error interno analizando el documento.")

    # 5. Guardar Resultados
    # CORREGIDO: Aquí estaba el error de duplicación
    resultado_proceso = finalizar_proceso_kyc(db, usuario.id_usuario, solicitud.id_documento, datos_extraidos)

    if not resultado_proceso:
        raise HTTPException(status_code=500, detail="Error procesando resultados KYC.")

    # 6. Preparar y limpiar respuesta
    respuesta_final = {
        "mensaje": resultado_proceso["mensaje"],
        "aprobado": resultado_proceso["aprobado"],
        "datos_extraidos": {
            "nombre": datos_extraidos.get("nombre_completo", "No legible"),
            "fecha_nacimiento": datos_extraidos.get("fecha_nacimiento"),
            "documento_valido": not datos_extraidos.get("documento_vencido", True),
            "mayor_edad": datos_extraidos.get("es_mayor_de_edad", False),
            "cedula": datos_extraidos.get("cedula", "No legible")
        }
    }

    # CRÍTICO: Convertir tipos NumPy a nativos para evitar fallo de JSON
    return convertir_tipos_numpy(respuesta_final)

# ======================================================================
# 5. ENDPOINT KYC: FINALIZAR (Datos extra)
# ======================================================================
class EsquemaDatosFinales(BaseModel):
    direccion: str
    telefono: str
    tipo_usuario: str

@router.post("/kyc/finalizar")
def finalizar_kyc_datos(
    datos: EsquemaDatosFinales,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # CORREGIDO: Validación real en lugar de 'pass'
    if usuario.estado_kyc != EstadoKYC.APROBADO: 
        raise HTTPException(status_code=403, detail="Debes aprobar la verificación de identidad (foto) primero.")

    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    # Asignación de cuenta negocio
    usuario.es_cuenta_negocio = (datos.tipo_usuario == 'User-Business')
    
    db.commit()
    return {"mensaje": "Perfil verificado. ¡Cuenta habilitada al 100%!"}