from pydantic import BaseModel, EmailStr
from typing import Optional

# ----------------------------------------------------------------------
# 1. Esquema del Token (ESTO ES LO QUE FALTABA)
# ----------------------------------------------------------------------
class EsquemaToken(BaseModel):
    access_token: str
    token_type: str

# ----------------------------------------------------------------------
# 2. Esquemas de Usuario
# ----------------------------------------------------------------------

# Esquema para la creación de un nuevo usuario
class EsquemaRegistro(BaseModel):
    nombre_completo: str
    correo: EmailStr
    contrasena: str

# Esquema para el login (solo correo y contraseña)
class EsquemaLogin(BaseModel):
    correo: EmailStr
    contrasena: str

# Esquema de respuesta para el usuario
class EsquemaUsuario(BaseModel):
    id_usuario: int
    correo: EmailStr
    nombre_completo: str

    class Config:
        # Permite mapear campos del ORM (BD) al esquema Pydantic
        # Nota: Si usas Pydantic v2 es 'from_attributes', si es v1 es 'orm_mode'
        from_attributes = True