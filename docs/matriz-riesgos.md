

### 1.2 Impacto

**Bajo (1):** Impacto menor - Afecta funcionalidad no crítica, sin pérdida de datos.

**Medio (2):** Impacto moderado - Afecta funcionalidad crítica temporalmente, datos recuperables.

**Alto (3):** Impacto severo - Pérdida de datos, indisponibilidad prolongada, exposición de información sensible.

### 1.3 Nivel de Riesgo

**Cálculo:** Nivel de Riesgo = Probabilidad × Impacto

**Bajo (1-2):** Verde - Monitorear.

**Medio (3-4):** Amarillo - Mitigar.

**Alto (6-9):** Rojo - Acción inmediata.


## 3. Detalle de Riesgos y Mitigaciones

### Riesgo 1: Inyección SQL

**Descripción:**  
Atacante inserta código SQL malicioso a través de inputs no validados, permitiendo acceso no autorizado a datos o manipulación de la base de datos.

**Probabilidad:** Media (2)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **6 (Alto)**

**Amenazas:**
- Extracción de datos sensibles (usuarios, RUT, contraseñas)
- Modificación o eliminación de registros
- Bypass de autenticación

**Mitigaciones Implementadas:**

 **Uso de consultas parametrizadas (Prepared Statements)**
```javascript
// services/backend/src/models/userModel.js
const query = 'SELECT * FROM usuarios WHERE email = $1';
const result = await pool.query(query, [email]);
```

 **ORM con validación automática**
- Pool de PostgreSQL con escape automático de parámetros
- Validación de tipos de datos

 **Validación de inputs**
```javascript
// Validación de RUT, email, etc.
if (!/^[0-9]{7,8}-[0-9Kk]$/.test(rut)) {
  throw new Error('RUT inválido');
}
```

 **Principio de privilegio mínimo**
- Usuario `proyadmin_user` solo tiene permisos SELECT, INSERT, UPDATE, DELETE
- NO tiene permisos DROP, CREATE TABLE, GRANT

**Controles Adicionales:**
- Revisión de código (code review) antes de merge
- Escaneo estático de código con herramientas SAST

---

### Riesgo 2: Exposición de Credenciales

**Descripción:**  
Credenciales de acceso (contraseñas, API keys, tokens JWT) expuestas en código fuente, repositorio Git o logs.

**Probabilidad:** Media (2)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **6 (Alto)**

**Amenazas:**
- Acceso no autorizado a base de datos
- Compromiso de cuentas de usuario
- Acceso a servicios externos (Gemini API, SMTP)

**Mitigaciones Implementadas:**

**Variables de entorno (.env)**
```bash

```

 **.gitignore configurado**
```gitignore
**/.env
**/.env.local
.env
.env.bak
```

**Rotación automática de secretos**
```bash
# scripts/security/rotate-secrets.sh
rotate_var "DB_ROOT_PASSWORD"
rotate_var "DB_PASSWORD"
rotate_var "JWT_SECRET"
```

**Contraseñas hasheadas**
- Base de datos: SCRAM-SHA-256
- Usuarios: Bcrypt con cost factor 10

**Archivo .env.example como plantilla**
```bash
DB_ROOT_PASSWORD=CONTRASEÑA_ROOT
JWT_SECRET=SECRETO_JWT
```

**Controles Adicionales:**
- Verificación en CI/CD: `git secrets` para detectar credenciales
- Auditoría de commits históricos

**Responsable:** Administradores de Sistemas  
**Frecuencia de Revisión:** Trimestral

---

### Riesgo 3: Vulnerabilidades en Dependencias npm

**Descripción:**  
Librerías npm con vulnerabilidades conocidas (CVEs) que pueden ser explotadas para ejecutar código malicioso o causar denegación de servicio.

**Probabilidad:** Alta (3)  
**Impacto:** Medio (2)  
**Nivel de Riesgo:** **6 (Alto)**

**Amenazas:**
- Ejecución remota de código (RCE)
- Cross-Site Scripting (XSS)
- Prototype pollution
- Denegación de servicio

**Mitigaciones Implementadas:**

**Escaneo automatizado con npm audit**
```bash
# Ejecutado semanalmente
npm audit
npm audit fix
```

**Overrides de dependencias**
```json
// services/backend/src/package.json
"overrides": {
  "glob": "^11.1.0",
  "cross-spawn": "^7.0.6",
  "rimraf": "^6.1.2",
  "archiver": "^7.0.1"
}
```

**Escaneo de imágenes Docker con Docker Scout**
```bash
docker scout cves proyecto-backend
docker scout cves proyecto-frontend
docker scout cves proyecto-ai-service
```

