# Back-end\app\servicios\servicio_kyc.py

import os
import uuid
import re
import easyocr
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Dict, Any, List

# Importamos los modelos para poder guardar en la BD
from ..db.modelos import Usuario, SolicitudKYC, EstadoKYC
from configuracion import CARPETA_SUBIDAS, EXTENSIONES_PERMITIDAS

# ====================================================================
# CONFIGURACIÓN IA
# ====================================================================
print("Inicializando EasyOCR...")
reader = easyocr.Reader(['es'], gpu=False)

# ====================================================================
# I. Lógica de Archivos y BD
# ====================================================================

def es_extension_permitida(nombre_archivo: str) -> bool:
    if '.' not in nombre_archivo: return False
    return nombre_archivo.rsplit('.', 1)[1].lower() in EXTENSIONES_PERMITIDAS

def generar_nombre_seguro(nombre_archivo_original: str) -> str:
    return f"{uuid.uuid4()}.{nombre_archivo_original.rsplit('.', 1)[1].lower()}"

def registrar_subida_en_bd(db: Session, user_id: int, nombre_archivo: str) -> SolicitudKYC:
    nueva_solicitud = SolicitudKYC(
        id_usuario=user_id, nombre_archivo_seguro=nombre_archivo, estado=EstadoKYC.PENDIENTE_OCR
    )
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud)
    return nueva_solicitud

# ====================================================================
# II. Motor Lógico: SOPORTE NATIVO PARA FORMATO MM/AAAA
# ====================================================================

def extraer_datos_venezuela(ruta_imagen: str) -> Dict[str, Any]:
    resultados = {
        "cedula": "No detectada",
        "nombre_completo": "No detectado",
        "fecha_nacimiento": None,
        "fecha_vencimiento": None,
        "edad": 0,
        "es_mayor_de_edad": False,
        "documento_vencido": None,
        "status_code": 400,
        "texto_crudo_debug": ""
    }

    try:
        # 1. EJECUCIÓN IA
        lectura_raw = reader.readtext(ruta_imagen)
        bloques = [b for b in lectura_raw if b[2] > 0.3]
        
        # Debug
        debug_lines = [f"{b[1]} (Conf: {b[2]:.2f})" for b in bloques]
        resultados["texto_crudo_debug"] = "\n".join(debug_lines)

        # --------------------------------------------------------
        # PASO 1: CÉDULA
        # --------------------------------------------------------
        y_cedula = 0
        regex_cedula = r'(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3})|\b(\d{7,8})\b'

        for (bbox, texto, prob) in bloques:
            texto_fix = texto.replace('O', '0').replace('B', '8')
            matches = re.findall(regex_cedula, texto_fix)
            for m in matches:
                raw = "".join(m)
                limpio = re.sub(r'\D', '', raw)
                if limpio.isdigit() and 1_000_000 <= int(limpio) <= 99_000_000:
                    resultados["cedula"] = limpio
                    y_cedula = bbox[2][1]
                    break
            if resultados["cedula"] != "No detectada": break

        # --------------------------------------------------------
        # PASO 2: FECHAS (Lógica Mixta: Completa y Corta)
        # --------------------------------------------------------
        y_fecha_nac_limite = 9999
        objs_fecha = []
        
        regex_full = r'(\d{2}[-/]\d{2}[-/]\d{4})'
        regex_short = r'(\d{2}[-/]\d{4})'
        
        for (bbox, texto, prob) in bloques:
            texto_temp = texto 
            
            # A. Buscar DD/MM/AAAA
            full_matches = re.finditer(regex_full, texto_temp)
            for m in full_matches:
                str_date = m.group(0)
                try:
                    dt = datetime.strptime(str_date.replace('-', '/'), "%d/%m/%Y")
                    if 1900 < dt.year <= 2100:
                        objs_fecha.append({'dt': dt, 'y': bbox[0][1], 'formato': 'completo'})
                        texto_temp = texto_temp.replace(str_date, " "*len(str_date))
                except: continue
            
            # B. Buscar MM/AAAA
            short_matches = re.finditer(regex_short, texto_temp)
            for m in short_matches:
                str_date = m.group(0)
                try:
                    dt = datetime.strptime("01/" + str_date.replace('-', '/'), "%d/%m/%Y")
                    if 2000 < dt.year <= 2100:
                        objs_fecha.append({'dt': dt, 'y': bbox[0][1], 'formato': 'corto'})
                except: continue

        if objs_fecha:
            objs_fecha_sorted = sorted(objs_fecha, key=lambda x: x['dt'])
            
            # 2.1 NACIMIENTO
            nacimiento_data = objs_fecha_sorted[0]
            if nacimiento_data['formato'] == 'completo':
                resultados["fecha_nacimiento"] = nacimiento_data['dt'].strftime("%d/%m/%Y")
            else:
                resultados["fecha_nacimiento"] = nacimiento_data['dt'].strftime("%m/%Y")
            
            y_fecha_nac_limite = nacimiento_data['y']
            
            hoy = datetime.now()
            f_nac = nacimiento_data['dt']
            edad = hoy.year - f_nac.year - ((hoy.month, hoy.day) < (f_nac.month, f_nac.day))
            resultados["edad"] = edad
            resultados["es_mayor_de_edad"] = edad >= 18
            resultados["status_code"] = 200

            # 2.2 VENCIMIENTO
            if len(objs_fecha_sorted) > 1:
                vencimiento_data = objs_fecha_sorted[-1]
                if vencimiento_data['formato'] == 'corto':
                    resultados["fecha_vencimiento"] = vencimiento_data['dt'].strftime("%m/%Y")
                else:
                    resultados["fecha_vencimiento"] = vencimiento_data['dt'].strftime("%d/%m/%Y")

                venc_year = vencimiento_data['dt'].year
                venc_month = vencimiento_data['dt'].month
                
                if venc_year > hoy.year:
                    resultados["documento_vencido"] = False
                elif venc_year == hoy.year and venc_month >= hoy.month:
                    resultados["documento_vencido"] = False
                else:
                    resultados["documento_vencido"] = True
            else:
                resultados["fecha_vencimiento"] = "No detectada"
                resultados["documento_vencido"] = None

        # --------------------------------------------------------
        # PASO 3: NOMBRE
        # --------------------------------------------------------
        nombres_detectados = []
        apellidos_detectados = []
        
        for i, (bbox, texto, prob) in enumerate(bloques):
            texto_upper = texto.upper()
            if "NOMBRES" in texto_upper and (i + 1) < len(bloques):
                sig = bloques[i+1][1]
                if len(sig) > 2 and not any(c.isdigit() for c in sig):
                     nombres_detectados.append(sig)

            if "APELLIDOS" in texto_upper and (i + 1) < len(bloques):
                sig = bloques[i+1][1]
                if len(sig) > 2 and not any(c.isdigit() for c in sig):
                     apellidos_detectados.append(sig)

        if not nombres_detectados and not apellidos_detectados:
            if resultados["cedula"] != "No detectada":
                candidatos = []
                for (bbox, texto, prob) in bloques:
                    y_centro = (bbox[0][1] + bbox[2][1]) / 2
                    if (y_cedula + 10) < y_centro < (y_fecha_nac_limite - 10):
                        t_clean = re.sub(r'[^A-Z\s]', '', texto.upper()).strip()
                        if len(t_clean) > 2 and "DIRECTOR" not in t_clean and "VENEZUELA" not in t_clean:
                            candidatos.append(t_clean)
                if candidatos:
                    resultados["nombre_completo"] = " ".join(candidatos)
        else:
            partes = []
            if nombres_detectados: partes.append(nombres_detectados[0])
            if apellidos_detectados: partes.append(apellidos_detectados[0])
            nombre_final = " ".join(partes).upper()
            resultados["nombre_completo"] = re.sub(r'[^A-Z\s]', '', nombre_final).strip()

    except Exception as e:
        print(f"Error procesando IA: {e}")
        return resultados

    return resultados

