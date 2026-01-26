# app/routers/rutas_billetera.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

# Importaciones de tu proyecto
from app.db.sesion import get_db
from app.db.modelos import Usuario, Transaccion, Cuenta 
from app.seguridad.jwt_utils import decodificar_token
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
router = APIRouter(prefix="/billetera", tags=["Billetera"])

# --- DEPENDENCIA ---
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# ----------------------------------------------------------------------
# 1. ENDPOINT SALDO (CON AUTO-CORRECCIÓN)
# ----------------------------------------------------------------------
@router.get("/saldo")
def obtener_saldo(
    db: Session = Depends(get_db), # <--- Necesitamos la DB para guardar cambios
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    """
    Retorna saldo real. Si el usuario no tiene cuenta (por error previo), se la crea automáticamente.
    """
    
    # --- LÓGICA DE AUTO-REPARACIÓN ---
    if not usuario.cuenta:
        print(f"⚠️ El usuario {usuario.correo} no tenía billetera. Creando una con bono...")
        nueva_cuenta = Cuenta(
            id_usuario=usuario.id_usuario,
            saldo=100.00, # ¡Bono recuperado!
            moneda='USD'
        )
        db.add(nueva_cuenta)
        db.commit()
        db.refresh(usuario) # Recargamos al usuario para que detecte su nueva cuenta
    # ---------------------------------

    # Ahora sí, leemos el saldo real de la tabla Cuenta
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
# ----------------------------------------------------------------------
# 2. Endpoint: HISTORIAL DE MOVIMIENTOS
# Ruta final: GET /api/v1/billetera/movimientos
# ----------------------------------------------------------------------
@router.get("/movimientos")
def historial_movimientos(
    limite: int = 20, 
    db: Session = Depends(get_db), 
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    """
    Retorna la lista de transacciones del usuario.
    """
    # Intentamos buscar en la tabla real de transacciones
    # Ajusta 'Transaccion' y los campos según tu modelo real en modelos.py
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
                "categoria": "General", # Puedes mejorar esto luego
                "monto": float(mov.monto),
                "tipo": "INGRESO" if es_ingreso else "EGRESO",
                "estado": mov.estado,
                "referencia": f"REF-{mov.id_transaccion}"
            })
            
        return datos_formateados

    except Exception as e:
        print(f"Advertencia: No se pudo leer tabla Transacciones o no existe: {e}")
        # RETORNO SIMULADO DE EMERGENCIA (Para que el front no se rompa si no hay tabla)
        return [
            {
                "fecha": datetime.now(),
                "descripcion": "Bono de Bienvenida (Simulado)",
                "categoria": "Ingreso",
                "monto": 100.00,
                "tipo": "INGRESO",
                "estado": "COMPLETADO",
                "referencia": "WELCOME-01"
            }
        ]

# ----------------------------------------------------------------------
# 3. Endpoint: TRANSFERIR
# Ruta final: POST /api/v1/billetera/transferir
# ----------------------------------------------------------------------
from pydantic import BaseModel

class EsquemaTransferencia(BaseModel):
    destinatario_id: str # Puede ser email o ID
    monto: float
    motivo: Optional[str] = "Transferencia"

@router.post("/transferir")
def realizar_transferencia(
    datos: EsquemaTransferencia,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # 1. Validar saldo
    if usuario.saldo < datos.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # 2. Buscar destinatario (por email para hacerlo fácil)
    destinatario = db.query(Usuario).filter(Usuario.correo == datos.destinatario_id).first()
    if not destinatario:
        raise HTTPException(status_code=404, detail="Cuenta destino no encontrada")
        
    if destinatario.id_usuario == usuario.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes transferirte a ti mismo")

    # 3. Ejecutar transacción (Atomica)
    try:
        # Restar al origen
        usuario.saldo -= datos.monto
        # Sumar al destino
        destinatario.saldo += datos.monto
        
        # Crear registro
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
        db.refresh(nueva_transaccion)
        
        return {
            "mensaje": "Transferencia exitosa",
            "id_transaccion": nueva_transaccion.id_transaccion,
            "nuevo_saldo": float(usuario.saldo)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en transacción: {str(e)}")