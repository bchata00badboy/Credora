# app/dependencias.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.db.sesion import get_db
from app.db.modelos import Usuario, EstadoKYC
from app.seguridad.jwt_utils import SECRET_KEY, ALGORITHM # Asegúrate de tener estas variables accesibles

# 1. Esquema de seguridad (Le dice a Swagger que necesitamos un token Bearer)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# 2. Función para obtener el usuario desde el Token
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificamos el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Buscamos al usuario en la BD
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if usuario is None:
        raise credentials_exception
        
    return usuario

# 3. EL GUARDIA DE SEGURIDAD (KYC)
def requerir_kyc_aprobado(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    """
    Esta función verifica si el usuario tiene el KYC APROBADO.
    Si no, lanza un error 403 y bloquea el paso.
    """
    if usuario_actual.estado_kyc != EstadoKYC.APROBADO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Acceso Restringido",
                "mensaje": "Esta función requiere verificación de identidad (KYC).",
                "estado_actual": usuario_actual.estado_kyc
            }
        )
    return usuario_actual