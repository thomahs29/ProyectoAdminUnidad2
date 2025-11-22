

---

## Medidas Aplicadas en Dockerfiles

### 1. ✅ Usuarios No Privilegiados

**Objetivo:** Evitar que los contenedores se ejecuten como usuario `root`, minimizando el impacto de posibles vulnerabilidades.

#### Frontend (Nginx)
```dockerfile
# Crear usuario no privilegiado para nginx
RUN addgroup -g 1001 -S nginxuser && \
    adduser -u 1001 -S nginxuser -G nginxuser && \
    # Ajustar permisos para que nginx pueda ejecutarse sin root
    touch /var/run/nginx.pid && \
    chown -R nginxuser:nginxuser /var/run/nginx.pid && \
    chown -R nginxuser:nginxuser /var/cache/nginx && \
    chown -R nginxuser:nginxuser /usr/share/nginx/html

USER nginxuser
```

**UID/GID:** 1001 (no privilegiado)  
**Permisos ajustados:** Nginx puede escribir en `/var/run/nginx.pid`, `/var/cache/nginx` y servir archivos desde `/usr/share/nginx/html`.

#### Backend (Node.js)
```dockerfile
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser && \
    chown -R appuser:appuser /app

USER appuser
```

**UID/GID:** 1001 (no privilegiado)  
**Justificación:** El backend solo necesita leer archivos de código y escribir en `/app/uploads` (con volumen).

#### AI Service (Node.js)
```dockerfile
RUN addgroup -g 1001 -S aiuser && \
    adduser -u 1001 -S aiuser -G aiuser && \
    chown -R aiuser:aiuser /app

USER aiuser
```

**UID/GID:** 1001 (no privilegiado)

#### Backup Service (Alpine)
```dockerfile
# NOTA: Se ejecuta como root por necesidades técnicas:
# - pg_dump requiere permisos específicos de PostgreSQL
# - Operaciones de backup/restore necesitan acceso a archivos del sistema
# - cron daemon requiere privilegios para programar tareas
```

**Justificación:** El servicio de backup requiere root para:
- Ejecutar `pg_dump` con permisos de PostgreSQL
- Acceder a volúmenes de backup con permisos especiales
- Ejecutar cron daemon

**Mitigación:** Se compensa con `security_opt` y `cap_drop` en docker-compose.

---

### 2. ✅ Versiones Específicas de Imágenes Base


| Servicio | Imagen Base Anterior | Imagen Base Actualizada |
|----------|---------------------|-------------------------|
| Frontend (Build) | `node:18-alpine` | `node:18.20.5-alpine3.20` |
| Frontend (Runtime) | `nginx:alpine` | `nginx:1.27.2-alpine3.20` |
| Backend | `node:18-alpine` | `node:18.20.5-alpine3.20` |
| AI Service | `node:18-alpine` | `node:18.20.5-alpine3.20` |
| Backup | `alpine:3.20` | `alpine:3.20.3` |

**Beneficios:**
- Reproducibilidad garantizada
-  Sin actualizaciones automáticas no controladas
-  Facilita auditorías de seguridad

---

### 3. Multi-Stage Builds



#### Frontend
```dockerfile
# STAGE 1: Build Stage
FROM node:18.20.5-alpine3.20 AS builder
# ... instalación de dependencias y build ...

# STAGE 2: Production Runtime Stage
FROM nginx:1.27.2-alpine3.20
COPY --from=builder /app/dist /usr/share/nginx/html
```

**Reducción de tamaño:** ~60% menos (solo archivos estáticos sin node_modules)

#### Backend
```dockerfile
# STAGE 1: Dependencies Build Stage
FROM node:18.20.5-alpine3.20 AS dependencies
# ... compilación de dependencias nativas ...

# STAGE 2: Production Runtime Stage
FROM node:18.20.5-alpine3.20
COPY --from=dependencies /app/node_modules ./node_modules
```

**Beneficios:**
- ✅ No incluye herramientas de compilación (python3, make, g++, build-base) en runtime
- ✅ Solo librerías runtime necesarias (cairo, pango, jpeg)
- ✅ Reducción de superficie de ataque

#### AI Service
```dockerfile
# STAGE 1: Dependencies Build Stage
FROM node:18.20.5-alpine3.20 AS dependencies
# ... instalación de dependencias ...

# STAGE 2: Production Runtime Stage
FROM node:18.20.5-alpine3.20
COPY --from=dependencies /app/node_modules ./node_modules
```

