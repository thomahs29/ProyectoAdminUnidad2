

## 2. Clasificación de Incidentes

### 2.1 Severidad Crítica

**Descripción:** Incidentes que comprometen la confidencialidad, integridad o disponibilidad de datos sensibles o sistemas críticos.

**Ejemplos:**
- Acceso no autorizado a base de datos PostgreSQL
- Exfiltración de datos personales (RUT, información ciudadana)
- Compromiso de credenciales administrativas (DB_ROOT_USER, Grafana Admin)
- Ransomware o cifrado malicioso de datos
- Caída total del sistema (todos los servicios inaccesibles)

**Tiempo de Respuesta:** Inmediato (máximo 15 minutos)

### 2.2 Severidad Alta

**Descripción:** Incidentes que afectan servicios críticos pero con impacto limitado o parcial.

**Ejemplos:**
- Denegación de servicio (DoS) que afecta disponibilidad
- Explotación de vulnerabilidad conocida en dependencias npm
- Fallo de replicación de PostgreSQL (pérdida de alta disponibilidad)
- Escalación de privilegios detectada en logs
- Contenedor Docker comprometido

**Tiempo de Respuesta:** Máximo 30 minutos

### 2.3 Severidad Media

**Descripción:** Incidentes que afectan funcionalidades no críticas o son detectados tempranamente.

**Ejemplos:**
- Intentos fallidos repetidos de autenticación (fuerza bruta)
- Logs anómalos en servicios no críticos
- Vulnerabilidad identificada sin evidencia de explotación
- Configuración incorrecta detectada en auditoría

**Tiempo de Respuesta:** Máximo 2 horas

### 2.4 Severidad Baja

**Descripción:** Eventos de seguridad que requieren investigación pero no representan amenaza inmediata.

**Ejemplos:**
- Escaneo de puertos desde IP externa
- Alertas de Prometheus sin impacto en servicio
- Actualización de seguridad disponible (sin CVE crítico)

**Tiempo de Respuesta:** Máximo 24 horas

---

## 3. Procedimiento de Detección

### 3.1 Monitoreo Continuo

**Herramientas de Detección:**

**Prometheus + Grafana:**
- Dashboards: `10-postgres.json`, `20-redis.json`, `30-containers-cadvisor.json`
- Métricas monitoreadas: Conexiones activas, uso de CPU/memoria, errores HTTP
- Alertas configuradas: Caída de servicios, uso excesivo de recursos

**Logs de PostgreSQL:**
- Ubicación: Logs de contenedor `postgres-master`
- Eventos críticos: Fallos de autenticación, queries anómalas, desconexiones inesperadas

**Docker Logs:**
- Servicios monitoreados: backend, frontend, ai-service, nginx
- Patrones sospechosos: Errores HTTP 500, excepciones no controladas, reinicios frecuentes

### 3.2 Indicadores de Compromiso (IOC)

**Señales de Alerta:**

**A nivel de Base de Datos:**
- Múltiples intentos de autenticación fallidos desde misma IP
- Queries que modifican tablas de usuarios o roles fuera de horario
- Conexiones desde IPs no autorizadas
- Queries con patrones de inyección SQL

**A nivel de Aplicación:**
- Picos anormales de tráfico HTTP
- Requests con payloads sospechosos (XSS, SQLi)
- Cambios no autorizados en archivos de configuración
- Creación de usuarios administrativos no documentada

**A nivel de Contenedores:**
- Contenedor ejecutándose como root inesperadamente
- Procesos no reconocidos dentro de contenedores
- Uso anormal de recursos (CPU >90% sostenido)
- Contenedor reiniciándose constantemente

**A nivel de Red:**
- Tráfico saliente inusual desde database-network
- Conexiones a IPs externas sospechosas
- Escaneo de puertos internos

### 3.3 Comandos de Verificación Inmediata

**Verificar logs de autenticación fallida:**
```bash
docker logs postgres-master 2>&1 | grep "authentication failed" | tail -50
```

**Verificar conexiones activas a PostgreSQL:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT pid, usename, application_name, client_addr, state FROM pg_stat_activity WHERE state = 'active';"
```

**Verificar logs de errores en backend:**
```bash
docker logs backend --since 1h | grep -i "error\|exception\|fatal"
```

**Verificar contenedores con problemas:**
```bash
docker ps -a --filter "status=exited" --filter "status=restarting"
```

**Verificar uso de recursos:**
```bash
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 3.4 Escalamiento de Alertas

