# Back-end/crear_admin.py
from app.db.sesion import SessionLocal, engine, Base
from app.db.modelos import Usuario
from app.seguridad.hashing import hash_password

# Asegurar que las tablas existan
Base.metadata.create_all(bind=engine)

def crear_super_admin():
    db = SessionLocal()
    
    email_admin = "admin@credora.com"
    pass_admin = "admin123" # Cambiar por una segura
    
    # Verificar si ya existe
    existe = db.query(Usuario).filter(Usuario.correo == email_admin).first()
    if existe:
        print(f"⚠️ El administrador {email_admin} ya existe.")
        return

    nuevo_admin = Usuario(
        nombre_completo="Administrador Principal",
        correo=email_admin,
        hash_contrasena=hash_password(pass_admin),
        rol="admin",  # <--- AQUÍ ESTÁ LA CLAVE
        
        # Datos dummy para cumplir con el modelo
        numero_cuenta="ADM-001",
        estado_kyc="APROBADO",
        correo_verificado=True
    )

    db.add(nuevo_admin)
    db.commit()
    print(f"✅ Administrador creado exitosamente: {email_admin}")
    db.close()

if __name__ == "__main__":
    crear_super_admin()