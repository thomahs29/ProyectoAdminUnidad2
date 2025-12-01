# Checklist OWASP Top 10 (2021)



Este documento analiza cada uno de los 10 riesgos principales del OWASP Top 10 (2021) y documenta si aplican al sistema, junto con las mitigaciones implementadas.

## A01:2021 – Broken Access Control


### Descripción del Riesgo
Fallas en el control de acceso permiten a usuarios no autorizados acceder a funcionalidades o datos que no les corresponden.

### Cómo se Está Mitigando

**1. Autenticación con JWT**
```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};
```

**2. Roles definidos en base de datos**
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE CHECK (name IN ('ciudadano','funcionario','admin'))
);
```

**3. Validación de permisos por rol**
```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};
```

**4. Privilegios mínimos en base de datos**
- Usuario `proyadmin_user`: Solo SELECT, INSERT, UPDATE, DELETE
- Sin permisos DROP, CREATE TABLE, GRANT



## A02:2021 – Cryptographic Failures


### Descripción del Riesgo
Fallas en la protección de datos sensibles mediante cifrado inadecuado o inexistente.

### Cómo se Está Mitigando

**1. Contraseñas hasheadas con bcrypt**
```sql
-- Usando pgcrypto en PostgreSQL
CREATE EXTENSION pgcrypto;

