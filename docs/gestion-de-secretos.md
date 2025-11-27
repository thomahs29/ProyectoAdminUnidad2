# Gestión de Secretos

Este proyecto **no almacena secretos reales en el código ni en el repositorio**.  
Todas las credenciales sensibles se gestionan mediante archivos `.env` locales y variables de entorno.

## 1. Archivos de entorno

- El archivo **`.env`** contiene los secretos reales y **NO** se versiona en git.
- El archivo **`.env.example`** es una plantilla sin credenciales reales y **SÍ** está en el repositorio.

## 2. Secretos gestionados mediante `.env`

Algunos de los secretos gestionados por `.env` son:

- Credenciales de base de datos:
  - `DB_ROOT_PASSWORD`
  - `DB_PASSWORD`
  - `REPL_PASSWORD`
- Claves de autenticación:
  - `JWT_SECRET`
- Servicios externos:
  - `SMTP_USER`, `SMTP_PASSWORD`
  - `GEMINI_API_KEY`
- Otros:
  - `REDIS_PASSWORD`
  - `GRAFANA_ADMIN_PASSWORD`

El código fuente **solo** accede a estos valores mediante `process.env` (Node) o variables de entorno en Docker Compose, nunca con contraseñas hardcodeadas.

## 3. Rotación de secretos

Para facilitar la rotación periódica de secretos sensibles se incluye el script:

scripts/security/rotate-secrets.sh

Este script:

- Genera nuevos valores aleatorios fuertes usando `openssl rand`.
- Actualiza en el archivo `.env` las siguientes variables:
  - `DB_ROOT_PASSWORD`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `REDIS_PASSWORD`
  - `REPL_PASSWORD`
  - `GRAFANA_ADMIN_PASSWORD`
- Crea un respaldo del archivo original como `.env.bak`.

### Uso del script de rotación

En la raíz del proyecto:

# Dar permisos de ejecución (solo la primera vez)

chmod +x scripts/security/rotate-secrets.sh

# Ejecutar la rotación de secretos

./scripts/security/rotate-secrets.sh

Salida esperada (ejemplo):

Rotando secretos sensibles en .env ...
Rotado: DB_ROOT_PASSWORD
Rotado: DB_PASSWORD
Rotado: JWT_SECRET
Rotado: REDIS_PASSWORD
Rotado: REPL_PASSWORD
Rotado: GRAFANA_ADMIN_PASSWORD
Rotación completa. Se creó respaldo .env.bak con los valores anteriores.

Tras rotar los secretos, es necesario recrear los contenedores para que tomen los nuevos valores:

docker compose down
docker compose up -d

El archivo `.env.bak` conserva los valores anteriores por si es necesario recuperarlos temporalmente. Aun así, se recomienda eliminarlos o guardarlos de forma segura una vez completada la rotación.
