# app/seguridad/jwt_utils.py

from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

# --- IMPORTACIÓN DE CLAVE SECRETA ---
# Asumiendo que configuracion.py está un nivel arriba de 'seguridad'
# y la SECRET_KEY se lee desde el .env
# Nota: Si el import directo falla, usa una variable de entorno como fallback
try:
    from ..configuracion import SECRET_KEY
except ImportError:
    # Fallback si no se puede importar la configuración directamente
    # En un entorno real, la aplicación fallaría si no encuentra esta clave
    SECRET_KEY = os.getenv("SECRET_KEY", "CLAVE_MUY_SECRETA_POR_DEFECTO")


# --- CONFIGURACIÓN DEL TOKEN ---
ALGORITMO = "HS256"
# El token expira después de 30 días, un valor razonable para una aplicación móvil/web
TIEMPO_EXPIRACION = timedelta(days=30) 

def crear_token_acceso(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Genera un token JWT firmado.
    El 'data' debe contener el 'sub' (correo) y 'user_id' del usuario.
    """
    
    # 1. Copiar los datos (payload/claims)
    to_encode = data.copy()
    
    # 2. Definir el tiempo de expiración
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + TIEMPO_EXPIRACION
    
    # 3. Agregar el tiempo de expiración al payload (claim 'exp')
    to_encode.update({"exp": expire})
    
    # 4. Codificar (firmar) el token usando la clave secreta
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITMO)
    
    return encoded_jwt

def decodificar_token(token: str) -> Optional[dict]:
    """
    Decodifica y verifica la firma del token.
    Retorna el payload si es válido, None si falla.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
        return payload
    except JWTError:
        # Esto ocurre si el token es inválido, ha expirado, o la firma no coincide
        return None