**Versiones específicas de imágenes base**
```dockerfile
FROM node:20-alpine3.21  # NO :latest
```

**Actualización regular**
- Dependencias npm: Semanal
- Imágenes Docker: Mensual

**Vulnerabilidades Residuales:**
- 7 CVEs no corregibles documentadas en `docs/vulnerabilidades-residuales.md`
- Mitigación: Capas adicionales de seguridad (WAF, rate limiting)

---

### Riesgo 4: Acceso No Autorizado a Base de Datos

**Descripción:**  
Atacante obtiene acceso directo a PostgreSQL desde fuera de la red Docker, permitiendo lectura/modificación de datos.

**Probabilidad:** Baja (1)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **3 (Medio)**

**Amenazas:**
- Extracción masiva de datos (data breach)
- Modificación de registros críticos
- Eliminación de tablas

**Mitigaciones Implementadas:**

**Sin mapeo de puertos al host**
```yaml
# docker-compose.yml
postgres-master:
  # NO tiene 'ports: - 5432:5432'
  networks:
    - database-network  # Red interna
```

**Aislamiento de red**
- Red `database-network` solo accesible por backend y ai-service
- Sin acceso desde host (localhost:5432 no funciona)

**Autenticación fuerte**
```properties
# infrastructure/database/pg_hba.conf
host all all 0.0.0.0/0 scram-sha-256
```

**Logging de conexiones**
```properties
# infrastructure/database/master.conf
log_connections = on
log_disconnections = on
```

**Firewall de aplicación**
- Solo backend/ai-service pueden conectarse
- Conexiones desde IPs no autorizadas rechazadas

**Controles Adicionales:**
- Monitoreo de intentos de conexión fallidos
- Alertas en Grafana para conexiones anómalas

---

### Riesgo 5: Denegación de Servicio (DoS)

**Descripción:**  
Atacante sobrecarga el sistema con peticiones masivas, causando indisponibilidad del servicio.

**Probabilidad:** Media (2)  
**Impacto:** Medio (2)  
**Nivel de Riesgo:** **4 (Medio)**

**Amenazas:**
- Indisponibilidad del sistema
- Consumo excesivo de recursos (CPU, memoria)
- Degradación del rendimiento

**Mitigaciones Implementadas:**

**Límites de recursos en contenedores**
```yaml
# docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

**Rate limiting en Nginx**
```nginx
# infrastructure/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

**Timeouts configurados**
```nginx
proxy_connect_timeout 10s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

**Healthchecks y reinicio automático**
```yaml
backend:
  restart: on-failure:3
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
```

**Políticas de restart**
- `on-failure:3` para servicios críticos
- `unless-stopped` para servicios de soporte

**Controles Adicionales (Pendientes):**
- WAF (Web Application Firewall) con ModSecurity
- CDN con protección DDoS (Cloudflare)
- Autoscaling horizontal (Kubernetes)

---

### Riesgo 6: Fallo de Replicación de Base de Datos

**Descripción:**  
La réplica de PostgreSQL falla o se desincroniza, causando pérdida de alta disponibilidad y backups inconsistentes.

**Probabilidad:** Media (2)  
**Impacto:** Medio (2)  
**Nivel de Riesgo:** **4 (Medio)**

**Amenazas:**
- Pérdida de alta disponibilidad
- Backups desactualizados
- Inconsistencia de datos en failover

**Mitigaciones Implementadas:**

**Replicación maestro-réplica configurada**
```yaml
# docker-compose.yml
postgres-replica:
  depends_on:
    postgres-master:
      condition: service_healthy
```

**Monitoreo de replicación**
```properties
# infrastructure/database/master.conf
wal_level = replica
max_wal_senders = 10
```

**Healthcheck de réplica**
```yaml
healthcheck:
  test: ["CMD-SHELL", "psql -U ${DB_USER} -d ${DB_NAME} -tAc \"SELECT pg_is_in_recovery();\" | grep -q t"]
```

**Slots de replicación**
```bash
# Configurado en scripts/init-replica.sh
REPL_SLOT_NAME: replica1
```

**Backups diarios**
```bash
# scripts/backup/backup-db.sh
docker exec postgres-master pg_dump -U postgres municipalidad_db > backup_$(date +%Y%m%d).sql
```

**Controles Adicionales:**
- Alertas en Grafana para lag de replicación
- Procedimiento documentado de failover manual

---

### Riesgo 7: Compromiso de Contenedor Docker

**Descripción:**  
Atacante explota vulnerabilidad en contenedor y obtiene acceso al sistema host o a otros contenedores.

**Probabilidad:** Baja (1)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **3 (Medio)**

**Amenazas:**
- Escape de contenedor hacia host
- Movimiento lateral entre contenedores
- Acceso a volúmenes sensibles

**Mitigaciones Implementadas:**

**Usuarios no privilegiados**
```dockerfile
# Todos los Dockerfiles
FROM node:20-alpine3.21
USER node  # UID 1000, no root
```

**Security options**
```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
```

**Read-only filesystems**
```yaml
read_only: true
tmpfs:
  - /tmp
  - /run