def finalizar_proceso_kyc(db: Session, id_usuario: int, id_solicitud: int, datos_ia: Dict[str, Any]):
    """
    Motor de Persistencia: Aprueba o Rechaza y actualiza al Usuario.
    """
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    solicitud = db.query(SolicitudKYC).filter(SolicitudKYC.id_documento == id_solicitud).first()

    if not usuario or not solicitud:
        return 

    aprobado = False
    motivo_rechazo = ""

    if datos_ia["cedula"] == "No detectada":
        motivo_rechazo = "No se pudo leer la cédula."
    elif not datos_ia["es_mayor_de_edad"]:
        motivo_rechazo = "Usuario menor de edad."
    elif datos_ia["documento_vencido"] is True:
        motivo_rechazo = "Documento de identidad vencido."
    elif datos_ia["nombre_completo"] == "No detectado":
        motivo_rechazo = "No se pudo validar el nombre."
    else:
        aprobado = True

    solicitud.datos_ocr_json = datos_ia

    if aprobado:
        print(f" KYC APROBADO para Usuario {id_usuario}")
        solicitud.estado = EstadoKYC.APROBADO
        usuario.estado_kyc = EstadoKYC.APROBADO
        usuario.nombre_completo = datos_ia["nombre_completo"]
        usuario.cedula = datos_ia["cedula"] 
    else:
        print(f" KYC RECHAZADO: {motivo_rechazo}")
        solicitud.estado = EstadoKYC.RECHAZADO
        usuario.estado_kyc = EstadoKYC.RECHAZADO

    db.commit()
    db.refresh(usuario)
    
    return {
        "aprobado": aprobado,
        "nuevo_estado": usuario.estado_kyc,
        "mensaje": "Verificación exitosa" if aprobado else f"Verificación fallida: {motivo_rechazo}"
    }