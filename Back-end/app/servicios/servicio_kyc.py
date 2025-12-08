import os
import uuid
from typing import Optional
from sqlalchemy.orm import Session

# Importaciones de infraestructura y modelos (P1.1 y P1.2)
from ..db.modelos import SolicitudKYC, EstadoKYC
from configuracion import CARPETA_SUBIDAS, EXTENSIONES_PERMITIDAS # Importaciones de nivel superior

# --- Importaciones de OCR (P2.3) ---
import pytesseract
from PIL import Image # Pillow
# -----------------------------------


# ====================================================================
# I. Lógica de Archivos (P1.2)
# ====================================================================

def es_extension_permitida(nombre_archivo: str) -> bool:
    """Verifica si la extensión del archivo está en la lista blanca."""
    if '.' not in nombre_archivo:
        return False
    return nombre_archivo.rsplit('.', 1)[1].lower() in EXTENSIONES_PERMITIDAS

def generar_nombre_seguro(nombre_archivo_original: str) -> str:
    """Genera un nombre seguro utilizando UUID."""
    file_uuid = str(uuid.uuid4())
    file_extension = nombre_archivo_original.rsplit('.', 1)[1].lower()
    return f"{file_uuid}.{file_extension}"


# ====================================================================
# II. Lógica de Base de Datos (P2.2)
# ====================================================================

def registrar_subida_en_bd(db: Session, user_id: int, nombre_archivo: str) -> SolicitudKYC:
    """Crea un nuevo registro en la tabla SolicitudKYC."""
    
    # Crea el registro inicial. El estado es PENDIENTE_OCR
    nueva_solicitud = SolicitudKYC(
        id_usuario=user_id,
        nombre_archivo_seguro=nombre_archivo,
        estado=EstadoKYC.PENDIENTE_OCR
    )
    
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud)
    
    return nueva_solicitud


# ====================================================================
# III. Lógica del Motor OCR (P2.3)
# ====================================================================

def procesar_ocr(db: Session, solicitud_id: int) -> dict:
    """
    Toma una solicitud de KYC, lee el archivo de imagen con OCR, 
    y retorna el texto extraído.
    """
    
    solicitud = db.query(SolicitudKYC).filter(SolicitudKYC.id_documento == solicitud_id).first()
    
    if not solicitud:
        return {"error": "Solicitud no encontrada."}

    nombre_archivo = solicitud.nombre_archivo_seguro
    ruta_completa = os.path.join(CARPETA_SUBIDAS, nombre_archivo)

    try:
        # Asegúrate de que Tesseract esté en el PATH del sistema o especifica la ruta
        # Ejemplo (si falla el PATH): pytesseract.pytesseract.tesseract_cmd = r'C:\ruta\a\tesseract.exe'
        
        imagen = Image.open(ruta_completa)
        
        # Extracción de texto: Usamos 'spa' para el idioma español
        texto_extraido = pytesseract.image_to_string(imagen, lang='spa') 
        
        # 4. Actualizar estado y guardar texto en la BD (P1.1)
        # Usamos JSONB para guardar el resultado crudo del texto
        solicitud.datos_ocr_json = {"texto_crudo": texto_extraido.strip()}
        solicitud.estado = EstadoKYC.PENDIENTE_VERIFICACION 
        db.commit()
        
        return {
            "mensaje": "OCR exitoso", 
            "texto": texto_extraido[:150].strip() + "...", # Retornamos un fragmento
            "estado": solicitud.estado
        }

    except pytesseract.TesseractNotFoundError:
        return {"error": "Motor OCR (Tesseract) no disponible. Verifique la instalación."}
        
    except Exception as e:
        return {"error": f"Fallo al procesar la imagen con OCR o al acceder al archivo: {e}"}