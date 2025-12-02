
**Servicios propios (aplicaciones):**
- Frontend: 0C 2H (2 vulnerabilidades libpng)
- Backend: 1C 4H (harfbuzz + libpng + cross-spawn/glob)
- AI-Service: 0C 2H (cross-spawn + glob)
- Backup: 0C 2H (c-ares + less)

**Servicios de terceros (infraestructura):**
- nginx:1.27.2-alpine: 1C 16H (curl, expat, libxml2, libxslt, libpng, c-ares, xz, musl, openssl)
- redis:7-alpine: 4C 39H (stdlib Go 1.18.2 obsoleto en gosu)
- postgres:15-alpine: 0C 4H (stdlib Go 1.24.6)
- rediscommander: 10C 49H (Alpine 3.12 obsoleto + Node.js 12 + deps npm antiguas)
- grafana:11.2.0: 5C 22H (stdlib Go, openssl, curl, crypto libs)

**Total general: 21 CRITICAL, 140 HIGH**

**IMPORTANTE - Servicios de terceros**: La mayoría de vulnerabilidades provienen de imágenes oficiales de terceros fuera de nuestro control directo:
- **rediscommander**: 59 CVEs (Alpine 3.12 EOL + Node.js 12 EOL) - REQUIERE IMAGEN ALTERNATIVA
- **redis:7-alpine**: 43 CVEs (gosu compilado con Go 1.18.2)
- **grafana:11.2.0**: 27 CVEs (versión oficial con Go 1.22.4)
- **nginx:1.27.2-alpine**: 17 CVEs (Alpine 3.20 + librerías sistema)

**Backend/AI-Service**: Las vulnerabilidades npm (cross-spawn, glob) son **FALSO POSITIVO** por caché SBOM. Versiones reales instaladas: 7.0.6 y 11.1.0 (seguras).

---

## Vulnerabilidades por Servicio

### 1. Frontend (proyectoadminunidad2-frontend:latest)

**Vulnerabilidades totales: 0C 2H**

**Paquetes afectados:**
- libpng 1.6.47-r0: CVE-2025-65018 (HIGH, not fixed)
- libpng 1.6.47-r0: CVE-2025-64720 (HIGH, not fixed)

**Origen:** Dependencia del sistema Alpine Linux 3.21, requerida por nginx para procesamiento de imágenes.

**Razón por la que no se puede corregir:**
- Alpine Linux aún no ha liberado un parche para libpng 1.6.47
- CVEs reportados recientemente (enero 2025), pendientes de fix upstream

**Impacto potencial:**
- Vulnerabilidades de procesamiento de imágenes PNG malformadas
- Podrían permitir DoS o corrupción de memoria

**Mitigación implementada:**
- Usuario no privilegiado (nginxuser UID 1001)
- Read-only filesystem con tmpfs para /var/cache/nginx
- Capabilities mínimas (CHOWN, SETUID, SETGID)
- Network segmentation

---

### 2. Backend (proyectoadminunidad2-backend:latest)

**Vulnerabilidades totales: 1C 4H (solo 1C 2H reales sin fix)**

**Paquetes afectados:**
- harfbuzz 9.0.0-r1: CVE-2024-56732 (CRITICAL, not fixed - SIN FIX)
- libpng 1.6.47-r0: CVE-2025-65018 (HIGH, not fixed - SIN FIX)
- libpng 1.6.47-r0: CVE-2025-64720 (HIGH, not fixed - SIN FIX)
- cross-spawn 7.0.3: CVE-2024-21538 (HIGH, CVSS 7.7, fix 7.0.5+ - CORREGIDO 7.0.6 runtime)
- glob 10.4.2: CVE-2025-64756 (HIGH, CVSS 7.5, fix 10.5.0+ - CORREGIDO 11.1.0 runtime)

**cross-spawn/glob - FALSO POSITIVO:**
Docker Scout reporta versiones antiguas por SBOM cacheado. Verificación real:
```bash
/app/node_modules/cross-spawn/package.json: "version": "7.0.6"
/app/node_modules/glob/package.json: "version": "11.1.0"
```

**Origen paquetes Alpine (harfbuzz, libpng):**
- Dependencias del sistema para generación de PDFs (Cairo/Pango)
- Alpine 3.21 sin parches disponibles

**Impacto potencial (solo harfbuzz/libpng):**
- **harfbuzz (CRITICAL)**: RCE mediante fuentes malformadas en generación de PDFs
- **libpng (HIGH x2)**: DoS mediante imágenes PNG malformadas

