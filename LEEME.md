
# Proyecto Credora

## Descripción General

Proyecto Credora es una plataforma integral para la gestión financiera, ahorro, billetera digital, autenticación de usuarios y administración de procesos KYC (Know Your Customer). El sistema está compuesto por un Back-end robusto desarrollado en Python y un Front-end moderno basado en tecnologías web, permitiendo una experiencia de usuario fluida y segura.

---

## Estructura del Proyecto

```
Proyecto-Credora/
├── Back-end/
│   ├── app/
│   │   ├── Controllers/
│   │   ├── db/
│   │   ├── esquemas/
│   │   ├── routers/
│   │   ├── seguridad/
│   │   ├── servicios/
│   │   └── Sql/
│   ├── uploads/
│   ├── .env
│   ├── main.py
│   └── ...
├── Front-end/
│   ├── Src/
│   │   ├── Pages/
│   │   ├── Components/
│   │   ├── Assets/
│   │   ├── Styles/
│   │   ├── Utils/
│   │   └── ...
│   ├── Public/
│   └── pop_ups/
├── env/ (entorno virtual Python)
├── requirements.txt
├── package.json
└── LEEME.md
```

---

## Back-end

### Tecnologías y Arquitectura
- **Lenguaje:** Python 3.12
- **Framework principal:** FastAPI
- **ORM:** SQLAlchemy
- **Autenticación:** JWT, hashing seguro
- **Servicios adicionales:** Envío de correos, integración KYC, manejo de archivos
- **Base de datos:** Definida en `Sql/schema.sql` (puede ser SQLite, PostgreSQL, etc.)
- **Variables de entorno:** Configuradas en `.env`

### Distribución de Carpetas Clave
- **app/Controllers/**: Lógica de negocio, conexión a base de datos, seguridad y utilidades SQL.
- **app/db/**: Modelos ORM y gestión de sesiones de base de datos.
- **app/esquemas/**: Esquemas Pydantic para validación y serialización de datos.
- **app/routers/**: Rutas de la API RESTful (usuarios, ahorro, billetera, autenticación, KYC, admin).
- **app/seguridad/**: Utilidades de seguridad (hashing, JWT, etc.).
- **app/servicios/**: Servicios externos (correo, KYC, usuarios, pruebas).
- **uploads/**: Almacenamiento de archivos subidos (por ejemplo, documentos KYC).

### Funcionalidades Clave
- **Registro y autenticación de usuarios** (JWT, hashing seguro)
- **Gestión de usuarios administradores**
- **Módulo de ahorro y billetera digital**
- **Procesos KYC (verificación de identidad)**
- **Envío de correos automáticos**
- **Gestión y consulta de base de datos relacional**
- **Rutas RESTful bien estructuradas**

---

## Front-end

### Tecnologías y Arquitectura
- **HTML5, CSS3, JavaScript**
- **Estructura modular:** Separación por páginas, componentes y utilidades
- **Assets:** Imágenes, íconos, logotipos y recursos multimedia

### Distribución de Carpetas Clave
- **Src/Pages/**: Páginas principales (Home, Login, Dashboard, Admin, KYC, etc.)
- **Src/Components/**: Componentes reutilizables de UI
- **Src/Assets/**: Recursos gráficos y multimedia
- **Src/Styles/**: Hojas de estilo globales y específicas
- **Src/Utils/**: Utilidades y funciones auxiliares
- **pop_ups/**: Ventanas emergentes y tips de usuario

### Funcionalidades Clave
- **Interfaz de usuario intuitiva y responsiva**
- **Panel de administración y dashboard de usuario**
- **Gestión visual de ahorro y billetera**
- **Flujo de autenticación y registro**
- **Carga y visualización de documentos KYC**
- **Gráficas y visualizaciones de datos**
- **Soporte para notificaciones y pop-ups**

---

## Recomendaciones para el Usuario/Desarrollador

1. **Configuración del entorno:**
	- Instalar dependencias de Python con `pip install -r requirements.txt` dentro del entorno virtual (`env/`).
	- Configurar correctamente el archivo `.env` con las variables necesarias (secretos, rutas de base de datos, etc.).
2. **Ejecución del Back-end:**
	- Iniciar el servidor FastAPI ejecutando `main.py` o usando `uvicorn`.
	- Verificar la conexión a la base de datos y la correcta migración de esquemas.
3. **Ejecución del Front-end:**
	- Abrir los archivos HTML desde `Src/Pages/` o configurar un servidor local para desarrollo.
	- Asegurarse de que las rutas de la API coincidan con las del Back-end.
4. **Buenas prácticas:**
	- Mantener separada la lógica de negocio, presentación y datos.
	- Usar control de versiones (Git) para gestionar cambios.
	- Documentar nuevas funcionalidades y rutas.
	- Proteger las credenciales y datos sensibles.
5. **Pruebas y despliegue:**
	- Realizar pruebas unitarias y de integración antes de desplegar.
	- Revisar la seguridad de endpoints y validaciones de entrada.
	- Considerar el uso de HTTPS y almacenamiento seguro para producción.

---

## Contacto y Soporte

Para dudas, sugerencias o reportes de errores, contactar al equipo de desarrollo
---

¡Gracias por usar Proyecto Credora!