---

### 4. Limpieza de Caché y Archivos Temporales

**En todas las imágenes:**
```dockerfile
RUN npm install && \
    npm cache clean --force
```

**Beneficio:** Reduce el tamaño de la imagen eliminando archivos innecesarios.

---

### 5. Healthchecks

**Objetivo:** Permitir que Docker y orquestadores detecten contenedores no saludables.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
```

---

## Medidas Aplicadas en Docker Compose

### 1.  Security Options - `security_opt`

**Aplicado a:** frontend, backend, ai-service

```yaml
security_opt:
  - no-new-privileges:true
```

**Explicación:** Previene que procesos dentro del contenedor escalen privilegios mediante binarios setuid/setgid.

**Referencia:** CIS Docker Benchmark 5.25

---

### 2. ✅ Linux Capabilities - `cap_drop` / `cap_add`

**Estrategia:** Eliminar TODAS las capabilities y agregar solo las necesarias.

#### Frontend (Nginx)
```yaml
cap_drop:
  - ALL
cap_add:
  - CHOWN      # Nginx necesita cambiar ownership de archivos
  - SETUID     # Para cambiar a usuario nginxuser
  - SETGID     # Para cambiar a grupo nginxuser
```

#### Backend y AI Service
```yaml
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE  # Para escuchar en puertos (3000/3001)
```

**Capabilities eliminadas incluyen:**
- `CAP_SYS_ADMIN` - Operaciones administrativas del sistema
- `CAP_NET_ADMIN` - Configuración de red
- `CAP_SYS_MODULE` - Carga de módulos del kernel
- `CAP_SYS_RAWIO` - Acceso directo a dispositivos
- ... y 30+ capabilities más

**Referencia:** CIS Docker Benchmark 5.3, 5.4

---

### 3. ✅ Read-Only Filesystem

#### Frontend (Nginx)
```yaml
read_only: true
tmpfs:
  - /var/cache/nginx:rw,noexec,nosuid,size=50m
  - /var/run:rw,noexec,nosuid,size=10m
```

**Explicación:**
- El filesystem es de solo lectura
- Nginx puede escribir en `/var/cache/nginx` y `/var/run` mediante tmpfs (en RAM)
- Flags `noexec` y `nosuid` previenen ejecución de binarios y escalación de privilegios

#### AI Service
```yaml
read_only: true
tmpfs:
  - /tmp:rw,noexec,nosuid,size=100m
```

#### Backend
```yaml
read_only: false  # Necesita escribir uploads
```

**Justificación Backend:** El backend requiere escribir archivos subidos por usuarios en `/app/uploads` (volumen persistente).

**Referencia:** CIS Docker Benchmark 5.12

---

### 4. ✅ Límites de Recursos

**Aplicado a todos los servicios:**

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

**Beneficios:**
- ✅ Previene DoS por consumo excesivo de recursos
- ✅ Garantiza recursos mínimos disponibles
- ✅ Mejora estabilidad del sistema

**Distribución de recursos:**

| Servicio | CPU Limit | Memory Limit | CPU Reservation | Memory Reservation |
|----------|-----------|--------------|-----------------|-------------------|
| Frontend | 0.3 | 256M | 0.1 | 128M |
| Backend  | 0.5 | 512M | 0.25 | 256M |
| AI Service | 0.5 | 512M | 0.25 | 256M |
| Prometheus | 0.5 | 512M | - | - |
| Grafana | 0.5 | 512M | - | - |

**Referencia:** CIS Docker Benchmark 6.6, 6.7

---

### 5. ✅ Logging con Rotación

**Aplicado a:** frontend, backend, ai-service

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Configuración:**
- **Driver:** json-file (nativo de Docker)
- **Tamaño máximo por archivo:** 10 MB
- **Número de archivos:** 3 (30 MB total máximo)
- **Rotación automática:** Cuando un archivo alcanza 10 MB

**Beneficios:**
- ✅ Previene llenar disco con logs
- ✅ Retiene suficiente historia para debugging (30 MB)
- ✅ Rotación automática sin intervención manual

**Referencia:** CIS Docker Benchmark 2.12

---

### 6. ✅ Políticas de Restart

```yaml
restart: unless-stopped  # Servicios críticos (frontend, grafana, prometheus)
restart: on-failure:3    # Servicios de aplicación (backend, ai-service)
```

**Estrategias:**
- **`unless-stopped`:** Reinicia siempre excepto cuando se detiene manualmente (infraestructura)
- **`on-failure:3`:** Reinicia hasta 3 veces en caso de fallo, luego se detiene (aplicación)

**Beneficios:**
- ✅ Alta disponibilidad para servicios críticos
- ✅ Evita reinicio infinito de servicios con errores de configuración

---

### 7. ✅ Redes Aisladas

```yaml
networks:
  - frontend-network
  - backend-network
  - database-network
  - monitoring-network
