from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List # <--- Necesitamos List

# P3.0 - Recarga
class EsquemaRecarga(BaseModel):
    monto: float = Field(..., gt=0, description="El monto debe ser mayor a 0")

# P3.1 - Transferencia
class EsquemaTransferencia(BaseModel):
    correo_destino: EmailStr
    monto: float = Field(..., gt=0, description="El monto debe ser positivo")
    descripcion: Optional[str] = "Transferencia"

# P3.1 - Registro de Negocio
class EsquemaRegistroNegocio(BaseModel):
    nombre_publico: str = Field(..., min_length=3, description="Nombre del comercio")
    tipo: str = Field(..., description="Rubro (ej. Alimentos, Tecnología)")

# P3.0 - Respuesta de Saldo
class EsquemaSaldo(BaseModel):
    saldo_actual: float
    moneda: str
    usuario: str
    cedula: Optional[str] = None

# P3.2 - Estadísticas (NUEVO)
class DatoGrafico(BaseModel):
    categoria: str
    total: float

class EsquemaEstadisticas(BaseModel):
    gastos_por_categoria: List[DatoGrafico]
    total_ingresos: float
    total_egresos: float
    ahorro_neto: float
    
# P3.3Edición de Perfil
class EsquemaEditarPerfil(BaseModel):
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    ocupacion: Optional[str] = None
    nivel_estudio: Optional[str] = None
    
    # Validaciones opcionales (ej. longitud mínima)
    class Config:
        from_attributes = True