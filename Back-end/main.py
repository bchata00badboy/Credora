# main.py (Punto de Entrada)

from fastapi import FastAPI
# 1. Importamos la función de inicialización de nuestro módulo de configuración
from configuracion import inicializar_almacenamiento, CARPETA_SUBIDAS 
# Asumiendo que definimos el resto de la app en routers/

app = FastAPI(title="Credora - Billetera Educativa")

# Esto es una buena práctica de ingeniería de sistemas: 
# asegurar la infraestructura antes de que el servidor se inicie.
@app.on_event("startup")
def setup_proyecto():
    """Función que se ejecuta una sola vez al iniciar el servidor."""
    
    # 2. Llamamos a la función de la P1.2 aquí:
    if inicializar_almacenamiento():
        print("✅ P1.2 COMPLETA: Almacenamiento listo.")
    else:
        # En un sistema real, esto detendría el arranque
        print("❌ Error de infraestructura, no se pudo crear la carpeta.") 

    # Aquí irían otras inicializaciones (ej. la conexión a la BD)

# Aquí se incluyen los routers (Fase 2)
# app.include_router(rutas_kyc.router) 

# El bloque de ejecución final (si usas main.py para correr)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)