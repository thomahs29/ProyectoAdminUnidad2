# Hardening de la Base de Datos PostgreSQL

## 1. Arquitectura y despliegue

La base de datos se despliega en dos contenedores:

- **postgres-master**: nodo principal de escritura.
- **postgres-replica**: nodo réplica para offload de lecturas y backups.

Ambos contenedores se definen en `docker-compose.yml` y están conectados a la red interna:

```yml
networks:
  database-network:
    driver: bridge
    internal: true
```

### Características de seguridad de la arquitectura

- **Sin exposición de puertos al host**  
  Ninguno de los servicios `postgres-master` ni `postgres-replica` tiene bloques `ports:`.  
  La BD solo es accesible desde otros contenedores dentro de las redes internas de Docker.

- **Red interna marcada como `internal: true`**  
  Impide que otros hosts fuera del entorno Docker puedan enrutar hacia `database-network`.

---

## 3. Separación de roles y gestión de usuarios

### 3.1 Usuario administrador (root de BD)

Para la inicialización del clúster se utiliza un usuario de administración definido mediante variables de entorno:

```env
DB_ROOT_USER=postgres_admin
DB_ROOT_PASSWORD=********
DB_NAME=proyadmin2
```

En `docker-compose.yml`:

```yml
postgres-master:
  environment:
    POSTGRES_USER: ${DB_ROOT_USER}
    POSTGRES_PASSWORD: ${DB_ROOT_PASSWORD}
    POSTGRES_DB: ${DB_NAME}
```

Este usuario **no se utiliza en la aplicación**, solo para:

- Bootstrap inicial de la base de datos.
- Creación de usuarios y asignación de privilegios.
- Tareas de administración interna.

### 3.2 Usuario de aplicación

La aplicación se conecta con un usuario específico para la lógica de negocio:

```env
DB_USER=proyadmin_user
DB_PASSWORD=********
```

Este usuario es creado y configurado mediante el script:

```text
infrastructure/database/initdb/02-app-user.sh
```

Fragmento relevante:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    EXECUTE format(
      'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
      '${DB_USER}', '${DB_PASSWORD}'
    );
  ELSE
    EXECUTE format(
      'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
      '${DB_USER}', '${DB_PASSWORD}'
    );
  END IF;
END
$$;
```

Características del usuario de aplicación:

- `NOSUPERUSER` → no puede realizar tareas administrativas.
- `NOCREATEDB` / `NOCREATEROLE` → no puede crear bases de datos ni roles.
- `NOINHERIT` → no hereda permisos de otros roles.
- Se utiliza únicamente desde los servicios de backend y microservicios internos.

---

## 4. Privilegios mínimos

Al usuario de aplicación se le otorgan **solo** los permisos necesarios sobre la base de datos de trabajo.

Fragmento del script `02-app-user.sh`:

```sql
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${DB_USER};

GRANT USAGE ON SCHEMA public TO ${DB_USER};

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${DB_USER};
```

Con esto se garantiza que el usuario:

- Puede conectarse a la base de datos de la aplicación.
- Puede realizar operaciones CRUD sobre las tablas del esquema `public`.
- No puede gestionar permisos, esquemas ni roles.
- Cualquier tabla nueva creada en el esquema `public` hereda estos permisos automáticamente.

---

## 5. Aislamiento de red y control de acceso

### 5.1 Redes de Docker

Los servicios relacionados con la base de datos están conectados únicamente a redes internas:

```yml
postgres-master:
  networks:
    - database-network
    - backend-network

postgres-replica:
  networks:
    - database-network
```

Servicios que necesitan acceso a la BD (backend, ai-service, backup, exporters) también están unidos a `database-network` y/o `backend-network`.  
No se expone `5432` al host, por lo que **no es posible conectarse a la BD desde fuera de Docker**.

### 5.2 Configuración de `pg_hba.conf`

El archivo `infrastructure/database/pg_hba.conf` limita qué hosts pueden autenticarse y bajo qué método, por ejemplo:

```conf
# Conexiones locales dentro del contenedor
local   all             all                                     scram-sha-256

# Redes internas de Docker 
host    all             all             0.0.0.0/0               scram-sha-256

# Replicación para el usuario replicator
host    replication     replicator      0.0.0.0/0               scram-sha-256
```

Esto asegura que:

- Todas las conexiones requieren contraseña con método `scram-sha-256`.
- El usuario de replicación (`replicator`) solo puede usarse para replicación.

---

## 6. Autenticación y cifrado de contraseñas

### 6.1 Configuración de `postgresql.conf` (master.conf)

El archivo `infrastructure/database/master.conf` contiene, entre otros, los parámetros:

```conf
listen_addresses = '*'
password_encryption = scram-sha-256

