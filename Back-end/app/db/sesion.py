# app/db/sesion.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .modelos import Base # Importamos la clase base de los modelos (P1.1)
from configuracion import DB_URL # Importamos la URL de tu .env

# 1. Crea el motor de Base de Datos
# El 'echo=True' es opcional, muestra las consultas SQL en consola (útil para debug)
engine = create_engine(DB_URL)

# 2. Crea todas las tablas en la Base de Datos (si no existen)
# Esto garantiza que el DDL (P1.1) se ejecute al inicio
Base.metadata.create_all(bind=engine)

# 3. Configura la sesión de la Base de Datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Función de dependencia para FastAPI (La función 'get_db')
def get_db():
    """Retorna una sesión de BD para la ruta y la cierra al finalizar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()