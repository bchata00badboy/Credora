# app/routers/rutas_autenticacion.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Importaciones de la BD y Modelos
from app.db.sesion import get_db
from app.db.modelos import Usuario

# Importaciones de Esquemas (Modelos Pydantic)
from app.esquemas.esquema_usuario import EsquemaRegistro, EsquemaLogin, EsquemaUsuario 

# Importaciones de Servicios y Seguridad
from app.servicios.servicio_usuarios import crear_usuario, autenticar_usuario # <-- Aquí se importa la función corregida
from app.seguridad.jwt_utils import crear_token_acceso


router = APIRouter(prefix="/auth", tags=["Autenticacion"])

# ----------------------------------------------------------------------
# 1. Registro de Usuario
# ----------------------------------------------------------------------
@router.post("/registro", response_model=EsquemaUsuario, status_code=status.HTTP_201_CREATED)
def registro_usuario(datos: EsquemaRegistro, db: Session = Depends(get_db)):
    """
    Crea un nuevo usuario y verifica si el correo ya existe.
    """
    db_usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    
    if db_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    return crear_usuario(db, datos)


# ----------------------------------------------------------------------
# 2. Login y Generación de Token JWT
# ----------------------------------------------------------------------
@router.post("/token")
def login_para_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Autentica al usuario y retorna un token JWT.
    Espera los datos de login en formato x-www-form-urlencoded (username/password).
    """
    # Llama al servicio con los 3 argumentos (db, username, password)
    usuario = autenticar_usuario(db, form_data.username, form_data.password)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # El token se crea usando el ID del usuario
    access_token = crear_token_acceso(data={"sub": str(usuario.id_usuario)})
    
    return {"access_token": access_token, "token_type": "bearer"}