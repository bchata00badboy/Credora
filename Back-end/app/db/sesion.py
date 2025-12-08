# app/db/sesion.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .modelos import Base
from configuracion import DB_URL

# 1. Crea el motor con configuración de codificación para Windows
# Forzamos client_encoding=utf8 para evitar el UnicodeDecodeError
engine = create_engine(
    DB_URL, 
    connect_args={'options': '-c client_encoding=utf8'},
    echo=True
)

# 2. Crea todas las tablas con manejo de errores
try:
    print("Iniciando conexión con PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"Error crítico al conectar a la base de datos: {e}")

# 3. Configura la sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Función de dependencia para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()