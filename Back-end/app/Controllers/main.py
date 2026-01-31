# Back-end\app\Controllers\main.py

# =================================================================
# 1. CONFIGURACIÓN DE ENTORNO Y RUTAS
# =================================================================
import sys
import os
# Fix para importar módulos locales desde la raíz
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import psycopg2
# Importamos la excepción correcta para errores de integridad (duplicados, FKs)
from psycopg2.errors import IntegrityError 

# IMPORTACIONES LOCALES
from security import hash_password, verify_password 
from database import get_db_connection 

# Definición de la dependencia de conexión
ConexionDB = Annotated[psycopg2.extensions.connection, Depends(get_db_connection)]

app = FastAPI(title="Credora API - Versión 2.0")

# =================================================================
# 2. MODELOS DE DATOS (PYDANTIC) - EN ESPAÑOL
# =================================================================

class UsuarioCrear(BaseModel):
    """Datos necesarios para registrar un usuario."""
    nombre_completo: str
    correo: EmailStr
    contrasena: str

class UsuarioLogin(BaseModel):
    """Datos para iniciar sesión."""
    correo: EmailStr
    contrasena: str

class TransaccionCrear(BaseModel):
    """Datos para registrar un movimiento de dinero."""
    id_usuario: int
    id_categoria: int
    monto: float
    descripcion: Optional[str] = None
    # id_negocio es opcional, se usará en Fase 3 para pagos a comercios
    id_negocio: Optional[int] = None 

# =================================================================
# 3. ENDPOINTS DE USUARIO (AUTH)
# =================================================================

@app.post("/usuario/registro", status_code=status.HTTP_201_CREATED)
def registrar_usuario(
    datos: UsuarioCrear,
    db: ConexionDB
):
    """
    Registra un usuario nuevo en la tabla 'Usuario' y crea su 'Cuenta' con saldo 0.
    """
    # 1. Hashear contraseña (seguridad)
    hash_final = hash_password(datos.contrasena)

    try:
        with db.cursor() as cursor:
            # 2. Insertar Usuario
            cursor.execute(
                """
                INSERT INTO Usuario (nombre_completo, correo, hash_contrasena)
                VALUES (%s, %s, %s) 
                RETURNING id_usuario;
                """,
                (datos.nombre_completo, datos.correo, hash_final)
            )
            nuevo_id_usuario = cursor.fetchone()[0]

            # 3. Crear Billetera (Cuenta) Automáticamente
            cursor.execute(
                """
                INSERT INTO Cuenta (id_usuario, saldo)
                VALUES (%s, 0.00);
                """,
                (nuevo_id_usuario,)
            )

        db.commit()
        return {
            "mensaje": "Usuario registrado y billetera creada.", 
            "id_usuario": nuevo_id_usuario
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado."
        )
    except Exception as e:
        db.rollback()
        print(f"Error CRITICO en registro: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")


@app.post("/usuario/login")
def login_usuario(
    datos: UsuarioLogin,
    db: ConexionDB
):
    """
    Verifica credenciales contra la tabla 'Usuario'.
    """
    try:
        with db.cursor() as cursor:
            # Buscamos por correo
            cursor.execute(
                """
                SELECT id_usuario, hash_contrasena, nombre_completo 
                FROM Usuario 
                WHERE correo = %s;
                """,
                (datos.correo,)
            )
            resultado = cursor.fetchone()

        if not resultado:
            # Por seguridad, no decimos si el correo existe o no
            raise HTTPException(status_code=401, detail="Credenciales inválidas.")

        id_bd, hash_bd, nombre_bd = resultado

        # Verificamos la contraseña
        if verify_password(datos.contrasena, hash_bd):
            return {
                "mensaje": "Login exitoso", 
                "id_usuario": id_bd,
                "nombre": nombre_bd
            }
        else:
            raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    except Exception as e:
        print(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

# =================================================================
# 4. ENDPOINTS DE TRANSACCIONES (CORE BANCARIO)
# =================================================================

@app.post("/transaccion/crear", status_code=status.HTTP_201_CREATED)
def crear_transaccion(
    datos: TransaccionCrear,
    db: ConexionDB
):
    """
    Registra una transacción y actualiza el saldo de la Cuenta atómicamente.
    """
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")

    try:
        with db.cursor() as cursor:
            # 1. Obtener el tipo de la categoría (Ingreso/Egreso)
            cursor.execute(
                "SELECT tipo FROM Categoria WHERE id_categoria = %s;",
                (datos.id_categoria,)
            )
            cat_resultado = cursor.fetchone()
            
            if not cat_resultado:
                raise HTTPException(status_code=404, detail="Categoría no encontrada.")

            tipo_operacion = cat_resultado[0] # 'Ingreso' o 'Egreso'
            
            # Determinamos si suma o resta
            factor = 1 if tipo_operacion == 'Ingreso' else -1
            
            # 2. Insertar la Transacción
            cursor.execute(
                """
                INSERT INTO Transaccion (id_usuario, id_categoria, id_negocio, monto, descripcion)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (datos.id_usuario, datos.id_categoria, datos.id_negocio, datos.monto, datos.descripcion)
            )

            # 3. Actualizar el Saldo de la Cuenta (Atomicidad)
            cursor.execute(
                """
                UPDATE Cuenta
                SET saldo = saldo + (%s * %s)
                WHERE id_usuario = %s;
                """,
                (datos.monto, factor, datos.id_usuario)
            )

        db.commit()
        return {
            "mensaje": "Transacción registrada exitosamente.",
            "tipo_operacion": tipo_operacion,
            "monto_aplicado": datos.monto * factor
        }

    except Exception as e:
        db.rollback()
        print(f"Error en transacción: {e}")
        raise HTTPException(status_code=500, detail="Error procesando la transacción.")