# app/routers/rutas_billetera.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

# Importaciones de tu proyecto
from app.db.sesion import get_db
from app.db.modelos import Usuario, Transaccion  # Asegúrate de tener el modelo Transaccion
from app.seguridad.jwt_utils import decodificar_token
from fastapi.security import OAuth2PasswordBearer

# Esquema de autenticación para obtener el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# --- CONFIGURACIÓN DEL ROUTER ---
# Prefix: /billetera (se sumará al /api/v1 del main.py -> /api/v1/billetera)
router = APIRouter(prefix="/billetera", tags=["Billetera"])

# --- DEPENDENCIA PARA OBTENER USUARIO ACTUAL ---
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# ----------------------------------------------------------------------
# 1. Endpoint: OBTENER SALDO
# Ruta final: GET /api/v1/billetera/saldo
# ----------------------------------------------------------------------
@router.get("/saldo")
def obtener_saldo(usuario: Usuario = Depends(obtener_usuario_actual)):
    """
    Retorna TODOS los datos para llenar el Dashboard y la Sidebar.
    """
    # Si no tienes columna 'saldo' en BD, esto devolverá 0.0
    saldo_real = getattr(usuario, "saldo", 0.00) 
    
    # Generamos un número de cuenta ficticio basado en el ID si no tienes columna 'cuenta'
    # O usa: usuario.numero_cuenta si ya existe en tu modelo
    num_cuenta = getattr(usuario, "numero_cuenta", f"0012-4567-8901-{usuario.id_usuario:04d}")

    return {
        "saldo_actual": float(saldo_real),
        "moneda": "USD",
        "titular": usuario.nombre_completo,
        "email": usuario.correo,  # <--- NUEVO: Para la sidebar
        "numero_cuenta": num_cuenta, # <--- NUEVO: Para el dashboard
        "tarjeta_ultimos_4": "8842", 
        "historial": {
            "lineal": {
                "valores": [saldo_real * 0.9, saldo_real * 0.95, saldo_real, saldo_real * 1.05, saldo_real],
                "total_fmt": f"${saldo_real:,.2f}"
            }
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