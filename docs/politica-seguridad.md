
### 3.1 Requisitos Mínimos

Todas las contraseñas del sistema deben cumplir:

**Usuarios Finales (ciudadanos/funcionarios):**
- Longitud Mínima: 12 caracteres
- Complejidad: Mayúsculas, minúsculas, números, caracteres especiales
- Rotación: 90 días

**Administradores (DB_ROOT_USER, Grafana Admin):**
- Longitud Mínima: 16 caracteres
- Complejidad: Mayúsculas, minúsculas, números, caracteres especiales
- Rotación: 60 días

**Servicios (Redis, JWT_SECRET, API Keys):**
- Longitud Mínima: 32 caracteres
- Complejidad: Alfanumérico + símbolos
- Rotación: 90 días

### 3.2 Implementación Técnica

**Base de Datos PostgreSQL:**
```sql
-- Contraseñas hasheadas con bcrypt mediante pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ejemplo de almacenamiento seguro
INSERT INTO usuarios (password_hash) 
VALUES (crypt('password_usuario', gen_salt('bf', 10)));
```

**Autenticación en Base de Datos:**
- Método: **SCRAM-SHA-256** (configurado en `infrastructure/database/master.conf`)
- Prohibido: MD5, contraseñas en texto plano
- Archivo de configuración: `infrastructure/database/pg_hba.conf`

**Gestión de Secretos:**
- Variables en archivo `.env` (excluido de Git mediante `.gitignore`)
- Script de rotación automática: `scripts/security/rotate-secrets.sh`
- Generación de secretos fuertes: `openssl rand -base64 32`

### 3.3 Contraseñas Prohibidas

- Contraseñas por defecto (`admin`, `password`, `123456`)
- Información personal (nombres, fechas de nacimiento, RUT)
- Palabras de diccionario
- Secuencias de teclado (`qwerty`, `asdfgh`)

### 3.4 Almacenamiento

- **Usuarios de Aplicación:** Bcrypt con cost factor 10 (tabla `usuarios`)
- **Usuarios de BD:** SCRAM-SHA-256 en PostgreSQL
- **Secretos de Servicios:** Variables de entorno en `.env` (nunca en código)

---

## 4. Política de Actualizaciones

### 4.1 Frecuencia de Actualizaciones

**Dependencias npm:**
- Frecuencia: Semanal
- Responsable: Desarrollo
- Herramienta: `npm audit fix`

**Imágenes Docker Base:**
- Frecuencia: Mensual
- Responsable: DevOps
- Herramienta: `docker pull <image>:latest`

**PostgreSQL:**
- Frecuencia: Trimestral (minor), Inmediato (security)
- Responsable: DBA
- Herramienta: Docker image update

**Sistema Operativo (Alpine):**
- Frecuencia: Mensual
- Responsable: DevOps
- Herramienta: Rebuild de imágenes

**Nginx:**
- Frecuencia: Mensual
- Responsable: DevOps
- Herramienta: Rebuild con Alpine actualizado

### 4.2 Proceso de Actualización

**1. Dependencias de Node.js:**
```bash
# Verificar vulnerabilidades
npm audit

# Aplicar fixes automáticos
npm audit fix

# Revisar cambios breaking
npm outdated

# Actualizar package.json y reconstruir
docker compose build --no-cache
```

**2. Imágenes Docker:**
```bash
# Actualizar imágenes base en Dockerfiles
FROM node:20-alpine3.21  # Versión específica, no :latest

# Reconstruir servicios
docker compose build backend frontend ai-service

# Recrear contenedores
docker compose up -d --force-recreate
```

**3. PostgreSQL:**
```bash
# Actualizar versión en docker-compose.yml
postgres-master:
  image: postgres:16-alpine  # Versión actual

# Pull nueva imagen
docker pull postgres:16-alpine

# Backup antes de actualizar
./scripts/backup/backup-db.sh

# Recrear contenedor
docker compose up -d postgres-master --force-recreate
```

### 4.3 Ventanas de Mantenimiento

- **Actualizaciones Críticas de Seguridad:** Inmediato (máximo 48 horas desde publicación)
- **Actualizaciones Menores:** Viernes 22:00 - Sábado 06:00 (horario de bajo tráfico)
- **Actualizaciones Mayores:** Primer sábado del mes, 00:00 - 06:00

### 4.4 Rollback

Cada actualización debe tener plan de rollback:
```bash
# Backup antes de actualizar
docker compose exec postgres-master pg_dump -U admin municipalidad_db > backup_pre_update.sql

# Si falla, restaurar
docker compose exec -T postgres-master psql -U admin municipalidad_db < backup_pre_update.sql
```

---

## 5. Gestión de Accesos

### 5.1 Principio de Privilegio Mínimo

**Usuarios de Base de Datos:**

**Usuario `postgres` (DB_ROOT_USER):**
- Tipo: Superusuario
- Privilegios: SUPERUSER, CREATEDB, CREATEROLE
- Uso: Administración, migraciones, replicación

**Usuario `proyadmin_user` (DB_USER):**
- Tipo: Aplicación
- Privilegios: SELECT, INSERT, UPDATE, DELETE en tablas específicas
- Uso: Backend y AI Service

**Usuario `replicator`:**
- Tipo: Replicación
- Privilegios: REPLICATION
- Uso: Sincronización maestro-réplica

**Implementación:**
```bash
# Script: infrastructure/database/initdb/02-app-user.sh
CREATE ROLE proyadmin_user LOGIN PASSWORD 'secure_password'
  NOSUPERUSER      # Sin privilegios de superusuario
  NOCREATEDB       # No puede crear bases de datos
  NOCREATEROLE     # No puede crear roles
  NOINHERIT;       # No hereda privilegios

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO proyadmin_user;
```

