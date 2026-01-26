# Back-end\app\db\modelos.py

import enum
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

# --- CONFIGURACIÓN BASE DE SQLAlchemy ---
# Esta es la base de la que heredarán todas nuestras tablas
Base = declarative_base()

# --- DEFINICIÓN DE TIPOS PERSONALIZADOS ---

# Enum para el flujo de KYC (Alineado con el DDL V2.1)
class EstadoKYC(str, enum.Enum):
    PENDIENTE_VERIFICACION = 'PENDIENTE_VERIFICACION'
    PENDIENTE_OCR = 'PENDIENTE_OCR'
    RECHAZADO = 'RECHAZADO'
    APROBADO = 'APROBADO'

# ----------------------------------------------------------------------
# 1. Tabla de Usuarios (Actualizada para KYC)
# ----------------------------------------------------------------------
class Usuario(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    hash_contrasena = Column(String(255), nullable=False)
    fecha_registro = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # --- NUEVOS CAMPOS ---
    # Guardaremos estos datos al registrarse
    numero_cuenta = Column(String(30), unique=True, nullable=True) 
    numero_tarjeta = Column(String(20), unique=True, nullable=True)
    # ---------------------

    # ... (Resto de columnas existentes: cedula, direccion, telefono, etc.)
    cedula = Column(String, unique=True) 
    direccion = Column(Text)
    telefono = Column(String(20))
    ocupacion = Column(String(50))
    nivel_estudio = Column(String(50))
    es_cuenta_negocio = Column(Boolean, default=False)
    # estado_kyc ... (asegúrate de importar o definir el enum si lo usas aquí)

    # Relaciones (Mantener igual)
    cuenta = relationship("Cuenta", back_populates="usuario", uselist=False)
    solicitudes_kyc = relationship("SolicitudKYC", back_populates="usuario")

# ----------------------------------------------------------------------
# 2. Tabla de Categorías
# ----------------------------------------------------------------------
class Categoria(Base):
    __tablename__ = 'categoria'
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    tipo = Column(String(15), nullable=False) # 'Ingreso' o 'Egreso'

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
# 4. Tabla de Metas Financieras
# ----------------------------------------------------------------------
class MetaFinanciera(Base):
    __tablename__ = 'metafinanciera'
    id_meta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), nullable=False)
    nombre_meta = Column(String(100), nullable=False)
    monto_objetivo = Column(Numeric(15, 2), nullable=False)
    monto_actual = Column(Numeric(15, 2), default=0.00, nullable=False)
    fecha_limite = Column(DateTime)
    estado = Column(String(20), default='En Progreso') 

# ----------------------------------------------------------------------
# 5. Tabla de Negocios
# ----------------------------------------------------------------------
class Negocio(Base):
    __tablename__ = 'negocio'
    id_negocio = Column(Integer, primary_key=True, index=True)
    id_usuario_dueno = Column(Integer, ForeignKey('usuario.id_usuario'))
    nombre_publico = Column(String(100), nullable=False)
    tipo_negocio = Column(String(50))
    cuenta_destino = Column(String(50)) 

# ----------------------------------------------------------------------
# 6. Tabla de Transacciones (Central)
# ----------------------------------------------------------------------
class Transaccion(Base):
    __tablename__ = 'transaccion'
    id_transaccion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), nullable=False)
    id_categoria = Column(Integer, ForeignKey('categoria.id_categoria'), nullable=False)
    id_negocio = Column(Integer, ForeignKey('negocio.id_negocio'))
    monto = Column(Numeric(15, 2), nullable=False)
    descripcion = Column(Text)
    fecha_transaccion = Column(DateTime(timezone=True), default=datetime.utcnow)

# ----------------------------------------------------------------------
# 7. Tabla de Solicitudes KYC (P1.1 / P1.2)
# ----------------------------------------------------------------------
class SolicitudKYC(Base):
    __tablename__ = 'solicitudkyc'
    id_documento = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', ondelete="CASCADE"), nullable=False)
    nombre_archivo_seguro = Column(String(255), unique=True, nullable=False)
    datos_ocr_json = Column(JSONB) 
    estado = Column(Enum(EstadoKYC), default=EstadoKYC.PENDIENTE_OCR, nullable=False) 
    fecha_subida = Column(DateTime(timezone=True), default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="solicitudes_kyc")

# ----------------------------------------------------------------------
# 8. Contenido Educativo (P1.3)
# ----------------------------------------------------------------------
class ContenidoEducativo(Base):
    __tablename__ = 'contenidoeducativo'
    id_contenido = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100), nullable=False)
    cuerpo_texto = Column(Text)
    nivel_dificultad = Column(String(20))
    puntos_recompensa = Column(Integer, default=10)