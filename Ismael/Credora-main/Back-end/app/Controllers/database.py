import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Credenciales de tu .env
DB_USER = "postgres"
DB_PASSWORD = "OAa$0512"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "Credora"

def get_db_connection():
    """Generador que proporciona una conexión a la DB para FastAPI."""
    conn = None
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME
        )
        # Retorna la conexión para ser usada en el endpoint
        yield conn
    finally:
        # Esto se ejecuta después de que el endpoint finaliza, asegurando el cierre
        if conn:
            conn.close()