**Mitigación implementada:**
- Usuario no privilegiado (appuser UID 1001)
- Capabilities mínimas (NET_BIND_SERVICE)
- Límites de recursos (CPU 0.5, MEM 512M)
- Network segmentation
- Logging de solicitudes

---

### 3. AI-Service (proyecto-ai-service:1.0.0)

**Vulnerabilidades totales: 0C 2H (TODAS CORREGIDAS - falso positivo)**

**Paquetes reportados:**
- cross-spawn 7.0.3: CVE-2024-21538 (HIGH, CVSS 7.7 - CORREGIDO 7.0.6 runtime)
- glob 10.4.2: CVE-2025-64756 (HIGH, CVSS 7.5 - CORREGIDO 11.1.0 runtime)

**FALSO POSITIVO COMPLETO:**
Verificación real en contenedor:
```bash
/app/node_modules/cross-spawn/package.json: "version": "7.0.6"
/app/node_modules/glob/package.json: "version": "11.1.0"
```

**Estado real: 0 vulnerabilidades** (Docker Scout con SBOM desactualizado)

---

### 4. Backup (proyectoadminunidad2-backup:latest)

**Vulnerabilidades totales: 0C 2H**

**Paquetes afectados:**
- c-ares 1.33.1-r0: CVE-2025-31498 (HIGH, not fixed)
- less 643-r2: CVE-2024-32487 (HIGH, not fixed)

**Origen:**
- Dependencias del sistema Alpine Linux 3.20
- `c-ares`: Librería de resolución DNS asíncrona
- `less`: Paginador de texto

**Razón por la que no se pueden corregir:**
- Alpine 3.20 sin parches disponibles
- CVEs de enero 2025 (c-ares) y abril 2024 (less)

**Impacto potencial:**
- **c-ares**: DoS en resolución DNS
- **less**: Command injection mediante archivos especialmente crafteados

**Mitigación implementada:**
- Contenedor ejecuta solo cron + pg_dump (no procesa archivos arbitrarios)
- Network segmentation (solo acceso a postgres-master)
- Backups en volumen dedicado con permisos restringidos

---

### 5. nginx:1.27.2-alpine (Servicio de terceros)

**Vulnerabilidades totales: 1C 16H**

**Paquetes afectados:**
- curl 8.11.0-r2: 1C 3H (CVE-2025-0665, CVE-2025-9086, CVE-2025-5399, CVE-2025-0725)
- libxml2 2.12.7-r0: 0C 3H (CVE-2025-24928, CVE-2024-56171, CVE-2025-6021)
- libxslt 1.1.39-r1: 0C 2H (CVE-2025-24855, CVE-2024-55549)
- expat 2.6.4-r0: 0C 2H (CVE-2025-59375, CVE-2024-8176)
- libpng 1.6.44-r0: 0C 2H (CVE-2025-65018, CVE-2025-64720)
- c-ares 1.33.1-r0: 0C 1H (CVE-2025-31498)
- xz 5.6.2-r0: 0C 1H (CVE-2025-31115)
- musl 1.2.5-r0: 0C 1H (CVE-2025-26519)
- openssl 3.3.2-r1: 0C 1H (CVE-2025-9230)

**Origen:** Imagen oficial de nginx basada en Alpine 3.20

**Razón por la que no se pueden corregir:**
- Imagen oficial de Docker Hub fuera de nuestro control
- La mayoría de CVEs tienen fix disponible en Alpine 3.20, pero nginx:1.27.2-alpine no ha sido reconstruido
- Esperando actualización de imagen oficial a nginx:1.27.3 o superior

**Impacto potencial:**
- curl (CRITICAL): Remote Code Execution en libcurl
- libxml2/libxslt: XML parsing DoS/RCE
- openssl: TLS vulnerabilities

**Mitigación implementada:**
- Reverse proxy expuesto solo a red interna
- Rate limiting configurado
- SSL/TLS con certificados actualizados
- Logging detallado de solicitudes


---

### 6. redis:7-alpine (Servicio de terceros)

**Vulnerabilidades totales: 4C 39H**

**Paquetes afectados:**
- stdlib Go 1.18.2: 4C 39H (43 CVEs en gosu compilado con Go obsoleto)

**CVEs críticos destacados:**
- CVE-2024-24790, CVE-2023-24540, CVE-2023-24538, CVE-2025-22871
- CVE-2023-44487 (CISA KEV - HTTP/2 Rapid Reset)

