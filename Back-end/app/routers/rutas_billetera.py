# Back-end\app\routers\rutas_billetera.py
# Back-end/app/routers/rutas_billetera.py

import shutil
import os
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
import random

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
    extraer_datos_venezuela
)
from configuracion import CARPETA_SUBIDAS

# Configuración del Router
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
router = APIRouter(prefix="/billetera", tags=["Billetera"])


def generar_referencia_unica(db: Session):
    """Genera un código de 8 dígitos que no choque con ninguno existente"""
    while True:
        # Genera un número entre 10000000 y 99999999
        ref = str(random.randint(10000000, 99999999))

        # Verifica si ya existe en la BD
        existe = db.query(Transaccion).filter(Transaccion.referencia == ref).first()
        if not existe:
            return ref


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
# 1. ENDPOINT SALDO (DASHBOARD + DATOS DE PERFIL)
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
        "estado_kyc": usuario.estado_kyc,
        
        # --- NUEVOS CAMPOS PARA EL PERFIL ---
        # Ahora el Frontend podrá leer estos datos
        "cedula": usuario.cedula,
        "direccion": usuario.direccion,
        "telefono": usuario.telefono,
        "alias": usuario.nombre_completo.split(" ")[0], # Para mostrar un nombre corto
        # ------------------------------------

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
                "referencia": mov.referencia
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
        usuario.cuenta.saldo -= Decimal(str(datos.monto))
        
        if not destinatario.cuenta:
            destinatario_cuenta = Cuenta(id_usuario=destinatario.id_usuario, saldo=0.0, moneda='USD')
            db.add(destinatario_cuenta)
            db.commit()
            db.refresh(destinatario)

        destinatario.cuenta.saldo += Decimal(str(datos.monto))
        
        ref_unica = generar_referencia_unica(db)

        nueva_transaccion = Transaccion(
            remitente_id=usuario.id_usuario,
            destinatario_id=destinatario.id_usuario,
            monto=Decimal(str(datos.monto)),
            motivo=datos.motivo,
            estado="COMPLETADO",
            fecha=datetime.now(),
            referencia=ref_unica # <--- GUARDAR LA REFERENCIA
        )
        db.add(nueva_transaccion)
        db.commit()

        return {
            "mensaje": "Transferencia exitosa",
            "destinatario": destinatario.nombre_completo,
            "referencia": ref_unica, # <--- DEVOLVER AL FRONTEND
            "nuevo_saldo": float(usuario.cuenta.saldo)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# ======================================================================
# 4. ENDPOINT KYC: SUBIR DOCUMENTO (A PRUEBA DE FALLOS)
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

    # 2. Guardar archivo físico
    try:
        nombre_seguro = generar_nombre_seguro(archivo.filename)
        ruta_destino = os.path.join(CARPETA_SUBIDAS, nombre_seguro)
        
        with open(ruta_destino, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
    except Exception as e:
        print(f"❌ Error guardando archivo físico: {e}")
        raise HTTPException(status_code=500, detail="Error al guardar la imagen en el servidor.")

    # 3. Registrar en BD (Crear la fila en SolicitudKYC)
    # Esto es vital para que el Admin encuentre la foto luego
    try:
        solicitud = registrar_subida_en_bd(db, usuario.id_usuario, nombre_seguro)
    except Exception as e:
        print(f"❌ Error registrando en BD: {e}")
        raise HTTPException(status_code=500, detail="Error de base de datos al registrar documento.")

    # 4. Ejecutar IA (OCR)
    datos_extraidos = {}
    try:
        print(f"🧠 Analizando imagen: {nombre_seguro}")
        datos_extraidos = extraer_datos_venezuela(ruta_destino)
        print(f"✅ Resultado IA: {datos_extraidos}")
    except Exception as e:
        print(f"⚠️ Advertencia: La IA falló, pero el proceso continúa. Error: {e}")
        # Definimos un fallback para que no rompa el flujo
        datos_extraidos = {"exito": False, "mensaje": "Lectura manual requerida", "cedula": "", "nombre_completo": ""}

    # 5. ACTUALIZACIÓN DE DATOS (LÓGICA BLINDADA)
    
    # A. Actualizar la solicitud con lo que haya visto la IA
    solicitud.info_extraida = datos_extraidos
    solicitud.estado = "PENDIENTE_REVISION" # Estado interno de la solicitud
    
    # B. Intentar rellenar datos del usuario si la IA vio algo
    # Usamos .get() para evitar errores si la clave no existe
    nombre_detectado = datos_extraidos.get("nombre_completo")
    cedula_detectada = datos_extraidos.get("cedula")

    if nombre_detectado and len(nombre_detectado) > 3:
        usuario.nombre_completo = nombre_detectado
    
    if cedula_detectada and len(cedula_detectada) > 5:
        # Limpiamos la cédula para que guarde solo números o formato estándar
        usuario.cedula = str(cedula_detectada).strip().upper()

    # C. CAMBIO DE ESTADO (CRÍTICO)
    # Siempre ponemos al usuario en PENDIENTE para que el Admin lo vea
    usuario.estado_kyc = "PENDIENTE_VERIFICACION"
    
    # Guardamos todo
    db.commit()
    db.refresh(solicitud) # Aseguramos que se guardó

    # 6. Respuesta al Frontend
    # Devolvemos datos seguros para evitar 'null' errors en JS
    respuesta_final = {
        "mensaje": "Documento recibido. Un administrador revisará tu perfil.",
        "aprobado": False,
        "datos_extraidos": {
            "nombre": nombre_detectado if nombre_detectado else "No detectado (Se requiere revisión manual)",
            "cedula": cedula_detectada if cedula_detectada else "No detectada",
            "documento_valido": True, # Asumimos true para no bloquear el flujo visual
            "mensaje_estado": "Tu documento ha sido enviado a la cola de auditoría."
        }
    }

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
    # En este modelo híbrido, el usuario puede guardar sus datos extras
    # aunque la foto aún no esté aprobada por el admin.
    
    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    usuario.es_cuenta_negocio = (datos.tipo_usuario == 'User-Business')
    
    db.commit()
    return {"mensaje": "Datos guardados. Tu perfil será revisado por un administrador en breve."}


# ======================================================================
# 6. ENDPOINT RECARGA DE SALDO (Simulación Persistente)
# ======================================================================
class EsquemaRecarga(BaseModel):
    monto_usd: float

@router.post("/recargar")
def recargar_saldo_usuario(
    datos: EsquemaRecarga,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    if datos.monto_usd <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")

    # 1. Actualizar Saldo en Billetera
    if not usuario.cuenta:
        nueva_cuenta = Cuenta(id_usuario=usuario.id_usuario, saldo=0.0)
        db.add(nueva_cuenta)
        db.commit()
        db.refresh(usuario)

    # Convertimos el float a Decimal para operaciones monetarias
    monto_decimal = Decimal(str(datos.monto_usd))
    
    usuario.cuenta.saldo += monto_decimal

    # 2. Registrar en el Historial (Tabla Transaccion)
    # GENERAR REFERENCIA
    ref_unica = generar_referencia_unica(db)

    nueva_transaccion = Transaccion(
        remitente_id=None, 
        destinatario_id=usuario.id_usuario,
        monto=monto_decimal, 
        motivo="Recarga de Saldo (BS)",
        estado="COMPLETADO",
        fecha=datetime.now(),
        referencia=ref_unica # <--- GUARDAR LA REFERENCIA
    )

    db.add(nueva_transaccion)
    db.commit()
    db.refresh(usuario.cuenta)

    return {
        "mensaje": "Recarga exitosa",
        "nuevo_saldo": float(usuario.cuenta.saldo), 
        "referencia": ref_unica # <--- MOSTRAR REFERENCIA
    }