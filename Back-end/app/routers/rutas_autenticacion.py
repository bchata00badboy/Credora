# Back-end\app\routers\rutas_autenticacion.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import random
from fastapi.security import OAuth2PasswordBearer 
from app.seguridad.jwt_utils import decodificar_token 

from pydantic import BaseModel

# Importaciones del proyecto
from app.db.sesion import get_db
from app.db.modelos import Usuario, RegistroTemporal, Cuenta 
from app.servicios.servicio_usuarios import autenticar_usuario, obtener_hash_contrasena
from app.seguridad.jwt_utils import crear_token_acceso
from app.esquemas.esquema_usuario import EsquemaRegistro, EsquemaToken, EsquemaUsuario
from app.servicios.servicio_correo import enviar_codigo_registro, enviar_codigo_recuperacion

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# --------------------------------------------------------------------------
# 1. REGISTRO (AHORA SÍ USA TABLA TEMPORAL)
# --------------------------------------------------------------------------
@router.post("/registro")
def registro_usuario(datos: EsquemaRegistro, db: Session = Depends(get_db)):
    # A. Verificar si ya es usuario real
    if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
        raise HTTPException(status_code=400, detail="Este correo ya está registrado. Inicia sesión.")

    # B. Generar datos
    nuevo_codigo = str(random.randint(100000, 999999))
    hashed_password = obtener_hash_contrasena(datos.contrasena)

    # C. Verificar si ya está en temporal (actualizar código)
    registro_temp = db.query(RegistroTemporal).filter(RegistroTemporal.correo == datos.correo).first()
    
    if registro_temp:
        registro_temp.nombre_completo = datos.nombre_completo
        registro_temp.hash_contrasena = hashed_password
        registro_temp.codigo_verificacion = nuevo_codigo
        registro_temp.fecha_creacion = datetime.utcnow()
    else:
        # D. Crear nuevo registro temporal
        registro_temp = RegistroTemporal(
            correo=datos.correo,
            nombre_completo=datos.nombre_completo,
            hash_contrasena=hashed_password,
            codigo_verificacion=nuevo_codigo
        )
        db.add(registro_temp)
    
    try:
        db.commit()
        # Intentar enviar correo (sin bloquear si falla, para pruebas)
        enviar_codigo_registro(datos.correo, nuevo_codigo)
        return {"mensaje": "Código enviado. Revisa tu correo."}
    except Exception as e:
        db.rollback()
        print(f"Error registro: {e}")
        raise HTTPException(status_code=500, detail="Error interno al registrar.")

# --------------------------------------------------------------------------
# 2. VERIFICAR CÓDIGO (MIGRA DE TEMPORAL A REAL)
# --------------------------------------------------------------------------
@router.post("/verificar-cuenta")
def verificar_cuenta(correo: str = Body(...), codigo: str = Body(...), db: Session = Depends(get_db)):
    # 1. Buscar en Temporal
    temp_user = db.query(RegistroTemporal).filter(RegistroTemporal.correo == correo).first()
    
    if not temp_user:
        # Si no está en temporal, ¿quizás ya se verificó?
        if db.query(Usuario).filter(Usuario.correo == correo).first():
             return {"mensaje": "La cuenta ya está activa. Inicia sesión."}
        raise HTTPException(status_code=404, detail="No se encontró solicitud de registro (o expiró).")
        
    # 2. Validar Código
    if temp_user.codigo_verificacion != codigo:
        raise HTTPException(status_code=400, detail="Código incorrecto")
        
    # 3. CREAR USUARIO REAL
    nuevo_usuario = Usuario(
        nombre_completo=temp_user.nombre_completo,
        correo=temp_user.correo,
        hash_contrasena=temp_user.hash_contrasena,
        rol="cliente",
        correo_verificado=True, 
        estado_kyc="PENDIENTE"
    )
    db.add(nuevo_usuario)
    
    # 4. BORRAR TEMPORAL
    db.delete(temp_user)
    
    # 5. CREAR BILLETERA
    db.flush() # Obtener ID del usuario nuevo
    nueva_cuenta = Cuenta(
        id_usuario=nuevo_usuario.id_usuario,
        saldo=0.00,
        moneda="USD",
        id_cuenta=int(f"10{random.randint(10000000, 99999999)}") 
    )
    nuevo_usuario.numero_cuenta = str(nueva_cuenta.id_cuenta)
    db.add(nueva_cuenta)
    
    db.commit()
    return {"mensaje": "Verificación exitosa. ¡Bienvenido!"}

# --------------------------------------------------------------------------
# 3. SOLICITAR RECUPERACIÓN (OLVIDÉ CONTRASEÑA)
# --------------------------------------------------------------------------
@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(correo: str = Body(..., embed=True), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    # Por seguridad, si el correo no existe, decimos que se envió igual para no revelar usuarios
    if usuario:
        codigo = str(random.randint(100000, 999999))
        usuario.codigo_verificacion = codigo
        db.commit()
        enviar_codigo_recuperacion(usuario.correo, codigo)
        
    return {"mensaje": "Si el correo existe, se ha enviado un código de recuperación."}

# --------------------------------------------------------------------------
# 4. CAMBIAR CONTRASEÑA CON CÓDIGO
# --------------------------------------------------------------------------
@router.post("/restablecer-password")
def restablecer_password(
    correo: str = Body(...), 
    codigo: str = Body(...), 
    nueva_password: str = Body(...), 
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    
    if not usuario or usuario.codigo_verificacion != codigo:
        raise HTTPException(status_code=400, detail="Código inválido o usuario incorrecto")
        
    # Hash de la nueva clave
    usuario.hash_contrasena = obtener_hash_contrasena(nueva_password)
    usuario.codigo_verificacion = None # Quemar código
    db.commit()
    
    return {"mensaje": "Contraseña restablecida. Ya puedes iniciar sesión."}

# --------------------------------------------------------------------------
# 5. LOGIN (MODIFICADO PARA DEVOLVER EL ROL)
# --------------------------------------------------------------------------
@router.post("/token", response_model=EsquemaToken)
def login_para_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Autenticar
    usuario = autenticar_usuario(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales incorrectas"
        )

    # --- AGREGAR ESTA VALIDACIÓN DE BLOQUEO ---
    if usuario.esta_bloqueado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Tu cuenta ha sido bloqueada por un administrador. Contacta a soporte."
        )
    # ------------------------------------------
        
    # 2. Generar Token
    tiempo = timedelta(minutes=60)
    token = crear_token_acceso(data={"sub": str(usuario.id_usuario)}, expires_delta=tiempo)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "rol": usuario.rol
    }
    
# Agregar Esquema para cambio de PIN
class EsquemaCambioPin(BaseModel):
    old: str
    new: str

@router.post("/cambiar-pin")
def cambiar_pin_seguridad(
    datos: EsquemaCambioPin,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # 1. Verificar PIN actual (Por defecto es "1234")
    if usuario.pin_seguridad != datos.old:
        raise HTTPException(status_code=400, detail="El PIN actual es incorrecto.")
    
    # 2. Validar formato del nuevo PIN
    if len(datos.new) != 4 or not datos.new.isdigit():
        raise HTTPException(status_code=400, detail="El nuevo PIN debe ser de 4 dígitos numéricos.")

    # 3. Guardar
    usuario.pin_seguridad = datos.new
    db.commit()
    
    return {"mensaje": "PIN de seguridad actualizado correctamente."}