**Origen:** 
- Imagen oficial redis:7-alpine incluye `gosu` (herramienta para cambiar usuarios)
- gosu fue compilado con Go 1.18.2 (abril 2022), versión obsoleta con 43 vulnerabilidades conocidas

**Razón por la que no se pueden corregir:**
- Imagen oficial de Docker Hub
- Redis no ha actualizado la versión de gosu en la imagen
- Gosu se usa solo en el entrypoint para cambiar a usuario redis

**Impacto potencial:**
- La mayoría de CVEs afectan librerías Go (html/template, net/http, crypto) no utilizadas por gosu
- Gosu solo ejecuta `setuid()` y `exec()`, superficie de ataque mínima
- Vulnerabilidad CVE-2023-44487 (CISA KEV) no explotable en gosu

**Mitigación implementada:**
- Redis ejecuta como usuario no privilegiado (redis)
- Network segmentation (solo acceso desde backend/ai-service)
- Persistencia en volumen dedicado
- No expuesto a internet público
- Redis commander usa autenticación

**Recomendación:** Evaluar usar `su-exec` o `tini` como alternativa a gosu, o construir imagen custom con gosu actualizado.

---

### 7. postgres:15-alpine (Servicio de terceros)

**Vulnerabilidades totales: 0C 4H**

**Paquetes afectados:**
- stdlib Go 1.24.6: 0C 4H (CVE-2025-61725, CVE-2025-61723, CVE-2025-58188, CVE-2025-58187)

**Origen:**
- Imagen oficial postgres:15-alpine incluye binarios Go (gosu)
- Go 1.24.6 con 4 CVEs de enero 2025

**Mitigación implementada:**
- Postgres ejecuta como usuario postgres
- Replicación master-replica configurada
- Backups automáticos cada 6 horas
- Network segmentation (solo acceso desde backend)
- Autenticación con contraseñas fuertes

**Recomendación:** Actualizar a postgres:16-alpine o postgres:17-alpine cuando sea compatible con la aplicación.

---

### 8. rediscommander/redis-commander (Servicio de terceros - CRÍTICO)

**Vulnerabilidades totales: 10C 49H**

**IMAGEN OBSOLETA CON MÚLTIPLES COMPONENTES EOL:**

**Paquetes críticos afectados:**
- **Alpine 3.12** (End of Life mayo 2022): apk-tools, busybox, openssl 1.1.1k, zlib
- **Node.js 12.22.1** (End of Life abril 2022): 2C 8H
- **Dependencias npm obsoletas**: ejs, minimist, json-schema, form-data, execa, tar, express, jsonwebtoken, async, yarn, etc.

**CVEs críticos destacados:**
- CVE-2022-37434 (zlib): Buffer overflow
- CVE-2021-3711 (openssl): Remote Code Execution
- CVE-2022-29078 (ejs): Template injection CVSS 9.8
- CVE-2021-44906 (minimist): Prototype pollution CVSS 9.8
- CVE-2021-3918 (json-schema): Prototype pollution CVSS 9.8

**Origen:**
- Imagen oficial de rediscommander mantenida por comunidad
- Última actualización: hace más de 3 años
- Basada en Alpine 3.12 (EOL) y Node.js 12 (EOL)

**Razón por la que no se pueden corregir:**
- Imagen obsoleta sin mantenimiento activo
- Se requiere actualizar a imagen alternativa o construir imagen custom

**Impacto potencial:**
- MUY ALTO: 59 CVEs con múltiples CRITICAL/HIGH
- RCE, prototype pollution, inyección de código
- Componentes base completamente obsoletos

**Mitigación implementada:**
- Servicio NO expuesto a internet público
- Solo accesible desde red interna `app-network`
- Autenticación HTTP Basic configurada
- Solo usado para visualización (no modificaciones críticas)
- Network segmentation estricta

---

### 9. grafana/grafana:11.2.0 (Servicio de terceros)

**Vulnerabilidades totales: 5C 22H**

**Paquetes afectados:**
- stdlib Go 1.22.4: 1C 8H (CVE-2025-22871 + CVEs de parsers)
- openssl 3.1.4-r5: 1C 3H (CVE-2024-5535 + CVEs TLS)
- curl 8.9.0-r0: 1C 3H (CVE-2025-0665 + CVEs HTTP)
- golang.org/x/crypto 0.26.0: 1C 2H (CVE-2024-45337 CVSS 9.1)
- grafana-plugin-sdk-go 0.241.0: 1C (CVE-2024-8986 - credentials)
- golang.org/x/oauth2, jwt libs, musl, etc.

