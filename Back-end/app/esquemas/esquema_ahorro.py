from pydantic import BaseModel
from datetime import date, datetime

# Lo que recibimos al crear una meta
class MetaCreate(BaseModel):
    nombre: str
    objetivo: float
    fecha_limite: date

# Lo que recibimos al abonar dinero
class MetaAbono(BaseModel):
    monto: float

# Lo que respondemos al Frontend (para pintar la tarjeta)
class MetaResponse(BaseModel):
    id_meta: int
    nombre_meta: str
    monto_objetivo: float
    monto_actual: float
    fecha_limite: datetime
    estado: str
    
    class Config:
        from_attributes = True