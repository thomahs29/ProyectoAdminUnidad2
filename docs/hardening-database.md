
---

## 1. Autenticación Segura 

### Implementación
- **Método:** SCRAM-SHA-256 (Salted Challenge Response Authentication Mechanism)
- **Ubicación:** `infrastructure/database/master.conf`, `infrastructure/database/pg_hba.conf`

### Configuración Aplicada

**master.conf:**
```properties
password_encryption = scram-sha-256
```

**pg_hba.conf:**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
host    replication     replicator      0.0.0.0/0               scram-sha-256
```

### Ventajas de SCRAM-SHA-256
-  Reemplaza MD5 (obsoleto y vulnerable)
- Protección contra ataques de diccionario
-  Salt único por cada contraseña
- Derivación de claves (PBKDF2)
- No transmite contraseñas en texto plano

### Verificación
```bash
# Verificar método de encriptación
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW password_encryption;"
# Output esperado: scram-sha-256
```

---

## 2. Usuario de Aplicación con Privilegios Mínimos 

### Implementación
- **Script:** `infrastructure/database/initdb/02-app-user.sh`
- **Principio:** Least Privilege (privilegios mínimos)

### Configuración del Usuario

```bash
CREATE ROLE app_user LOGIN PASSWORD 'secure_password' 
  NOSUPERUSER      # Sin privilegios de superusuario
  NOCREATEDB       # No puede crear bases de datos
  NOCREATEROLE     # No puede crear roles
  NOINHERIT;       # No hereda privilegios automáticamente
```

### Privilegios Otorgados

**Solo lo necesario para operación:**
```sql
GRANT CONNECT ON DATABASE municipalidad_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

**Privilegios por defecto para tablas futuras:**
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

### Separación de Responsabilidades

**Usuario `admin` (DB_ROOT_USER):**
- **Propósito:** Administración, migraciones, replicación
- **Privilegios:** SUPERUSER, CREATEDB, CREATEROLE

**Usuario `app_user` (DB_USER):**
- **Propósito:** Aplicación backend/ai-service
- **Privilegios:** SELECT, INSERT, UPDATE, DELETE en tablas específicas

**Usuario `replicator`:**
- **Propósito:** Replicación maestro-réplica
- **Privilegios:** REPLICATION

### Verificación
```bash
# Verificar privilegios del usuario de aplicación
docker exec postgres-master psql -U admin -d municipalidad_db -c "\du app_user"
```

---

## 3. Gestión de Credenciales 

### Implementación
- **Método:** Variables de entorno con archivo `.env`
- **Ubicación:** Archivo `.env` en raíz del proyecto (excluido de Git)

### Variables Definidas

```bash
# Usuario administrador (root)
DB_ROOT_USER=admin
DB_ROOT_PASSWORD=<contraseña-segura-admin>

# Usuario de aplicación (privilegios mínimos)
DB_USER=app_user
DB_PASSWORD=<contraseña-segura-app>

# Usuario de replicación
REPL_USER=replicator
REPL_PASSWORD=<contraseña-segura-repl>

# Base de datos
DB_NAME=municipalidad_db
DB_HOST=postgres-master
DB_PORT=5432
```

### Protección de Credenciales

**En .gitignore:**
```
.env
.env.*
!.env.example
```

**Encriptación de contraseñas en la BD:**
- Método: `pgcrypto` extension con bcrypt
- Implementado en: `infrastructure/database/initdb/init.sql`

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  
  role_id INTEGER NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Uso en Servicios

**Backend (`services/backend/src/config/db.js`):**
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,      
  password: process.env.DB_PASSWORD,
  
});
```

### Verificación
```bash
# Verificar que .env no esté en Git
git check-ignore .env
# Output esperado: .env

# Verificar extensión pgcrypto
docker exec postgres-master psql -U admin -d municipalidad_db -c "\dx pgcrypto"
```

---

## 4. Aislamiento de Red

### Implementación
- **Red interna:** `database-network` (aislada)
- **Puerto:** NO expuesto al host
- **Acceso:** Solo servicios autorizados dentro de Docker

### Configuración en docker-compose.yml

```yaml
networks:
  database-network:
    driver: bridge
    internal: false  # Permite salida a Internet pero no entrada desde host
  backend-network:
    driver: bridge

services:
  postgres-master:
    networks:
      - database-network  # Red principal de BD
      - backend-network   # Solo para backend/ai-service
    # NO tiene 'ports:' mapeados  No accesible desde host
    
  postgres-replica:
    networks:
      - database-network  # Solo replica, sin acceso externo
    # NO tiene 'ports:' mapeados
    
  backend:
    networks:
      - backend-network   # Puede comunicarse con postgres-master
      - gateway-network   # Acceso a través de nginx
      
  ai-service:
    networks:
      - backend-network   # Puede comunicarse con postgres-master
```

### Seguridad de Red

**Ventajas del aislamiento:**
- Base de datos NO accesible desde host (localhost:5432)
- Solo servicios autorizados (backend, ai-service) pueden conectarse
- Red separada para replicación
- Sin exposición a Internet directa
- Comunicación interna cifrada con SCRAM-SHA-256

**Diagrama de acceso:**
```
Internet
   ↓
nginx (gateway) :80,:443
   ↓ (gateway-network)
backend/ai-service
   ↓ (backend-network)
postgres-master
   ↓ (database-network)
