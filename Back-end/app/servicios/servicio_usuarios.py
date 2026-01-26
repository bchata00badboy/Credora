# Back-end\app\servicios\servicio_usuarios.py

from sqlalchemy.orm import Session
from typing import Optional

# Importaciones de seguridad
from ..seguridad.hashing import hash_password, verificar_password

# Importaciones de esquemas y modelos
from app.db.modelos import Usuario, Cuenta
from app.esquemas.esquema_usuario import EsquemaRegistro

import random

# ----------------------------------------------------------------------
# Lógica de Creación de Usuario (Registro)
# ----------------------------------------------------------------------

# --- FUNCIONES GENERADORAS ---
def generar_numero_cuenta():
    # Formato estilo banco: 0102 + 16 dígitos aleatorios
    prefijo = "0102" 
    cuerpo = ''.join([str(random.randint(0, 9)) for _ in range(16)])
    return f"{prefijo}{cuerpo}"

def generar_numero_tarjeta():
    # Formato Visa: 4000 + 12 dígitos aleatorios
    prefijo = "4000"
    cuerpo = ''.join([str(random.randint(0, 9)) for _ in range(12)])
    return f"{prefijo}{cuerpo}"
# -----------------------------

def crear_usuario(db: Session, datos_registro: EsquemaRegistro) -> Usuario:
    """
    Crea un usuario nuevo con saldo 0, cuenta y tarjeta generadas.
    """
    # 1. Encriptar contraseña
    contrasena_hasheada = hash_password(datos_registro.contrasena)
    
    # 2. Generar datos bancarios únicos
    # (En un sistema real, validaríamos que no se repitan con un while loop)
    nuevo_cuenta = generar_numero_cuenta()
    nueva_tarjeta = generar_numero_tarjeta()

    # 3. Crear objeto Usuario
    nuevo_usuario = Usuario(
        nombre_completo=datos_registro.nombre_completo,
        correo=datos_registro.correo,
        hash_contrasena=contrasena_hasheada,
        
        # Guardamos los nuevos datos generados
        numero_cuenta=nuevo_cuenta,   # <--- GUARDAMOS EN BD
        numero_tarjeta=nueva_tarjeta  # <--- GUARDAMOS EN BD
    )
    
    # 4. Guardar en Base de Datos
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    nueva_billetera = Cuenta(
        id_usuario=nuevo_usuario.id_usuario,
        saldo=100.00, # <--- BONO DE BIENVENIDA
        moneda='USD'
    )
    
    db.add(nueva_billetera)
    db.commit()
    
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
    #  CORRECCIÓN FINAL: Se usa el nombre del atributo 'hash_contrasena'
    if not verificar_password(password, usuario_bd.hash_contrasena): 
        return None # Contraseña incorrecta (el hash no coincide)

    return usuario_bd