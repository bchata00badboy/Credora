# Back-end\app\routers\rutas_autenticacion.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import random
from fastapi.security import OAuth2PasswordBearer 
from app.seguridad.jwt_utils import decodificar_token 

from pydantic import BaseModel

# Importaciones del proyecto
from app.db.sesion import get_db
from app.db.modelos import Usuario # Importamos el modelo para consultas directas
from app.servicios.servicio_usuarios import crear_usuario, autenticar_usuario, obtener_hash_contrasena
from app.seguridad.jwt_utils import crear_token_acceso
from app.esquemas.esquema_usuario import EsquemaRegistro, EsquemaToken, EsquemaUsuario
from app.servicios.servicio_correo import enviar_codigo_registro, enviar_codigo_recuperacion

router = APIRouter()

# --- CONFIGURACIÓN DE SEGURIDAD PARA ESTE ROUTER ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales inválidas"
        )
    
    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    return usuario

# --------------------------------------------------------------------------
# 1. REGISTRO (AHORA CON ENVÍO DE CÓDIGO)
# --------------------------------------------------------------------------
@router.post("/registro", response_model=EsquemaUsuario)
def registro_usuario(datos: EsquemaRegistro, db: Session = Depends(get_db)):
    # 1. Verificar si el usuario ya existe
    usuario_existente = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    
    nuevo_codigo = str(random.randint(100000, 999999))

    if usuario_existente:
        # CASO A: Ya existe y ya validó su cuenta -> ERROR REAL
        if usuario_existente.correo_verificado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este correo ya está registrado y activo. Inicia sesión."
            )
        
        # CASO B: Existe pero es un "Zombie" (No verificado) -> RECICLAR CUENTA
        # Actualizamos sus datos y le mandamos código nuevo
        print(f"♻️ Reciclando usuario no verificado: {datos.correo}")
        usuario_existente.nombre_completo = datos.nombre_completo
        usuario_existente.hash_contrasena = obtener_hash_contrasena(datos.contrasena)
        usuario_existente.codigo_verificacion = nuevo_codigo
        db.commit()
        db.refresh(usuario_existente)
        
        # Reenviar correo
        enviar_codigo_registro(usuario_existente.correo, nuevo_codigo)
        return usuario_existente

    # CASO C: Usuario Nuevo (No existe) -> CREAR DESDE CERO
    try:
        nuevo_usuario = crear_usuario(db, datos)
        
        # Inyectar código manualmente (porque crear_usuario no lo hace por defecto)
        nuevo_usuario.codigo_verificacion = nuevo_codigo
        nuevo_usuario.correo_verificado = False
        db.commit()

        # Enviar Correo
        enviar_codigo_registro(nuevo_usuario.correo, nuevo_codigo)
        
        return nuevo_usuario
        
    except Exception as e:
        db.rollback() # Importante: Deshacer cambios si algo falla
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar: {str(e)}"
        )

# --------------------------------------------------------------------------
# 2. VERIFICAR CÓDIGO (NUEVO)
# --------------------------------------------------------------------------
@router.post("/verificar-cuenta")
def verificar_cuenta(correo: str = Body(...), codigo: str = Body(...), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if usuario.codigo_verificacion != codigo:
        raise HTTPException(status_code=400, detail="Código incorrecto")
        
    # Validar
    usuario.correo_verificado = True
    usuario.codigo_verificacion = None # Limpiar código
    db.commit()
    
    return {"mensaje": "Cuenta verificada exitosamente"}

# --------------------------------------------------------------------------
# 3. SOLICITAR RECUPERACIÓN (OLVIDÉ CONTRASEÑA)
# --------------------------------------------------------------------------
@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(correo: str = Body(..., embed=True), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    # Por seguridad, si el correo no existe, decimos que se envió igual para no revelar usuarios
    if usuario:
        codigo = str(random.randint(100000, 999999))
        usuario.codigo_verificacion = codigo
        db.commit()
        enviar_codigo_recuperacion(usuario.correo, codigo)
        
    return {"mensaje": "Si el correo existe, se ha enviado un código de recuperación."}

# --------------------------------------------------------------------------
# 4. CAMBIAR CONTRASEÑA CON CÓDIGO
# --------------------------------------------------------------------------
@router.post("/restablecer-password")
def restablecer_password(
    correo: str = Body(...), 
    codigo: str = Body(...), 
    nueva_password: str = Body(...), 
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    if not usuario or usuario.codigo_verificacion != codigo:
        raise HTTPException(status_code=400, detail="Código inválido o usuario incorrecto")
        
    # Hash de la nueva clave
    usuario.hash_contrasena = obtener_hash_contrasena(nueva_password)
    usuario.codigo_verificacion = None # Quemar código
    db.commit()
    
    return {"mensaje": "Contraseña restablecida. Ya puedes iniciar sesión."}

# --------------------------------------------------------------------------
# 5. LOGIN (MODIFICADO PARA DEVOLVER EL ROL)
# --------------------------------------------------------------------------
@router.post("/token", response_model=EsquemaToken)
def login_para_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Autenticar
    usuario = autenticar_usuario(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales incorrectas"
        )

    # --- AGREGAR ESTA VALIDACIÓN DE BLOQUEO ---
    if usuario.esta_bloqueado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Tu cuenta ha sido bloqueada por un administrador. Contacta a soporte."
        )
    # ------------------------------------------
        
    # 2. Generar Token
    tiempo = timedelta(minutes=60)
    token = crear_token_acceso(data={"sub": str(usuario.id_usuario)}, expires_delta=tiempo)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "rol": usuario.rol
    }
    
# Agregar Esquema para cambio de PIN
class EsquemaCambioPin(BaseModel):
    old: str
    new: str

@router.post("/cambiar-pin")
def cambiar_pin_seguridad(
    datos: EsquemaCambioPin,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # 1. Verificar PIN actual (Por defecto es "1234")
    if usuario.pin_seguridad != datos.old:
        raise HTTPException(status_code=400, detail="El PIN actual es incorrecto.")
    
    # 2. Validar formato del nuevo PIN
    if len(datos.new) != 4 or not datos.new.isdigit():
        raise HTTPException(status_code=400, detail="El nuevo PIN debe ser de 4 dígitos numéricos.")

    # 3. Guardar
    usuario.pin_seguridad = datos.new
    db.commit()
    
    return {"mensaje": "PIN de seguridad actualizado correctamente."}