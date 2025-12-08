# app/esquemas/esquema_usuario.py

from pydantic import BaseModel, EmailStr
from typing import Optional

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
        from_attributes = True