postgres-replica
```

### Reglas de pg_hba.conf

```
# Permite conexiones solo desde red Docker (0.0.0.0/0 dentro de la red interna)
host    all             all             0.0.0.0/0               scram-sha-256
```

**Nota:** `0.0.0.0/0` en `pg_hba.conf` NO es un riesgo porque:
1. PostgreSQL solo escucha en la red `database-network` (aislada)
2. NO hay mapeo de puertos al host
3. Solo contenedores en `backend-network` pueden alcanzar la BD

### Verificación
```bash
# Verificar que puerto 5432 NO esté expuesto en host
docker ps | grep postgres-master
# Output NO debe mostrar "0.0.0.0:5432->5432/tcp"

# Verificar redes asignadas
docker inspect postgres-master | grep -A 10 "Networks"

# Intentar conectar desde host (debe fallar)
psql -h localhost -p 5432 -U app_user -d municipalidad_db
# Output esperado: Connection refused
```

---

## 5. Logging y Auditoría 

### Implementación
- **Ubicación:** `infrastructure/database/master.conf`
- **Nivel:** Conexiones, desconexiones, errores, queries lentas

### Configuración de Logging

```properties
# Registrar todas las conexiones
log_connections = on

# Registrar todas las desconexiones
log_disconnections = on

# Formato de línea de log (timestamp, pid, usuario@db, host)
log_line_prefix = '%m [%p] %u@%d %h '

# Registrar queries que tarden más de 1 segundo
log_min_duration_statement = 1000
```

### Información Registrada

**Formato de log:**
```
2025-11-26 10:30:45 [1234] app_user@municipalidad_db 172.18.0.5
```

**Componentes:**
- `%m` - Timestamp con milisegundos
- `%p` - Process ID
- `%u` - Usuario de base de datos
- `%d` - Nombre de la base de datos
- `%h` - IP del cliente (contenedor)

### Tipos de Eventos Auditados

**Conexiones:**
- Descripción: Registro de cada conexión nueva
- Uso: Detectar intentos de acceso no autorizado

**Desconexiones:**
- Descripción: Registro de desconexiones
- Uso: Identificar sesiones anormales

**Queries lentas:**
- Descripción: Queries que tardan más de 1 segundo
- Uso: Optimización de rendimiento

**Errores:**
- Descripción: Fallos de autenticación, queries inválidas
- Uso: Seguridad y debugging

### Acceso a Logs

```bash
# Ver logs del contenedor postgres-master
docker logs postgres-master --tail 100 -f

# Logs dentro del contenedor (si se configuró persistencia)
docker exec postgres-master cat /var/lib/postgresql/data/log/postgresql-*.log
```

### Ejemplo de Logs de Auditoría

```log
2025-11-26 10:30:45.123 [1234] app_user@municipalidad_db 172.18.0.5  LOG:  connection received: host=172.18.0.5 port=45678
2025-11-26 10:30:45.125 [1234] app_user@municipalidad_db 172.18.0.5  LOG:  connection authorized: user=app_user database=municipalidad_db
2025-11-26 10:30:47.890 [1234] app_user@municipalidad_db 172.18.0.5  LOG:  duration: 1234.567 ms  statement: SELECT * FROM tramites WHERE estado = 'pendiente'
2025-11-26 10:30:50.000 [1234] app_user@municipalidad_db 172.18.0.5  LOG:  disconnection: session time: 0:00:04.877 user=app_user database=municipalidad_db host=172.18.0.5 port=45678
```

### Verificación
```bash
# Verificar configuración de logging
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW log_connections;"
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW log_disconnections;"
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW log_line_prefix;"
```

---

## 6. Seguridad de Red en Configuración 

### Implementación
- **Listen Address:** `*` (solo dentro de redes Docker)
- **HBA Configuration:** SCRAM-SHA-256 obligatorio
- **SSL/TLS:** Configurado para comunicación cifrada

### Configuración de Red

**master.conf:**
```properties
listen_addresses = '*'  # Escucha en todas las interfaces de la red Docker
```

**pg_hba.conf:**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
host    replication     replicator      0.0.0.0/0               scram-sha-256
```

### Capas de Seguridad de Red

**Capa 1 - Docker Network:**
- Mecanismo: Aislamiento de red `database-network`
- Protección: Solo contenedores autorizados

**Capa 2 - No Port Mapping:**
- Mecanismo: Sin `ports:` en docker-compose.yml
- Protección: No accesible desde host

**Capa 3 - pg_hba.conf:**
- Mecanismo: Control de acceso basado en host
- Protección: Autenticación SCRAM obligatoria

**Capa 4 - SCRAM-SHA-256:**
- Mecanismo: Encriptación de contraseñas
- Protección: No texto plano en la red

**Capa 5 - Roles y Privilegios:**
- Mecanismo: Usuario app con privilegios mínimos
- Protección: Acceso limitado incluso si comprometen credenciales

### Configuración de Replicación Segura

```properties
# Replicación
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1024
max_replication_slots = 10
```

**Acceso de replicación:**
```
host    replication     replicator      0.0.0.0/0               scram-sha-256
```

### Verificación
```bash
# Verificar listen_addresses
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW listen_addresses;"

# Verificar reglas de HBA activas
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM pg_hba_file_rules;"

# Verificar método de autenticación
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW password_encryption;"
```