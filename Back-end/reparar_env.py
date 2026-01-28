import os

# Contenido LIMPIO y SEGURO para el .env
contenido_env = """# .env REPARADO
SECRET_KEY=CLAVE_SEGURA_CREDORA_2026_JWT
# Nota: El signo $ de la contrasena se escribe %24
DB_URL=postgresql://postgres:OAa%240512@localhost:5432/Credora
"""

ruta_env = os.path.join(os.path.dirname(__file__), ".env")

# Forzamos la escritura en UTF-8
try:
    with open(ruta_env, "w", encoding="utf-8") as f:
        f.write(contenido_env)
    print(" Archivo .env reparado y guardado en UTF-8 correctamente.")
    print(f"Ubicación: {ruta_env}")
except Exception as e:
    print(f" Error al guardar: {e}")