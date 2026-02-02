# Back-end\app\routers\rutas_admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from app.db.sesion import get_db
from app.db.modelos import Usuario, Cuenta, Transaccion, SolicitudKYC
from app.routers.rutas_autenticacion import obtener_usuario_actual

router = APIRouter(prefix="/admin", tags=["Panel Administrador"])

# --- DEPENDENCIA DE SEGURIDAD ---
def requerir_admin(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permisos de administrador."
        )
    return usuario_actual

# --- ESQUEMAS DE RESPUESTA ---

# 1. Esquema para la Tabla de Usuarios
class UserAdminView(BaseModel):
    id_usuario: int 
    nombre: str
    correo: str
    rol: str
    saldo: float
    estado_kyc: str
    fecha_registro: datetime
    esta_bloqueado: bool
    imagen_kyc: Optional[str] = None # Nombre del archivo para la auditoría

    class Config:
        from_attributes = True

# 2. Esquema para bloquear/desbloquear
class EstadoUsuarioSchema(BaseModel):
    bloqueado: bool

# 3. Esquema para aprobar/rechazar KYC
class VeredictoKYC(BaseModel):
    aprobado: bool
    motivo: Optional[str] = None
    
# 4. Esquema de Salida
class TransaccionAdminView(BaseModel):
    id: int
    referencia: str
    remitente: str
    destinatario: str
    monto: float
    motivo: str
    fecha: datetime
    estado: str


# --- ENDPOINTS ---

# 1. MÉTRICAS (KPIs)
@router.get("/dashboard-stats")
def obtener_estadisticas_globales(
    db: Session = Depends(get_db), 
    admin: Usuario = Depends(requerir_admin)
):
    total_users = db.query(Usuario).filter(Usuario.rol == 'cliente').count()
    total_dinero = db.query(func.sum(Cuenta.saldo)).scalar() or 0
    kyc_pendientes = db.query(Usuario).filter(Usuario.estado_kyc.in_(['PENDIENTE', 'PENDIENTE_VERIFICACION'])).count()
    
    return {
        "total_usuarios": total_users,
        "dinero_circulante": float(total_dinero),
        "kyc_pendientes": kyc_pendientes
    }

# 2. LISTAR USUARIOS (VITAL PARA LA TABLA)
@router.get("/usuarios", response_model=List[UserAdminView])
def listar_usuarios(
    db: Session = Depends(get_db), 
    admin: Usuario = Depends(requerir_admin)
):
    usuarios = db.query(Usuario).order_by(Usuario.id_usuario.asc()).all()
    
    lista_final = []
    for u in usuarios:
        saldo = u.cuenta.saldo if u.cuenta else 0.0
        
        # Buscar la foto más reciente de la cédula
        solicitud = db.query(SolicitudKYC).filter(SolicitudKYC.id_usuario == u.id_usuario).order_by(SolicitudKYC.fecha_subida.desc()).first()
        archivo = solicitud.nombre_archivo_seguro if solicitud else None

        lista_final.append({
            "id_usuario": u.id_usuario,
            "nombre": u.nombre_completo,
            "correo": u.correo,
            "rol": u.rol,
            "saldo": saldo,
            "estado_kyc": u.estado_kyc,
            "fecha_registro": u.fecha_registro,
            "esta_bloqueado": u.esta_bloqueado,
            "imagen_kyc": archivo # Enviamos el nombre del archivo al frontend
        })
        
    return lista_final

# 3. BLOQUEAR / DESBLOQUEAR
@router.patch("/usuarios/{user_id}/estado")
def cambiar_estado_usuario(
    user_id: int, 
    estado: EstadoUsuarioSchema,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requerir_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.esta_bloqueado = estado.bloqueado
    db.commit()
    return {"mensaje": "Estado actualizado", "esta_bloqueado": usuario.esta_bloqueado}

# 4. APROBAR / RECHAZAR KYC
@router.post("/kyc/{id_usuario}/veredicto")
def veredicto_kyc(
    id_usuario: int, 
    veredicto: VeredictoKYC,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requerir_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if veredicto.aprobado:
        usuario.estado_kyc = "APROBADO"
    else:
        usuario.estado_kyc = "RECHAZADO"
        
    db.commit()
    return {"mensaje": f"Usuario {usuario.estado_kyc} exitosamente"}

@router.get("/transacciones", response_model=List[TransaccionAdminView])
def historial_global_transacciones(
    db: Session = Depends(get_db), 
    admin: Usuario = Depends(requerir_admin)
):
    # Traemos las ultimas 100 transacciones para no saturar
    transacciones = db.query(Transaccion).order_by(Transaccion.fecha.desc()).limit(100).all()
    
    reporte = []
    for t in transacciones:
        # Resolver nombre del remitente (puede ser None si es una recarga del sistema)
        nombre_remitente = "Sistema (Recarga)"
        if t.remitente_id:
            remitente = db.query(Usuario).filter(Usuario.id_usuario == t.remitente_id).first()
            if remitente: nombre_remitente = remitente.nombre_completo

        # Resolver nombre del destinatario
        nombre_destinatario = "Desconocido"
        if t.destinatario_id:
            destinatario = db.query(Usuario).filter(Usuario.id_usuario == t.destinatario_id).first()
            if destinatario: nombre_destinatario = destinatario.nombre_completo
            
        reporte.append({
            "id": t.id_transaccion,
            "referencia": t.referencia,
            "remitente": nombre_remitente,
            "destinatario": nombre_destinatario,
            "monto": float(t.monto),
            "motivo": t.motivo or "Sin motivo",
            "fecha": t.fecha,
            "estado": t.estado
        })
        
    return reporte