**Origen:**
- Imagen oficial de Grafana Labs
- Versión 11.2.0 de agosto 2024

**Razón por la que no se pueden corregir:**
- Imagen oficial fuera de nuestro control
- Esperando actualización a Grafana 11.3+ o 12.x

**Impacto potencial:**
- golang.org/x/crypto: Improper Authorization CVSS 9.1
- grafana-plugin-sdk-go: Credential exposure
- openssl/curl: TLS/HTTP vulnerabilities

**Mitigación implementada:**
- Grafana NO expuesto a internet público
- Autenticación requerida (admin/user credentials)
- HTTPS con certificados válidos
- Network segmentation
- Dashboards de solo lectura para usuarios normales



---

## Medidas de Mitigación Implementadas

Aunque estas vulnerabilidades no tienen fix disponible o están en imágenes de terceros, se han implementado **medidas de hardening exhaustivas** para minimizar la superficie de ataque:

### 1. Usuarios No Privilegiados
- **Frontend**: Usuario `nginxuser` (UID 1001)
- **Backend**: Usuario `appuser` (UID 1001)
- **AI-Service**: Usuario `aiuser` (UID 1001)
- **Justificación Backup**: Requiere root para `pg_dump` y `cron`

**Mitigación:** Limita el daño de explotación exitosa (atacante sin privilegios root).

### 2. Read-Only Filesystem
- **Frontend**: Root filesystem de solo lectura + tmpfs para `/var/cache/nginx`, `/var/run`
- **AI-Service**: Root filesystem de solo lectura + tmpfs para `/tmp`

**Mitigación:** Impide modificación de archivos del sistema o instalación de malware persistente.

### 3. Capabilities Mínimas
```yaml
cap_drop: [ALL]
cap_add:
  # Frontend
  - CHOWN, SETUID, SETGID
  # Backend/AI-Service
  - NET_BIND_SERVICE
```

**Mitigación:** Elimina capacidades peligrosas del kernel que facilitan escalada de privilegios.

### 4. No New Privileges
```yaml
security_opt:
  - no-new-privileges:true
```

**Mitigación:** Previene que procesos hijos ganen privilegios adicionales mediante setuid/setgid.

### 5. Límites de Recursos
```yaml
deploy:
  resources:
    limits:
      cpus: '0.3-0.5'
      memory: 256M-512M
    reservations:
      cpus: '0.1-0.25'
      memory: 128M-256M
```

**Mitigación:** Previene ataques DoS mediante consumo excesivo de recursos.

### 6. Network Segmentation
- Red dedicada `app-network` para servicios de aplicación
- Redis/Postgres solo accesibles desde backend/ai-service
- Grafana/Prometheus en red de monitoreo separada
- Rediscommander aislado con autenticación HTTP Basic

**Mitigación:** Limita propagación lateral de ataques.

### 7. Logging y Monitoreo
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

**Mitigación:** Detección de intentos de explotación + prevención de disk fill attacks.

### 8. Multi-Stage Builds
- Frontend: Builder + Nginx runtime
- Backend/AI-Service: Dependencies + Runtime

**Mitigación:** Reduce superficie de ataque eliminando herramientas de compilación.

### 9. Actualizaciones Aplicadas

**Imágenes propias (aplicaciones):**
- Todas las dependencias npm actualizadas a versiones seguras
- Imágenes base Alpine 3.21 (Frontend/Backend/AI-Service)
- Imagen base Alpine 3.20 (Backup)

**Paquetes Alpine con fix aplicado:**
- openssl: versiones más recientes con fixes disponibles
- musl: versiones con CVE-2025-26519 corregido donde disponible
- curl: versiones con múltiples CVEs corregidos donde disponible
- expat, libxml2, busybox, tiff: actualizados a últimas versiones estables

**Imágenes de terceros (limitaciones):**
- nginx:1.27.2-alpine: Esperando reconstrucción oficial con Alpine 3.20 actualizado
- redis:7-alpine: gosu con Go 1.18.2 EOL (fuera de control)
- postgres:15-alpine: gosu con Go 1.24.6 (esperando 1.24.8+)
- rediscommander: Alpine 3.12 + Node.js 12 EOL - **REQUIERE REEMPLAZO**
- grafana:11.2.0: Esperando actualización oficial a 11.4+

### 10. Hardening Específico por Servicio

**Frontend (nginx):**
- Rate limiting configurado
- Headers de seguridad (HSTS, CSP, X-Frame-Options)
- Compresión gzip habilitada
- SSL/TLS con certificados actualizados

