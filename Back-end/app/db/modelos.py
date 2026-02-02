# Back-end\app\db\sesion.py

import enum
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

# --- CONFIGURACIÓN BASE DE SQLAlchemy ---
Base = declarative_base()

# --- ENUMS ---
class EstadoKYC(str, enum.Enum):
    PENDIENTE_VERIFICACION = 'PENDIENTE_VERIFICACION'
    PENDIENTE_OCR = 'PENDIENTE_OCR'
    RECHAZADO = 'RECHAZADO'
    APROBADO = 'APROBADO'

# ----------------------------------------------------------------------
# 1. Tabla de Usuarios
# ----------------------------------------------------------------------
class Usuario(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, index=True)
    rol = Column(String(20), default='cliente', nullable=False)
    nombre_completo = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    # Nota: Asegúrate de que tu login use este nombre de columna
    hash_contrasena = Column(String(255), nullable=False) 
    fecha_registro = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # --- DATOS BANCARIOS ---
    numero_cuenta = Column(String(30), unique=True, nullable=True) 
    numero_tarjeta = Column(String(20), unique=True, nullable=True)
    
    # --- DATOS PERSONALES & KYC ---
    cedula = Column(String, unique=True, nullable=True) 
    direccion = Column(Text, nullable=True)
    telefono = Column(String(20), nullable=True)
    ocupacion = Column(String(50), nullable=True)
    nivel_estudio = Column(String(50), nullable=True)
    
    # Estado de Verificación (NECESARIO PARA EL DASHBOARD)
    # Usamos String por simplicidad, pero puedes usar Enum si prefieres
    estado_kyc = Column(String, default='PENDIENTE') 
    
    es_cuenta_negocio = Column(Boolean, default=False)
    
    # --- SEGURIDAD ---
    # El PIN para autorizar transferencias
    pin_seguridad = Column(String(4), default="1234") 
    
    # --- VERIFICACIÓN Y SEGURIDAD ---
    codigo_verificacion = Column(String(6), nullable=True) # El código de 6 dígitos
    correo_verificado = Column(Boolean, default=False)
    
    rol = Column(String(20), default='cliente', nullable=False)
    esta_bloqueado = Column(Boolean, default=False)

    # Relaciones
    cuenta = relationship("Cuenta", back_populates="usuario", uselist=False)
    solicitudes_kyc = relationship("SolicitudKYC", back_populates="usuario")

# ----------------------------------------------------------------------
# 2. Tabla de Categorías
# ----------------------------------------------------------------------
class Categoria(Base):
    __tablename__ = 'categoria'
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    tipo = Column(String(15), nullable=False) 

# ----------------------------------------------------------------------
# 3. Tabla de Cuentas (Billetera)
# ----------------------------------------------------------------------
class Cuenta(Base):
    __tablename__ = 'cuenta'
    id_cuenta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), unique=True, nullable=False)
    saldo = Column(Numeric(15, 2), default=0.00, nullable=False)
    moneda = Column(String(3), default='USD')
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relación
    usuario = relationship("Usuario", back_populates="cuenta")

# ----------------------------------------------------------------------
# 4. Tabla de Transacciones (MODIFICADA PARA TRANSFERENCIAS)
# ----------------------------------------------------------------------
class Transaccion(Base):
    __tablename__ = 'transaccion'
    id_transaccion = Column(Integer, primary_key=True, index=True)
    referencia = Column(String(8), unique=True, index=True, nullable=False)
    
    # Soporte para P2P (Remitente y Destinatario)
    remitente_id = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=True)
    destinatario_id = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=True)
    
    # Campos opcionales para compatibilidad con gastos personales
    id_categoria = Column(Integer, ForeignKey('categoria.id_categoria'), nullable=True)
    id_negocio = Column(Integer, ForeignKey('negocio.id_negocio'), nullable=True)
    
    monto = Column(Numeric(15, 2), nullable=False)
    motivo = Column(Text) # Descripción o concepto
    estado = Column(String(20), default="COMPLETADO")
    fecha = Column(DateTime(timezone=True), default=datetime.utcnow)

# ----------------------------------------------------------------------
# 5. Tabla de Solicitudes KYC
# ----------------------------------------------------------------------
class SolicitudKYC(Base):
    __tablename__ = 'solicitudkyc'
    id_documento = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), nullable=False)
    nombre_archivo_seguro = Column(String(255), unique=True, nullable=False)
    
    # JSONB requiere PostgreSQL. Si usas SQLite para pruebas, cambia a String.
    datos_ocr_json = Column(JSONB, nullable=True) 
    
    # Usamos el Enum definido arriba, o String si da problemas de migración
    estado = Column(String, default='PENDIENTE_OCR') 
    fecha_subida = Column(DateTime(timezone=True), default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="solicitudes_kyc")

# ----------------------------------------------------------------------
# 6. Tablas Adicionales (Negocio, Metas, Educación)
# ----------------------------------------------------------------------
class Negocio(Base):
    __tablename__ = 'negocio'
    id_negocio = Column(Integer, primary_key=True, index=True)
    id_usuario_dueno = Column(Integer, ForeignKey('usuario.id_usuario'))
    nombre_publico = Column(String(100), nullable=False)
    tipo_negocio = Column(String(50))
    cuenta_destino = Column(String(50)) 

class MetaFinanciera(Base):
    __tablename__ = 'metafinanciera'
    id_meta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), nullable=False)
    nombre_meta = Column(String(100), nullable=False)
    monto_objetivo = Column(Numeric(15, 2), nullable=False)
    monto_actual = Column(Numeric(15, 2), default=0.00, nullable=False)
    fecha_limite = Column(DateTime)
    estado = Column(String(20), default='En Progreso') 

class ContenidoEducativo(Base):
    __tablename__ = 'contenidoeducativo'
    id_contenido = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100), nullable=False)
    cuerpo_texto = Column(Text)
    nivel_dificultad = Column(String(20))
    puntos_recompensa = Column(Integer, default=10)