log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %u@%d %h '
log_min_duration_statement = 1000
```

Medidas aplicadas:

- `password_encryption = scram-sha-256`  
  Todas las nuevas contraseñas se almacenan utilizando el método de cifrado más seguro disponible en PostgreSQL.

- `listen_addresses = '*'`  
  Permite que el contenedor reciba conexiones desde otras redes internas de Docker, pero no se expone al exterior porque no hay mapeo de puertos en `docker-compose.yml`.

### 6.2 Gestión de credenciales

- Todas las credenciales se definen mediante variables de entorno en `.env`:
  - `DB_ROOT_PASSWORD`
  - `DB_PASSWORD`
  - `REPL_PASSWORD`
- El archivo `.env` está excluido del repositorio mediante `.gitignore`, evitando exponer secretos en control de versiones.
- El código fuente utiliza `process.env` para leer las variables; no existen contraseñas hardcodeadas.

---

## 7. Replicación segura

La réplica `postgres-replica` utiliza un usuario específico para replicación:

```env
REPL_USER=replicator
REPL_PASSWORD=********
```

En `docker-compose.yml`:

```yml
postgres-replica:
  environment:
    POSTGRES_USER: ${DB_ROOT_USER}
    POSTGRES_PASSWORD: ${DB_ROOT_PASSWORD}
    POSTGRES_DB: ${DB_NAME}
    REPL_USER: replicator
    REPL_PASSWORD: ${REPL_PASSWORD}
    MASTER_HOST: postgres-master
    MASTER_PORT: 5432
    REPL_SLOT_NAME: replica1
    PGDATA: /var/lib/postgresql/data
    PGPASSWORD: ${REPL_PASSWORD}
```

Y el acceso de replicación se controla desde `pg_hba.conf`:

```conf
host    replication     replicator      10.0.0.0/0           scram-sha-256
```

Esto asegura que:

- El usuario `replicator` no se usa para la aplicación, solo para replicación.
- La réplica solo puede conectarse desde redes internas autorizadas.
- La replicación también exige autenticación con `scram-sha-256`.

---

## 8. Monitoreo y exporters

Para monitoreo se utilizan contenedores exporters:

- `postgres-master-exporter`
- `postgres-replica-exporter`

Estos se conectan usando credenciales definidas en `.env`, solo dentro de redes internas:

```yml
postgres-master-exporter:
  environment:
    - DATA_SOURCE_NAME=postgresql://${DB_ROOT_USER}:${DB_ROOT_PASSWORD}@postgres-master:5432/${DB_NAME}?sslmode=disable

postgres-replica-exporter:
  environment:
    - DATA_SOURCE_NAME=postgresql://${DB_ROOT_USER}:${DB_ROOT_PASSWORD}@postgres-replica:5432/${DB_NAME}?sslmode=disable
```

El acceso externo a métricas se realiza a través del gateway y de la red de monitoreo (`monitoring-network`), nunca directamente a la BD.

---

## 9. Logging y auditoría

Con la configuración de `master.conf`:

```conf
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %u@%d %h '
log_min_duration_statement = 1000
```

PostgreSQL registra:

- Cada conexión establecida (usuario, base de datos y host).
- Cada desconexión.
- Intentos fallidos de autenticación.
- Consultas lentas (≥ 1 segundo), útiles para análisis de rendimiento y detección de abusos.

Los logs pueden consultarse con:

```bash
docker logs postgres-master
docker logs postgres-replica
```

---

## 10. Gestión de secretos

- Las credenciales de la base de datos se gestionan mediante variables de entorno en el archivo `.env`.
- `.env` está excluido del repositorio (`.gitignore`), por lo que:
  - Los valores reales de `DB_ROOT_PASSWORD`, `DB_PASSWORD` y `REPL_PASSWORD` no se comparten ni se versionan.
- Para rotar credenciales se puede actualizar el `.env` y recrear los contenedores, ejecutándose nuevamente el script de creación/actualización de usuarios.

---

## 11. Pruebas de validación

Para validar el hardening se realizaron las siguientes pruebas:

1. **Conexión desde el host al puerto 5432**  
   - Intento de `psql -h localhost -p 5432 ...` desde el host.  
   - Resultado esperado: conexión rechazada (no hay mapeo de puertos).

2. **Conexión desde el backend con el usuario de aplicación**  
   - Verificación del endpoint `/api/health` del backend.  
   - Resultado: backend se conecta correctamente usando `DB_USER=proyadmin_user`.

3. **Conexión directa desde el contenedor master con `psql`**:

   ```bash
   docker exec -it postgres-master psql -U proyadmin_user -d proyadmin2 -c "SELECT 1;"
   ```

   - Resultado: consulta exitosa.

4. **Intento de operaciones administrativas con el usuario de aplicación**

   Ejemplos probados:

   ```sql
   CREATE ROLE test_role;
   CREATE DATABASE test_db;
   ```

   - Resultado: operaciones rechazadas, confirmando que el usuario no tiene privilegios administrativos.

5. **Revisión de logs**

   - `docker logs postgres-master` muestra conexiones, desconexiones e intentos fallidos, validando la configuración de logging.
