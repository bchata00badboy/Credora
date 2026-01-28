# app/db/sesion.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from configuracion import DB_URL
from .modelos import Base

# Creamos el motor de base de datos
# client_encoding=utf8 asegura compatibilidad
engine = create_engine(
    DB_URL, 
    connect_args={'options': '-c client_encoding=utf8'}
)

# Sesion local para las peticiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()