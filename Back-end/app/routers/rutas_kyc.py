from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.db.sesion import get_db
import os

from ..servicios.servicio_kyc import (
    registrar_subida_en_bd, 
    generar_nombre_seguro, 
    es_extension_permitida,
    extraer_datos_venezuela,
    finalizar_proceso_kyc 
)
from configuracion import CARPETA_SUBIDAS, TAMANO_MAXIMO_ARCHIVO

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
router = APIRouter(prefix="/api/v1/kyc", tags=["KYC - Carga de Documentos"])

def obtener_id_usuario_actual(token: str = Depends(oauth2_scheme)) -> int:
    return 1 # SIMULACIÓN

@router.post('/documento', status_code=status.HTTP_201_CREATED)
async def subir_documento_kyc(
    documento: UploadFile = File(...), 
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_actual)
):
    if not es_extension_permitida(documento.filename):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido.")
    
    if documento.size > TAMANO_MAXIMO_ARCHIVO:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande.")

    nombre_seguro = generar_nombre_seguro(documento.filename)
    ruta_completa = os.path.join(CARPETA_SUBIDAS, nombre_seguro)
    
    try:
        # 1. Guardado físico
        with open(ruta_completa, "wb") as f:
            while chunk := await documento.read(1024 * 1024):
                f.write(chunk)

        # 2. EJECUCIÓN DEL MOTOR IA
        datos_estructurados = extraer_datos_venezuela(ruta_completa)

        # 3. Registro Inicial en BD
        solicitud_bd = registrar_subida_en_bd(
            db=db, 
            user_id=id_usuario, 
            nombre_archivo=nombre_seguro
        )

        # 4. PERSISTENCIA Y DECISIÓN
        resultado_validacion = finalizar_proceso_kyc(
            db=db,
            id_usuario=id_usuario,
            id_solicitud=solicitud_bd.id_documento,
            datos_ia=datos_estructurados
        )

        # 5. Respuesta
        texto_debug = datos_estructurados.pop("texto_crudo_debug", "No disponible")

        return {
            "mensaje": resultado_validacion["mensaje"],
            "id_documento": solicitud_bd.id_documento,
            "estado_final": resultado_validacion["nuevo_estado"], 
            "resultado_ia": {
                "pais": "Venezuela",
                "datos_encontrados": datos_estructurados,
            }
        }

    except Exception as e:
        if os.path.exists(ruta_completa):
            try:
                os.remove(ruta_completa)
            except: pass
        print(f"Error en endpoint KYC: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")