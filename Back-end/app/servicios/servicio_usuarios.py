from sqlalchemy.orm import Session
from typing import Optional

# Importaciones de seguridad
from ..seguridad.hashing import hash_password, verificar_password

# Importaciones de esquemas y modelos
from app.db.modelos import Usuario # Se asume que importaste Usuario correctamente
from app.esquemas.esquema_usuario import EsquemaRegistro

# ----------------------------------------------------------------------
# Lógica de Creación de Usuario (Registro)
# ----------------------------------------------------------------------

def crear_usuario(db: Session, datos_registro: EsquemaRegistro) -> Usuario:
    """
    Hashea la contraseña y guarda un nuevo usuario en la base de datos.
    """
    # 1. Hash de la contraseña
    contrasena_hasheada = hash_password(datos_registro.contrasena)
    
    # 2. Creación del nuevo usuario en la BD
    nuevo_usuario = Usuario(
        nombre_completo=datos_registro.nombre_completo,
        correo=datos_registro.correo,
        # CORRECCIÓN: Usando 'password_hash' para el campo de la BD
        password_hash=contrasena_hasheada 
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# ----------------------------------------------------------------------
# Lógica de Autenticación de Usuario (LOGIN)
# ----------------------------------------------------------------------

def autenticar_usuario(db: Session, correo: str, password: str) -> Optional[Usuario]:
    """
    Busca un usuario por correo y verifica la contraseña.
    Retorna el objeto Usuario si las credenciales son válidas, sino None.
    """
    
    # 1. Buscar el usuario por correo
    usuario_bd = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    if not usuario_bd:
        return None # Usuario no encontrado

    # 2. Verificar la contraseña
    # CORRECCIÓN: Se usa el nombre del atributo 'password_hash'
    if not verificar_password(password, usuario_bd.password_hash): 
        return None # Contraseña incorrecta (el hash no coincide)

    return usuario_bd