**Nivel 1 - Alerta Automática:**
- Grafana detecta anomalía
- Registro en logs de monitoreo
- Notificación al equipo de DevOps

**Nivel 2 - Investigación Inicial:**
- DevOps verifica logs y métricas
- Determina severidad del incidente
- Activa protocolo de respuesta si procede

**Nivel 3 - Activación del Plan:**
- Incidente confirmado como crítico o alto
- Notificación a equipo de seguridad
- Inicio de procedimientos de contención

---

## 4. Contención Inmediata

### 4.1 Acciones de Contención por Tipo de Incidente

**Compromiso de Base de Datos:**

**Paso 1 - Aislar contenedor comprometido:**
```bash
# Detener contenedor postgres-master
docker stop postgres-master

# Promover réplica a maestro temporalmente
docker exec postgres-replica psql -U postgres -c "SELECT pg_promote();"
```

**Paso 2 - Revisar conexiones activas antes de detener:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename NOT IN ('admin', 'replicator') AND state = 'active';"
```

**Paso 3 - Bloquear acceso a red comprometida:**
```bash
# Desconectar servicio de red backend-network
docker network disconnect backend-network postgres-master
```

**Compromiso de Aplicación (Backend/AI-Service):**

**Paso 1 - Detener servicio comprometido:**
```bash
docker stop backend
# o
docker stop ai-service
```

**Paso 2 - Preservar evidencia:**
```bash
# Exportar logs del contenedor
docker logs backend > incident_backend_$(date +%Y%m%d_%H%M%S).log

# Crear snapshot del contenedor
docker commit backend backend-incident-$(date +%Y%m%d)
```

**Paso 3 - Aislar de otras redes:**
```bash
docker network disconnect gateway-network backend
docker network disconnect backend-network backend
```

**Ataque de Denegación de Servicio (DoS):**

**Paso 1 - Identificar origen del ataque:**
```bash
# Revisar logs de nginx para IPs con alto volumen
docker logs proyecto-gateway | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

**Paso 2 - Bloquear IPs maliciosas en nginx:**
```nginx
# Agregar a infrastructure/nginx/nginx.conf
deny 192.168.1.100;  # IP atacante
```

**Paso 3 - Reiniciar nginx con nueva configuración:**
```bash
docker restart proyecto-gateway
```

**Paso 4 - Implementar rate limiting más agresivo:**
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;
limit_req zone=api_limit burst=10 nodelay;
```

**Contenedor Comprometido:**

**Paso 1 - Detener contenedor inmediatamente:**
```bash
docker stop <container_name>
```

**Paso 2 - Preservar evidencia forense:**
```bash
# Exportar filesystem del contenedor
docker export <container_name> > incident_container_$(date +%Y%m%d).tar

# Guardar logs
docker logs <container_name> > incident_logs_$(date +%Y%m%d).log
```

**Paso 3 - Analizar procesos que estaban corriendo:**
```bash
docker top <container_name>
```

### 4.2 Preservación de Evidencia

**Logs Críticos a Preservar:**

**Logs de PostgreSQL:**
```bash
docker exec postgres-master tar -czf /tmp/postgres_logs_$(date +%Y%m%d).tar.gz /var/lib/postgresql/data/log/
docker cp postgres-master:/tmp/postgres_logs_$(date +%Y%m%d).tar.gz ./evidence/
```

**Logs de Aplicación:**
```bash
mkdir -p ./evidence/$(date +%Y%m%d)
docker logs backend > ./evidence/$(date +%Y%m%d)/backend.log
docker logs frontend > ./evidence/$(date +%Y%m%d)/frontend.log
docker logs ai-service > ./evidence/$(date +%Y%m%d)/ai-service.log
docker logs proyecto-gateway > ./evidence/$(date +%Y%m%d)/nginx.log
```

**Estado de Contenedores:**
```bash
docker ps -a > ./evidence/$(date +%Y%m%d)/containers_status.txt
docker stats --no-stream > ./evidence/$(date +%Y%m%d)/containers_resources.txt
```

**Configuración de Red:**
```bash
docker network inspect backend-network > ./evidence/$(date +%Y%m%d)/backend_network.json
docker network inspect database-network > ./evidence/$(date +%Y%m%d)/database_network.json
```

### 4.3 Comunicación Durante Contención

**Notificaciones Inmediatas:**

**Equipo Interno:**
- Notificar a DevOps y Desarrollo inmediatamente
- Crear canal de comunicación dedicado (Slack, Teams)
- Designar coordinador de incidente

**Stakeholders:**
- Informar a dirección sobre incidente crítico o alto
- Proporcionar estimación inicial de impacto
- Programar actualizaciones cada 30 minutos

**Usuarios (si aplica):**
- Mensaje en sistema: "Mantenimiento de emergencia en curso"
- Estimación de tiempo de recuperación
- No revelar detalles técnicos del incidente

---

## 5. Análisis y Erradicación

### 5.1 Investigación Forense

**Análisis de Logs de Autenticación:**

**Identificar intentos de acceso no autorizado:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM pg_stat_activity WHERE state = 'active' AND usename != 'admin';"
```

