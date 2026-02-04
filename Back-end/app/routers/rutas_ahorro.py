from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
import random

from app.db.sesion import get_db
from app.db.modelos import Usuario, MetaFinanciera, Transaccion
from app.routers.rutas_autenticacion import obtener_usuario_actual
from app.esquemas.esquema_ahorro import MetaCreate, MetaAbono, MetaResponse
from typing import List

router = APIRouter(prefix="/ahorro", tags=["Metas Financieras"])

# Auxiliar para generar referencias de transacción
def generar_ref(db: Session):
    while True:
        ref = str(random.randint(10000000, 99999999))
        if not db.query(Transaccion).filter(Transaccion.referencia == ref).first():
            return ref

# 1. LISTAR METAS DEL USUARIO
@router.get("/metas", response_model=List[MetaResponse])
def listar_metas(db: Session = Depends(get_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    return db.query(MetaFinanciera).filter(MetaFinanciera.id_usuario == usuario.id_usuario).all()

# 2. CREAR UNA NUEVA META
@router.post("/metas", response_model=MetaResponse)
def crear_meta(meta: MetaCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    nueva_meta = MetaFinanciera(
        id_usuario=usuario.id_usuario,
        nombre_meta=meta.nombre,
        monto_objetivo=meta.objetivo,
        fecha_limite=meta.fecha_limite,
        monto_actual=0.00,
        estado="En Progreso"
    )
    db.add(nueva_meta)
    db.commit()
    db.refresh(nueva_meta)
    return nueva_meta

# 3. ABONAR DINERO (CUENTA -> META)
@router.post("/metas/{id_meta}/abonar")
def abonar_meta(id_meta: int, abono: MetaAbono, db: Session = Depends(get_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    # Buscar la meta
    meta = db.query(MetaFinanciera).filter(MetaFinanciera.id_meta == id_meta, MetaFinanciera.id_usuario == usuario.id_usuario).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    
    if meta.estado == "Finalizado":
        raise HTTPException(status_code=400, detail="Esta meta ya está completada")

    if abono.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser positivo")

    # Verificar saldo en billetera principal
    cuenta = usuario.cuenta
    if cuenta.saldo < Decimal(abono.monto):
        raise HTTPException(status_code=400, detail="Saldo insuficiente en tu cuenta principal")

    # --- MOVIMIENTO DE DINERO ---
    # 1. Restar de la cuenta principal
    cuenta.saldo -= Decimal(abono.monto)
    
    # 2. Sumar a la meta (Bolsillo aparte)
    meta.monto_actual += Decimal(abono.monto)
    
    # 3. Verificar si se completó
    if meta.monto_actual >= meta.monto_objetivo:
        meta.estado = "Finalizado"

    # 4. Registrar en el historial de transacciones
    nueva_tx = Transaccion(
        referencia=generar_ref(db),
        remitente_id=usuario.id_usuario,
        destinatario_id=usuario.id_usuario, # Auto-transferencia
        monto=abono.monto,
        motivo=f"Ahorro Meta: {meta.nombre_meta}",
        estado="COMPLETADO",
        fecha=datetime.now()
    )
    db.add(nueva_tx)
    
    db.commit()
    return {"mensaje": "Abono exitoso", "nuevo_saldo_meta": float(meta.monto_actual), "meta_completada": meta.estado == "Finalizado"}

# 4. ELIMINAR META (REEMBOLSO)
@router.delete("/metas/{id_meta}")
def eliminar_meta(id_meta: int, db: Session = Depends(get_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    meta = db.query(MetaFinanciera).filter(MetaFinanciera.id_meta == id_meta, MetaFinanciera.id_usuario == usuario.id_usuario).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    # Si hay dinero ahorrado, lo devolvemos a la cuenta principal
    if meta.monto_actual > 0:
        usuario.cuenta.saldo += meta.monto_actual
        
        # Registrar el reembolso en el historial
        reembolso_tx = Transaccion(
            referencia=generar_ref(db),
            remitente_id=None, # Sistema
            destinatario_id=usuario.id_usuario,
            monto=meta.monto_actual,
            motivo=f"Reembolso Meta: {meta.nombre_meta}",
            estado="COMPLETADO",
            fecha=datetime.now()
        )
        db.add(reembolso_tx)

    db.delete(meta)
    db.commit()
    return {"mensaje": "Meta eliminada y fondos devueltos a tu cuenta principal"}