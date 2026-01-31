# Back-end\app\Controllers\sql.py

import os
import psycopg2
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv()

# --- Obtener credenciales ---
DB_USER = "postgres"
DB_PASSWORD = "OAa$0512"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "Credora"

# --- Lógica de Conexión ---
try:
    # Intenta establecer la conexión
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME
    )
    
    # Crea un cursor para ejecutar comandos
    cursor = conn.cursor()
    
    # Comando de prueba: obtener la versión de PostgreSQL
    cursor.execute("SELECT version();")
    db_version = cursor.fetchone()[0]
    
    # --- RESULTADO ESPERADO ---
    print(" CONEXIÓN EXITOSA A POSTGRESQL.")
    print(f"Versión de la Base de Datos: {db_version}")

    # Cierre limpio
    cursor.close()
    conn.close()

except psycopg2.OperationalError as e:
    # Este error ocurre si la DB no está corriendo o las credenciales son incorrectas
    print("c ERROR CRÍTICO: FALLÓ LA CONEXIÓN.")
    print("Detalle: {e}")
    print("\nAcciones Requeridas: 1. Verifica que PostgreSQL esté corriendo. 2. Revisa las credenciales en .env.")

except Exception as e:
    # Otros errores
    print(" ERROR INESPERADO: {e}")