INSERT INTO usuarios (password_hash) 
VALUES (crypt('password_usuario', gen_salt('bf', 10)));
```

**2. Autenticación de base de datos con SCRAM-SHA-256**
```properties
# infrastructure/database/master.conf
password_encryption = scram-sha-256
```

```
# infrastructure/database/pg_hba.conf
host all all 0.0.0.0/0 scram-sha-256
```

**3. JWT para sesiones**
```javascript
const token = jwt.sign(
  { userId: user.id, roleId: user.role_id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

**4. Variables de entorno para secretos**
- Contraseñas en `.env` (no en código)
- `.env` excluido de Git (`.gitignore`)

**5. SSL/TLS configurado**
- Nginx preparado para HTTPS (puerto 443)
- Certificados en `infrastructure/nginx/ssl/`

## A03:2021 – Injection


### Descripción del Riesgo
Inyección de código malicioso (SQL, NoSQL, OS commands) a través de inputs no validados.

### Cómo se Está Mitigando

**1. Consultas parametrizadas (Prepared Statements)**
```javascript
// models/userModel.js
const getUserByRut = async (rut) => {
  const query = 'SELECT * FROM usuarios WHERE rut = $1';
  const result = await pool.query(query, [rut]); // [CORRECTO] Parámetro escapado
  return result.rows[0];
};
```

**2. Validación de inputs**
```javascript
// Validación de RUT
if (!/^[0-9]{7,8}-[0-9Kk]$/.test(rut)) {
  throw new Error('RUT inválido');
}

// Validación de email
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Email inválido');
}
```

**3. ORM con escape automático**
- Pool de PostgreSQL escapa parámetros automáticamente
- No se construyen queries concatenando strings

**4. Prevención de Command Injection**
- No se ejecutan comandos del sistema con inputs de usuario
- Scripts de backup/restore con rutas fijas

**Ejemplos de código vulnerable evitado:**
```javascript
//NUNCA hacer esto:
const query = `SELECT * FROM usuarios WHERE rut = '${rut}'`; // Vulnerable

// Siempre usar parámetros:
const query = 'SELECT * FROM usuarios WHERE rut = $1';
pool.query(query, [rut]);
```

**Estado:** [MITIGADO] Implementado completamente

---

## A04:2021 – Insecure Design

### Descripción del Riesgo
Fallas en el diseño de seguridad desde el inicio del desarrollo.

### Cómo se Está Mitigando

1. Arquitectura de seguridad por capas

**2. Separación de redes Docker**
- `gateway-network`: Solo nginx
- `backend-network`: Backend, AI-service, PostgreSQL
- `database-network`: PostgreSQL interno
- `monitoring-network`: Prometheus, Grafana

**3. Principio de privilegio mínimo**
- Usuario de BD con permisos mínimos
- Contenedores con usuarios no root
- Roles definidos (ciudadano, funcionario, admin)

**4. Logging y auditoría desde el diseño**
```properties
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %u@%d %h '
```

**5. Alta disponibilidad**
- Replicación maestro-réplica de PostgreSQL
- Backups automáticos diarios


## A05:2021 – Security Misconfiguration

### ¿Aplica al Sistema?

### Descripción del Riesgo
Configuraciones incorrectas o por defecto que exponen el sistema.

### Cómo se Está Mitigando

**1. Contenedores hardenizados**
```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
```

**2. Usuarios no privilegiados**
```dockerfile
# Todos los Dockerfiles
FROM node:20-alpine3.21
USER node  # UID 1000, no root
```

**3. Variables de entorno (no hardcoded)**
- Credenciales en `.env`
- Sin contraseñas por defecto
- `.gitignore` configurado

**4. Seguridad de PostgreSQL**
- Autenticación SCRAM-SHA-256 (no MD5)
- Sin mapeo de puertos al host (5432 no expuesto)
- Acceso solo desde red interna Docker

**5. Límites de recursos**
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

**6. Logging con rotación**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**7. Headers de seguridad en Nginx**
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

---

## A06:2021 – Vulnerable and Outdated Components

### Descripción del Riesgo
Uso de librerías, frameworks o componentes con vulnerabilidades conocidas.

### Cómo se Está Mitigando

**1. Escaneo automatizado con Docker Scout**
```bash
docker scout cves proyecto-backend
docker scout cves proyecto-frontend
docker scout cves proyecto-ai-service
```

**2. Actualización de dependencias npm**
```bash
# Ejecutado semanalmente
npm audit
npm audit fix
```

**3. Overrides para forzar versiones seguras**
```json
// package.json
"overrides": {
  "glob": "^11.1.0",
  "cross-spawn": "^7.0.6",
  "rimraf": "^6.1.2",
  "archiver": "^7.0.1"
}
```

**4. Imágenes base actualizadas**
```dockerfile
FROM node:20-alpine3.21  # Versión específica, no :latest
FROM postgres:16-alpine
FROM nginx:alpine3.21
```

**5. Política de actualizaciones**
- Dependencias npm: Semanal
- Imágenes Docker: Mensual
- Parches críticos: Inmediato (<48h)

**6. Vulnerabilidades residuales documentadas**
- 7 CVEs no corregibles en `docs/vulnerabilidades-residuales.md`
- Medidas de mitigación aplicadas

**Estado actual:**
- Frontend: 2 CVEs (libpng - no corregible)
- Backend: 3 CVEs reales + 2 falsos positivos
- AI-Service: 2 falsos positivos (glob/cross-spawn actualizados)


## A07:2021 – Identification and Authentication Failures


### Descripción del Riesgo
Fallas en la autenticación que permiten a atacantes comprometer contraseñas, claves o sesiones.

### Cómo se Está Mitigando

**1. Contraseñas fuertes**
```javascript
// Requisitos mínimos:
- Longitud mínima: 12 caracteres
- Complejidad: Mayúsculas, minúsculas, números, símbolos
- Hasheadas con bcrypt (cost factor 10)
```

**2. JWT con expiración**
```javascript
const token = jwt.sign(
  { userId: user.id, roleId: user.role_id },
  process.env.JWT_SECRET,
  { expiresIn: '1d' } // Expira en 24 horas
);
```

**3. Autenticación SCRAM-SHA-256 en BD**
```properties
password_encryption = scram-sha-256
```

**4. Logging de intentos de autenticación**
```properties
log_connections = on
log_disconnections = on
```

**5. Validación de sesiones**
```javascript
// Middleware valida JWT en cada request
authenticateToken(req, res, next);
```

---

## A08:2021 – Software and Data Integrity Failures

### Descripción del Riesgo
Fallas en la verificación de integridad de software, datos y pipelines CI/CD.

### Cómo se Está Mitigando

**1. Imágenes Docker con versiones específicas**
```dockerfile
FROM node:20-alpine3.21  # SHA256: verificable
FROM postgres:16-alpine
```

**2. Backups con verificación**
```bash
# scripts/backup/backup-db.sh
pg_dump -U postgres municipalidad_db > backup.sql
```

**3. Logs de auditoría inmutables**
- Logs de PostgreSQL persistentes
- Retención de 90 días para BD

**4. Variables de entorno protegidas**
- `.env` no en Git
- Secretos rotables con script


---

## A09:2021 – Security Logging and Monitoring Failures


### Descripción del Riesgo
Falta de logging, monitoreo y alertas que permitan detectar y responder a ataques.

### Cómo se Está Mitigando

**1. Logging de PostgreSQL**
```properties
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %u@%d %h '
log_min_duration_statement = 1000  # Queries >1s
```

**2. Logging de aplicación**
```yaml
# docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**3. Monitoreo con Prometheus + Grafana**
- PostgreSQL Exporter: Métricas de BD
- Redis Exporter: Métricas de caché
- cAdvisor: Métricas de contenedores
- Node Exporter: Métricas del sistema

**4. Dashboards de Grafana**
- `10-postgres.json`: Conexiones, queries, errores
- `20-redis.json`: Operaciones, memoria
- `30-containers-cadvisor.json`: CPU, memoria, red

**5. Retención de logs**
- Aplicación: 30 días
- Base de datos: 90 días
- Auditoría: 1 año

**6. Eventos registrados**
- Intentos de autenticación (exitosos/fallidos)
- Cambios en permisos de usuarios
- Operaciones de escritura críticas
- Errores de aplicación
- Queries lentas

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Descripción del Riesgo
La aplicación hace requests a URLs proporcionadas por usuarios sin validación, permitiendo acceso a recursos internos.

### Análisis de Aplicabilidad

**Mitigaciones implementadas:**

**1. AI Service con URL fija**
```javascript
// services/ai-service/src/aiService.js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
```

**2. Aislamiento de red**
- AI Service en `backend-network`
- Sin acceso directo a `database-network`

**3. Validación de inputs**
```javascript
// Solo se envía texto procesado, no URLs
const response = await axios.post(GEMINI_API_URL, {
  contents: [{ parts: [{ text: userQuestion }] }]
});
```