**Revisar historial de autenticación:**
```bash
docker logs postgres-master 2>&1 | grep -E "(authentication failed|connection authorized)" | tail -100
```

**Análisis de Queries Sospechosas:**

**Queries lentas o anómalas:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT pid, usename, query, query_start FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"
```

**Análisis de Modificaciones en Base de Datos:**

**Verificar cambios en usuarios y roles:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM usuarios ORDER BY created_at DESC LIMIT 20;"
docker exec postgres-master psql -U admin -d municipalidad_db -c "\du"
```

**Análisis de Contenedores:**

**Verificar imágenes comprometidas:**
```bash
docker images --digests
docker history <image_name>
```

**Buscar procesos sospechosos:**
```bash
docker exec <container_name> ps aux
docker exec <container_name> netstat -tulpn
```


### 5.2 Erradicación de Amenaza

**Eliminación de Accesos No Autorizados:**

**Revocar credenciales comprometidas:**
```bash
# Cambiar contraseña de usuario comprometido en PostgreSQL
docker exec postgres-master psql -U admin -d municipalidad_db -c "ALTER USER app_user WITH PASSWORD 'nueva_contraseña_segura';"
```

**Actualizar todas las credenciales en .env:**
```bash
# Rotar secretos comprometidos
DB_ROOT_PASSWORD=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
```

**Eliminar Malware o Código Malicioso:**

**Reconstruir contenedores desde cero:**
```bash
# Eliminar contenedor comprometido
docker rm -f <container_name>

# Eliminar imagen comprometida
docker rmi <image_name>

# Reconstruir desde Dockerfile
docker compose build --no-cache <service_name>
```

**Eliminar Persistencia:**

**Verificar scripts de inicio modificados:**
```bash
docker exec <container_name> cat /docker-entrypoint.sh
docker exec <container_name> cat /app/server.js
```

**Verificar cron jobs o tareas programadas:**
```bash
docker exec <container_name> crontab -l
```

**Actualizar Vulnerabilidades:**

**Actualizar dependencias npm comprometidas:**
```bash
cd services/backend/src
npm audit fix --force
npm update
```

**Actualizar imágenes Docker:**
```bash
docker pull node:20-alpine3.21
docker pull postgres:16-alpine
docker pull nginx:alpine3.21
docker compose build --no-cache
```

---

## 6. Recuperación del Sistema

### 6.1 Restauración de Servicios

**Orden de Recuperación Recomendado:**

**Fase 1 - Infraestructura Base:**
1. PostgreSQL (postgres-master con datos restaurados)
2. Redis (caché limpio)
3. Redes Docker (verificar aislamiento)

**Fase 2 - Servicios de Aplicación:**
4. Backend (con credenciales actualizadas)
5. AI Service (con credenciales actualizadas)
6. Frontend (nueva build sin caché)

**Fase 3 - Gateway y Monitoreo:**
7. Nginx Gateway (con reglas de firewall actualizadas)
8. Prometheus y Grafana
9. Exporters (postgres-exporter, redis-exporter)

### 6.2 Restauración de Base de Datos

**Desde Backup Reciente:**

**Paso 1 - Verificar backup disponible:**
```bash
ls -lh /backups/postgres/
# Seleccionar backup más reciente ANTES del incidente
```

**Paso 2 - Restaurar base de datos:**
```bash
# Detener postgres-master actual
docker stop postgres-master

# Eliminar volumen comprometido
docker volume rm proyectoadminunidad2_postgres-master-data

# Recrear volumen limpio
docker volume create proyectoadminunidad2_postgres-master-data

# Iniciar postgres-master
docker compose up -d postgres-master

# Esperar que esté listo
docker exec postgres-master pg_isready -U admin

# Restaurar desde backup
docker exec -i postgres-master psql -U admin -d municipalidad_db < /backups/postgres/backup_20251129.sql
```

