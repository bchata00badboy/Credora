from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Importaciones del proyecto
from app.db.sesion import get_db
from app.servicios.servicio_usuarios import crear_usuario, autenticar_usuario
from app.seguridad.jwt_utils import crear_token_acceso

# --- AQUÍ ESTABA EL ERROR: Agregamos EsquemaUsuario a la lista ---
from app.esquemas.esquema_usuario import EsquemaRegistro, EsquemaToken, EsquemaUsuario

router = APIRouter()

# --------------------------------------------------------------------------
# 1. REGISTRO DE USUARIOS
# URL Final: POST /api/v1/auth/registro
# --------------------------------------------------------------------------
@router.post("/registro", response_model=EsquemaUsuario)
def registro_usuario(datos: EsquemaRegistro, db: Session = Depends(get_db)):
    # Intentamos crear el usuario
    # La función crear_usuario ya maneja la lógica de BD
    try:
        nuevo_usuario = crear_usuario(db, datos)
        return nuevo_usuario
    except Exception as e:
        # Si falla (ej: correo duplicado), lanzamos error 400
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar: {str(e)}"
        )

# --------------------------------------------------------------------------
# 2. LOGIN (OBTENER TOKEN)
# URL Final: POST /api/v1/auth/token
# --------------------------------------------------------------------------
@router.post("/token", response_model=EsquemaToken)
def login_para_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # form_data.username contiene el correo
    # form_data.password contiene la contraseña
    
    usuario = autenticar_usuario(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token JWT
    tiempo_expiracion = timedelta(minutes=60) # 1 hora de sesión
    token_jwt = crear_token_acceso(
        data={"sub": str(usuario.id_usuario)}, # Guardamos el ID en el token
        expires_delta=tiempo_expiracion
    )
    
    return {
        "access_token": token_jwt, 
        "token_type": "bearer"
    }