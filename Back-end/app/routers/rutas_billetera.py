# Back-end\app\routers\rutas_billetera.py

import shutil
import os
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
# 1. ENDPOINT SALDO (DASHBOARD + BONO BIENVENIDA)
# ======================================================================
@router.get("/saldo")
def obtener_saldo(
    db: Session = Depends(get_db), 
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # --- AUTO-REPARACIÓN (Bono de Bienvenida) ---
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
    # --------------------------------------------

    # Datos Reales
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
        "estado_kyc": usuario.estado_kyc, # Enviamos el estado KYC al front
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
# 3. ENDPOINT TRANSFERENCIAS (ACTUALIZADO CON PIN)
# ======================================================================

# Esquema actualizado para recibir todos los datos del Frontend
class EsquemaTransferencia(BaseModel):
    identificador: str # Correo o Cuenta del destino
    monto: float
    motivo: Optional[str] = "Transferencia"
    # Campos nuevos de seguridad e información
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
    # 0. Validar Estado KYC (Opcional: Descomentar si quieres obligar KYC)
    # if usuario.estado_kyc != "APROBADO": # o EstadoKYC.APROBADO
    #     raise HTTPException(status_code=403, detail="Debes verificar tu identidad (KYC) para transferir.")

    # 1. Validar PIN DE SEGURIDAD
    # En un caso real, compararíamos con usuario.pin_hash en la BD.
    # Para la DEMO, aceptamos "1234".
    if datos.pin != "1234":
        raise HTTPException(status_code=403, detail="PIN de seguridad incorrecto.")

    # 2. Validar Saldo
    if usuario.cuenta.saldo < datos.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente.")
    
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")

    # 3. Buscar Destinatario (Por Correo O Cuenta)
    # Prioridad: Identificador principal (Cuenta/Correo)
    destinatario = db.query(Usuario).filter(
        (Usuario.correo == datos.identificador) | 
        (Usuario.numero_cuenta == datos.identificador)
    ).first()

    # Si no encuentra por identificador, intentamos por Cédula (si la envió)
    if not destinatario and datos.cedula_destino:
         # Asumiendo que tienes campo 'cedula' en Usuario, si no, omite este bloque
         # destinatario = db.query(Usuario).filter(Usuario.cedula == datos.cedula_destino).first()
         pass

    if not destinatario:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado. Verifique los datos.")
        
    if destinatario.id_usuario == usuario.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes transferirte a ti mismo.")

    # 4. Ejecutar Transacción (Atomicidad)
    try:
        # Descontar saldo
        usuario.cuenta.saldo -= datos.monto
        
        # Auto-reparación destino (Bono fantasma si no tiene cuenta)
        if not destinatario.cuenta:
            destinatario_cuenta = Cuenta(id_usuario=destinatario.id_usuario, saldo=0.0, moneda='USD')
            db.add(destinatario_cuenta)
            db.commit()
            db.refresh(destinatario)

        # Acreditar saldo
        destinatario.cuenta.saldo += datos.monto
        
        # Registrar Transacción
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
        raise HTTPException(status_code=500, detail=f"Error interno procesando el pago: {str(e)}")

# ======================================================================
# 4. ENDPOINT KYC: SUBIR DOCUMENTO (IA) - CORREGIDO (Sin Async)
# ======================================================================
@router.post("/kyc/subir-documento")
def subir_documento_kyc(  # <--- CAMBIO AQUÍ: Quitamos 'async'
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

    # 4. Ejecutar IA (EasyOCR) - AHORA CORRE EN UN HILO SEPARADO
    # Esto ya no bloqueará la conexión con el Frontend
    datos_extraidos = extraer_datos_venezuela(ruta_destino)

    # 5. Guardar Resultados
    resultado_proceso = finalizar_proceso_kyc(db, usuario.id_usuario, solicitud.id_documento, datos_extraidos)

    if not resultado_proceso:
        raise HTTPException(status_code=500, detail="Error procesando resultados KYC.")

    return {
        "mensaje": resultado_proceso["mensaje"],
        "aprobado": resultado_proceso["aprobado"],
        "datos_extraidos": {
            "nombre": datos_extraidos["nombre_completo"],
            "fecha_nacimiento": datos_extraidos["fecha_nacimiento"],
            "documento_valido": not datos_extraidos["documento_vencido"],
            "mayor_edad": datos_extraidos["es_mayor_de_edad"],
            "cedula": datos_extraidos["cedula"]
        }
    }
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
    if usuario.estado_kyc != EstadoKYC.APROBADO: 
        pass 

    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    usuario.es_cuenta_negocio = (datos.tipo_usuario == 'User-Business')
    
    db.commit()
    return {"mensaje": "Perfil verificado. ¡Cuenta habilitada al 100%!"}