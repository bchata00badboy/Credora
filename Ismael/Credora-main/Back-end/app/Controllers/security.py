# security.py

from passlib.context import CryptContext

# CAMBIO CRÍTICO: Usar sha256_crypt en lugar de bcrypt
# sha256_crypt es un algoritmo más compatible y robusto para este entorno.
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Cifra la contraseña usando sha256_crypt."""
    # Eliminamos el slicing [:72] en bcrypt, aunque lo mantenemos aquí
    # por si la contraseña es extremadamente larga.
    return pwd_context.hash(password) 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña contra el hash sha256_crypt."""
    return pwd_context.verify(plain_password, hashed_password)