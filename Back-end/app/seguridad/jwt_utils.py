from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

# --- IMPORTACIÓN DE CLAVE SECRETA ---
try:
    # Intenta importar desde configuracion
    from ..configuracion import SECRET_KEY
except ImportError:
    # Fallback si falla la importación
    SECRET_KEY = os.getenv("SECRET_KEY", "CLAVE_MUY_SECRETA_POR_DEFECTO")


# --- CONFIGURACIÓN DEL TOKEN ---
# CAMBIO CRÍTICO: Renombrado de ALGORITMO a ALGORITHM (Inglés)
# Esto es lo que 'dependencias.py' está buscando importar.
ALGORITHM = "HS256"

# El token expira después de 30 días
TIEMPO_EXPIRACION = timedelta(days=30) 

def crear_token_acceso(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Genera un token JWT firmado.
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
    
    # 4. Codificar usando ALGORITHM (el nombre corregido)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decodificar_token(token: str) -> Optional[dict]:
    """
    Decodifica y verifica la firma del token.
    """
    try:
        # Usamos ALGORITHM (el nombre corregido)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None