### 5.2 Usuarios de Contenedores

**Todos los contenedores ejecutan con usuarios no privilegiados:**

```dockerfile
# Ejemplo: services/backend/Dockerfile
FROM node:20-alpine3.21
USER node  # UID 1000, no root
```

**Frontend:**
- Usuario: `node`
- UID: 1000
- Justificación: Usuario no privilegiado de Node.js

**Backend:**
- Usuario: `node`
- UID: 1000
- Justificación: Usuario no privilegiado de Node.js

**AI Service:**
- Usuario: `node`
- UID: 1000
- Justificación: Usuario no privilegiado de Node.js

**Nginx:**
- Usuario: `nginx`
- UID: 101
- Justificación: Usuario no privilegiado de Nginx

**Backup:**
- Usuario: `node`
- UID: 1000
- Justificación: Usuario no privilegiado de Node.js

### 5.3 Aislamiento de Red

**Redes Docker Segregadas:**

```yaml
networks:
  gateway-network:      # Solo nginx y servicios públicos
  backend-network:      # Backend, AI-service, postgres
  database-network:     # Solo postgres-master y postgres-replica
  monitoring-network:   # Prometheus, Grafana, exporters
```

**Reglas de Acceso:**
- Frontend → Nginx (puerto 80/443)
- Nginx → Backend/AI-service (red interna)
- Backend/AI-service → PostgreSQL (red interna)
- Host → PostgreSQL (sin mapeo de puertos)
- Internet → Base de datos (aislada)

### 5.4 Control de Acceso a Servicios

**Grafana (Monitoreo):**
- Usuario: `admin` (definido en `.env`)
- Contraseña: Mínimo 16 caracteres
- Acceso: Solo red `monitoring-network`
- Autenticación: Usuario/contraseña + sesiones con timeout

**PostgreSQL:**
- Acceso remoto: Deshabilitado (sin mapeo de puertos)
- Autenticación: SCRAM-SHA-256 únicamente
- Conexiones: Solo desde contenedores autorizados en `backend-network`

### 5.5 Auditoría de Accesos

**Logs de Autenticación:**
```properties
# infrastructure/database/master.conf
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %u@%d %h '
```

**Ejemplo de log:**
```
2025-11-27 10:30:45 [1234] proyadmin_user@municipalidad_db 172.18.0.5 LOG: connection authorized
```

**Revisión de Logs:**
```bash
# Ver intentos de autenticación fallidos
docker logs postgres-master 2>&1 | grep "authentication failed"

# Ver conexiones activas
docker exec postgres-master psql -U postgres -d municipalidad_db -c "SELECT * FROM pg_stat_activity;"
```

---

## 6. Retención de Logs

### 6.1 Política de Retención

**Logs de Aplicación (Backend, Frontend, AI):**
- Retención: 30 días
- Ubicación: Docker logs
- Rotación: 10 MB / 3 archivos

**Logs de Base de Datos (PostgreSQL):**
- Retención: 90 días
- Ubicación: `/var/lib/postgresql/data/log/`
- Rotación: Diaria

**Logs de Nginx (Acceso, Errores):**
- Retención: 60 días
- Ubicación: Docker logs
- Rotación: 10 MB / 3 archivos

**Métricas de Prometheus:**
- Retención: 15 días
- Ubicación: Prometheus TSDB
- Rotación: Automática

**Logs de Auditoría (Autenticación, Cambios de permisos):**
- Retención: 1 año
- Ubicación: PostgreSQL + exportación
- Rotación: Mensual

### 6.2 Configuración de Rotación

**Docker Compose (Todos los servicios):**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"      # Máximo 10 MB por archivo
    max-file: "3"        # Mantener 3 archivos (30 MB total)
```

**PostgreSQL:**
```properties
# infrastructure/database/master.conf
log_rotation_age = 1d           # Rotar diariamente
log_rotation_size = 100MB       # O al alcanzar 100 MB
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
```

### 6.3 Contenido de Logs

**Información que DEBE registrarse:**
-  Intentos de autenticación (exitosos y fallidos)
- Cambios en permisos de usuarios
- Operaciones de escritura (INSERT, UPDATE, DELETE) en tablas críticas
- Errores de aplicación (HTTP 500, excepciones)
- Queries lentas (>1 segundo)
- Reinicio de servicios

**Información que NO debe registrarse:**
-  Contraseñas en texto plano
- Tokens JWT completos
- Datos personales sensibles (RUT, direcciones) en logs de aplicación
- Claves de API

### 6.4 Acceso a Logs

**Comandos de Consulta:**
```bash
# Logs de un servicio específico
docker logs <container_name> --tail 100 -f

# Logs de PostgreSQL
docker exec postgres-master psql -U postgres -d municipalidad_db -c "SELECT * FROM pg_stat_activity;"

# Logs de autenticación fallida
docker logs postgres-master 2>&1 | grep "FATAL.*authentication"

# Exportar logs para auditoría
docker logs backend > backend_logs_$(date +%Y%m%d).log
```

**Grafana Dashboards:**
- Dashboard de PostgreSQL: `infrastructure/monitoring/grafana/dashboards/10-postgres.json`
- Métricas de conexiones, queries, errores

### 6.5 Backup de Logs

**Logs de Auditoría (críticos):**
```bash
# Exportar logs de PostgreSQL mensualmente
docker exec postgres-master pg_dump -U postgres --schema=audit -F c > audit_backup_$(date +%Y%m).dump

# Comprimir y almacenar
tar -czf logs_archive_$(date +%Y%m).tar.gz audit_backup_*.dump
```

**Almacenamiento:**
- Local: Volúmenes Docker persistentes
- Remoto: Backup mensual a almacenamiento externo (opcional)