**Backend/AI-Service:**
- Validación de entrada en todos los endpoints
- Sanitización de datos para generación de PDFs
- CORS configurado restrictivamente
- JWT con expiración corta

**Redis:**
- Requirepass habilitado
- Bind a localhost en contenedor
- Persistencia AOF + RDB
- Maxmemory policy configurada

**Postgres:**
- Autenticación con contraseñas fuertes
- Replicación master-replica
- Backups automáticos cada 6 horas
- SSL/TLS en conexiones

**Rediscommander (temporal):**
- HTTP Basic Authentication
- Solo acceso desde red interna
- Sin exposición a internet público
- Modo read-only para operaciones críticas

---

## Análisis de Riesgo

### Vulnerabilidades en Servicios Propios (Aplicaciones)

**Frontend (0C 2H):**
- Riesgo: BAJO - Solo libpng sin fix
- Probabilidad explotación: BAJA (requiere imagen PNG malformada específica)
- Impacto: MEDIO (DoS temporal)
- Mitigación efectiva: Read-only FS + usuario no privilegiado

**Backend (1C 2H reales):**
- Riesgo: MEDIO - harfbuzz CRITICAL
- Probabilidad explotación: BAJA-MEDIA (requiere fuente malformada en generación PDF)
- Impacto: ALTO si explotado (RCE potencial)
- Mitigación efectiva: Usuario no privilegiado + validación de entrada + límites de recursos

**AI-Service (0C 0H reales):**
- Riesgo: NINGUNO - Vulnerabilidades corregidas (falso positivo Scout)
- Estado: SEGURO

**Backup (0C 2H):**
- Riesgo: BAJO - c-ares + less
- Probabilidad explotación: MUY BAJA (servicio no procesa entrada externa)
- Impacto: BAJO (solo backups afectados)
- Mitigación efectiva: Network isolation + solo acceso a postgres

### Vulnerabilidades en Servicios de Terceros

**nginx:1.27.2-alpine (1C 16H):**
- Riesgo: MEDIO-ALTO - curl CRITICAL + múltiples librerías
- Probabilidad explotación: MEDIA (reverse proxy expuesto)
- Impacto: ALTO (gateway de entrada)
- Mitigación efectiva: Rate limiting + Headers seguridad + Network segmentation
- **Acción requerida**: Esperar nginx:1.27.3-alpine con Alpine 3.20 actualizado

**redis:7-alpine (4C 39H):**
- Riesgo: BAJO - Vulnerabilidades en gosu (solo entrypoint)
- Probabilidad explotación: MUY BAJA (gosu no expuesto, solo syscalls setuid/exec)
- Impacto: BAJO (gosu no en runtime)
- Mitigación efectiva: Network isolation + requirepass + no expuesto públicamente
- **Acción recomendada**: Considerar imagen custom con gosu actualizado

**postgres:15-alpine (0C 4H):**
- Riesgo: BAJO - stdlib Go en gosu
- Probabilidad explotación: MUY BAJA (gosu solo en entrypoint)
- Impacto: BAJO
- Mitigación efectiva: Replicación + backups + network isolation
- **Acción recomendada**: Evaluar migración a postgres:16-alpine

**rediscommander (10C 49H) - RIESGO CRÍTICO:**
- Riesgo: **MUY ALTO** - Sistema completamente obsoleto (Alpine 3.12 EOL + Node.js 12 EOL)
- Probabilidad explotación: ALTA si expuesto
- Mitigación: No expuesto público + HTTP Basic Auth + network isolation

**grafana:11.2.0 (5C 22H):**
- Riesgo: MEDIO - Go stdlib + librerías crypto
- Probabilidad explotación: BAJA-MEDIA (requiere autenticación)
- Impacto: ALTO si explotado (acceso a métricas/dashboards)
- Mitigación efectiva: Autenticación + HTTPS + network isolation + dashboards read-only
- **Acción recomendada**: Actualizar a grafana:11.4+ o 12.x cuando esté disponible

### Probabilidades de Explotación Exitosa

**Escenario 1 - Atacante externo (sin acceso a red):**
- Probabilidad: MUY BAJA
- Superficie de ataque limitada a nginx (reverse proxy)
- Requiere explotar CVE-2025-0665 (curl CRITICAL) a través de nginx

**Escenario 2 - Atacante con acceso a red interna:**
- Probabilidad: BAJA-MEDIA
- Podría atacar servicios internos (redis, postgres, grafana)
- Mitigado por autenticación + network segmentation



