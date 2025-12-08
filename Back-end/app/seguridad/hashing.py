# app/seguridad/hashing.py (VERSION FINAL FUNCIONAL)

from passlib.context import CryptContext

# CAMBIO CRÍTICO: Usamos sha256_crypt para evitar el bug de inicialización de bcrypt
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto") 

def hash_password(password: str) -> str:
    """
    Retorna el hash seguro de una contraseña plana (texto).
    """
    # Ya no es necesario el truncamiento [:72] con sha256_crypt
    return pwd_context.hash(password) 

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña plana coincide con el hash almacenado en la BD.
    """
    # Ya no es necesario el truncamiento [:72] con sha256_crypt
    return pwd_context.verify(plain_password, hashed_password)