**Paso 3 - Verificar integridad de datos:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT COUNT(*) FROM usuarios;"
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT COUNT(*) FROM tramites;"
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT COUNT(*) FROM reservas;"
```

### 6.3 Recreación de Contenedores

**Backend:**
```bash
# Detener y eliminar contenedor actual
docker stop backend
docker rm backend

# Reconstruir desde código fuente limpio
cd services/backend
docker compose build --no-cache backend

# Iniciar con credenciales nuevas
docker compose up -d backend

# Verificar logs de inicio
docker logs backend -f
```

**Frontend:**
```bash
# Detener y eliminar
docker stop frontend
docker rm frontend

# Reconstruir
docker compose build --no-cache frontend

# Iniciar
docker compose up -d frontend

# Verificar acceso
curl -I http://localhost:80
```

**AI Service:**
```bash
# Detener y eliminar
docker stop ai-service
docker rm ai-service

# Reconstruir
docker compose build --no-cache ai-service

# Iniciar con nueva GEMINI_API_KEY si fue comprometida
docker compose up -d ai-service

# Verificar logs
docker logs ai-service -f
```

### 6.4 Verificación Post-Recuperación

**Tests de Funcionalidad:**

**Verificar autenticación:**
```bash
curl -X POST http://localhost:80/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

**Verificar conexión a base de datos:**
```bash
docker exec backend node -e "const pool = require('./src/config/db'); pool.query('SELECT NOW()').then(res => console.log(res.rows));"
```

**Verificar replicación PostgreSQL:**
```bash
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM pg_stat_replication;"
```

**Verificar monitoreo:**
- Acceder a Grafana: http://localhost:3001
- Verificar dashboards funcionando
- Confirmar métricas actualizándose

**Tests de Seguridad Post-Recuperación:**

**Escanear vulnerabilidades:**
```bash
docker scout cves proyecto-backend
docker scout cves proyecto-frontend
docker scout cves proyecto-ai-service
```

**Verificar configuraciones de seguridad:**
```bash
# Verificar usuarios no privilegiados
docker inspect backend --format='{{.Config.User}}'
docker inspect frontend --format='{{.Config.User}}'

# Verificar read-only filesystems
docker inspect frontend --format='{{.HostConfig.ReadonlyRootfs}}'

# Verificar capabilities
docker inspect backend --format='{{.HostConfig.CapDrop}}'
```

### 6.5 Monitoreo Post-Recuperación

**Monitoreo Intensivo (primeras 24 horas):**

- Revisar logs cada 30 minutos
- Monitorear Grafana dashboards continuamente
- Verificar conexiones activas a PostgreSQL cada hora
- Analizar patrones de tráfico en nginx

**Comandos de Monitoreo:**
```bash
# Verificar logs en tiempo real
docker logs backend -f --since 1h | grep -i "error\|warn"
docker logs postgres-master -f --since 1h | grep -i "failed\|error"

# Monitorear recursos
watch -n 5 'docker stats --no-stream'

# Verificar conexiones
watch -n 10 'docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT COUNT(*) FROM pg_stat_activity;"'
```

---

### 7.3 Mejoras Implementadas

**Actualizaciones de Seguridad:**

**Ejemplo de mejoras comunes post-incidente:**

**Si el incidente fue por credenciales débiles:**
- Implementar política de contraseñas más estricta
- Forzar rotación de todas las credenciales
- Implementar autenticación multifactor (MFA)
- Auditar todas las cuentas administrativas

**Si el incidente fue por vulnerabilidad en dependencias:**
- Automatizar escaneo de vulnerabilidades (npm audit en CI/CD)
- Implementar proceso de actualización semanal obligatorio
- Configurar alertas automáticas para CVEs críticos

**Si el incidente fue por configuración incorrecta:**
- Implementar checklist de hardening pre-deployment
- Automatizar verificación de configuraciones con scripts
- Realizar auditorías mensuales de configuración

**Si el incidente fue por falta de monitoreo:**
- Configurar alertas en Grafana para eventos críticos
- Implementar logs centralizados (ELK, Splunk)
- Establecer guardias 24/7 para incidentes críticos
