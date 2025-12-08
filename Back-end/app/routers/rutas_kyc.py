# app/routers/rutas_kyc.py

from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer # <-- NUEVA IMPORTACIÓN NECESARIA
from app.db.sesion import get_db
from sqlalchemy.orm import Session
# from ..db.sesion import get_db # Función para obtener la sesión de BD
# from ..seguridad.jwt_utils import obtener_usuario_actual # Función para obtener el ID del usuario del JWT

# Importamos la lógica de servicio y configuración
from ..servicios.servicio_kyc import registrar_subida_en_bd, generar_nombre_seguro, es_extension_permitida
from configuracion import CARPETA_SUBIDAS, TAMANO_MAXIMO_ARCHIVO


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

router = APIRouter(
    prefix="/api/v1/kyc",
    tags=["KYC - Carga de Documentos"]
)

# Simulamos la función para obtener el ID del usuario autenticado (usaría el JWT)
def obtener_id_usuario_actual(token: str = Depends(oauth2_scheme)) -> int:
    # Lógica real: decodificar el JWT y retornar el user_id
    return 1 # SIMULACIÓN TEMPORAL hasta implementar la dependencia JWT

@router.post('/documento', status_code=status.HTTP_201_CREATED)
async def subir_documento_kyc(
    documento: UploadFile = File(...), 
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_actual)
):
    # 1. Validación de Extensión y Tamaño (P1.2)
    if not es_extension_permitida(documento.filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                            detail="Tipo de archivo no permitido. Solo se aceptan imágenes.")
    
    if documento.size > TAMANO_MAXIMO_ARCHIVO:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="El archivo excede el límite de 2MB.")

    nombre_seguro = generar_nombre_seguro(documento.filename)
    ruta_completa = os.path.join(CARPETA_SUBIDAS, nombre_seguro)
    
    try:
        # 2. Guardado Físico en Disco (P1.2)
        # NOTA: Usamos un bloque with para asegurar que el archivo se cierre.
        with open(ruta_completa, "wb") as f:
            # Leer y escribir el contenido en fragmentos (chunks) para archivos grandes
            while chunk := await documento.read(1024 * 1024): # Lee en bloques de 1MB
                f.write(chunk)

        # 3. Registro en la Base de Datos (P1.1 / P2.2)
        solicitud_bd = registrar_subida_en_bd(
            db=db, 
            user_id=id_usuario, 
            nombre_archivo=nombre_seguro
        )

        return {
            "mensaje": "Documento subido y registrado, pendiente de verificación OCR.",
            "estado": solicitud_bd.estado,
            "id_documento": solicitud_bd.id_documento
        }

    except Exception as e:
        # Manejo de errores: Si la BD o el guardado falla, se borra el archivo subido.
        if os.path.exists(ruta_completa):
            os.remove(ruta_completa)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error en el servidor al procesar la subida: {e}")