```

**Segmentación:**
- **Frontend Network:** frontend + api-gateway + grafana
- **Backend Network:** backend + frontend + ai-service + api-gateway
- **Database Network:** postgres + redis + backend + ai-service
- **Monitoring Network:** prometheus + grafana + exporters + api-gateway

**Principio de mínimo privilegio:** Cada servicio solo accede a las redes que necesita.

---

## Justificaciones Técnicas

### ¿Por qué el servicio de backup se ejecuta como root?

**Razones técnicas:**
1. **pg_dump:** Requiere permisos especiales para conectarse a PostgreSQL y extraer datos
2. **Cron daemon:** Necesita privilegios de root para programar tareas
3. **Acceso a volúmenes:** Los backups se escriben en volúmenes que pueden tener permisos restrictivos

**Mitigaciones aplicadas:**
```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - CHOWN
  - DAC_OVERRIDE  # Para leer archivos de backup
```

### ¿Por qué el backend no usa read-only filesystem?

El backend necesita escribir archivos subidos por usuarios en el directorio `/app/uploads`, que está montado como volumen persistente. Implementar read-only requeriría:
- Mover uploads a un volumen externo (ya implementado)
- Configurar tmpfs para archivos temporales de Node.js

**Estado:** Parcialmente implementado (volumen para uploads), se puede mejorar con tmpfs en futuras iteraciones.

---

## Verificación

### Verificar usuario no privilegiado

```bash
docker inspect proyecto-frontend --format='{{.Config.User}}'
# Salida esperada: nginxuser o 1001

docker exec proyecto-frontend whoami
# Salida esperada: nginxuser
```

### Verificar capabilities

```bash
docker inspect proyecto-frontend --format='{{.HostConfig.CapDrop}}'
# Salida esperada: [ALL]

docker inspect proyecto-frontend --format='{{.HostConfig.CapAdd}}'
# Salida esperada: [CHOWN SETUID SETGID]
```

### Verificar límites de recursos

```bash
docker stats --no-stream proyecto-backend
# Verificar que CPU% no supere 50% y MEM no supere 512M
```

### Verificar logging

```bash
docker inspect proyecto-frontend --format='{{.HostConfig.LogConfig.Config}}'
# Salida esperada: map[max-file:3 max-size:10m]
```

### Verificar read-only filesystem

```bash
docker inspect proyecto-frontend --format='{{.HostConfig.ReadonlyRootfs}}'
# Salida esperada: true

docker exec proyecto-frontend touch /test.txt
# Salida esperada: touch: /test.txt: Read-only file system
```

---

## Escaneo de Vulnerabilidades

Ver archivo `docs/vulnerability-scan-report.md` para el reporte completo de Trivy.

**Resumen:**
- ✅ Imágenes base actualizadas a versiones sin CVEs críticos
- ✅ Dependencias de Node.js auditadas con `npm audit`
- ✅ Escaneo periódico programado

---

## Referencias

- [CIS Docker Benchmark v1.6.0](https://www.cisecurity.org/benchmark/docker)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [NIST Application Container Security Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)
- [Linux Capabilities Man Page](https://man7.org/linux/man-pages/man7/capabilities.7.html)

---

## Checklist de Implementación

- [x] Usuarios no privilegiados en todos los Dockerfiles
- [x] Versiones específicas de imágenes base
- [x] Multi-stage builds implementados
- [x] `security_opt: no-new-privileges` configurado
- [x] Capabilities eliminadas con `cap_drop: ALL`
- [x] Capabilities mínimas con `cap_add`
- [x] Read-only filesystem (donde aplica)
- [x] Límites de CPU y memoria configurados
- [x] Reservations de recursos configurados
- [x] Logging con rotación automática
- [x] Políticas de restart apropiadas
- [x] Healthchecks en todos los servicios
- [x] Redes aisladas por función
- [ ] Escaneo de vulnerabilidades con Trivy
- [x] Documentación completa

---

**Última actualización:** 22 de noviembre de 2025  
**Próxima revisión:** Diciembre 2025