```

**Imágenes actualizadas**
- Alpine 3.21 (última versión estable)
- Node.js 20-alpine
- PostgreSQL 16-alpine

**Escaneo de vulnerabilidades**
```bash
docker scout cves <image>
```



---

### Riesgo 8: Pérdida de Logs de Auditoría

**Descripción:**  
Logs críticos se pierden por falta de rotación, fallos de disco o eliminación accidental, impidiendo análisis forense.

**Probabilidad:** Baja (1)  
**Impacto:** Medio (2)  
**Nivel de Riesgo:** **2 (Bajo)**

**Amenazas:**
- Imposibilidad de investigar incidentes
- Falta de evidencia para auditorías
- Pérdida de trazabilidad

**Mitigaciones Implementadas:**

**Rotación automática de logs**
```yaml
# docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Retención de logs de BD**
```properties
# infrastructure/database/master.conf
log_rotation_age = 1d
log_rotation_size = 100MB
```

**Volúmenes persistentes**
```yaml
volumes:
  postgres-master-data:  # Logs persistentes
```

**Backup de logs críticos**
```bash
# scripts/backup/backup-db.sh incluye logs
docker exec postgres-master pg_dump --schema=audit > audit_backup.sql
```

**Retención diferenciada**
- Logs de aplicación: 30 días
- Logs de BD: 90 días
- Logs de auditoría: 1 año

---

### Riesgo 9: Escalación de Privilegios

**Descripción:**  
Usuario con privilegios limitados obtiene acceso administrativo explotando configuraciones incorrectas.

**Probabilidad:** Baja (1)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **3 (Medio)**

**Amenazas:**
- Usuario normal obtiene rol de admin
- Modificación de permisos de otros usuarios
- Acceso a funciones administrativas

**Mitigaciones Implementadas:**

**Roles definidos en base de datos**
```sql
-- infrastructure/database/initdb/init.sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE CHECK (name IN ('ciudadano','funcionario','admin'))
);
```

**Validación de roles en backend**
```javascript
// middleware/authMiddleware.js
if (user.role_id !== ADMIN_ROLE_ID) {
  return res.status(403).json({ error: 'Acceso denegado' });
}
```

**Separación de usuarios de BD**
- `postgres` (superuser) - Solo administración
- `proyadmin_user` (app) - Sin permisos administrativos

**Autenticación JWT con roles**
```javascript
const token = jwt.sign({ 
  userId: user.id, 
  roleId: user.role_id 
}, JWT_SECRET);
```

**Auditoría de cambios de roles**
```properties
log_line_prefix = '%m [%p] %u@%d %h '
```

**Controles Adicionales:**
- Revisión mensual de permisos de usuarios
- Alertas para cambios de rol


### Riesgo 10: Exposición de Datos Personales (GDPR/Ley 19.628)

**Descripción:**  
Datos personales de ciudadanos (RUT, nombres, direcciones) expuestos por falta de encriptación, logs inseguros o acceso no autorizado.

**Probabilidad:** Media (2)  
**Impacto:** Alto (3)  
**Nivel de Riesgo:** **6 (Alto)**

**Amenazas:**
- Multas por incumplimiento de Ley 19.628
- Pérdida de confianza ciudadana
- Robo de identidad

**Mitigaciones Implementadas:**

**Encriptación de contraseñas**
```sql
-- Bcrypt con cost factor 10
CREATE EXTENSION pgcrypto;
INSERT INTO usuarios (password_hash) 
VALUES (crypt('password', gen_salt('bf', 10)));
```

**Datos mínimos necesarios**
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  rut VARCHAR(12) UNIQUE,  -- Solo lo necesario
  nombre TEXT,
  email CITEXT UNIQUE,
  -- NO se almacena: dirección detallada, teléfono personal
);
```

**Logs sin datos sensibles**
```javascript
// NO registrar:
logger.info(`Login failed for RUT: ${rut}`);  // [INCORRECTO]

// SÍ registrar:
logger.info(`Login failed for user ID: ${userId}`);  // [CORRECTO]
```

**Acceso restringido**
- Aislamiento de red (database-network)
- Autenticación SCRAM-SHA-256
- Privilegios mínimos para app

**Auditoría de accesos**
```properties
log_connections = on
log_disconnections = on
```



