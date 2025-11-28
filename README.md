### ¿Qué es el Proyecto?

Sistema integral de gestión de reservas de licencias de conducir para la Municipalidad de Linares. Una plataforma web que automatiza el proceso de solicitud, aprobación y seguimiento de trámites de licencias de conducir.

### Licitación Elegida

**Licitación:** Modernización de Servicios Municipales
**Descripción:** Implementación de plataforma digital para gestión de trámites de licencias de conducir
**Año:** 2025
**Municipalidad:** Linares, Región del Ñuble, Chile

### ¿Qué Resuelve el Sistema?

✅ **Para Ciudadanos:**
- Reservar hora de atención online 24/7
- Consultar estado de trámite en tiempo real
- Recibir notificaciones por correo
- Cancelar reservas si es necesario
- Consultar datos con IA (vencimiento de licencia, etc.)

✅ **Para Funcionarios:**
- Aprobar/rechazar solicitudes de reserva
- Ver documentos adjuntos por ciudadanos
- Descargar reportes de reservas
- Gestionar la cola de atención

✅ **Para Administradores:**
- Panel de estadísticas completo
- Envío de notificaciones masivas
- Generación de reportes (Excel, PDF)
- Monitoreo del sistema
- Gestión de usuarios y roles

### Integrantes del Equipo
Jeremy Iturriaga
Joaquín Novoa
Thomas Lizana

---

## 🏗️ Arquitectura

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO FINAL                            │
│              (Navegador: Chrome, Firefox, Safari)                │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│                    Puerto: 80/443                                │
└────────┬──────────────────────────────────────────────┬──────────┘
         │                                              │
    HTTP │                                              │ HTTP
    3001 │                                              │ 3000
┌────────▼──────────┐                          ┌────────▼──────────┐
│   FRONTEND        │                          │   BACKEND         │
│   (React + Vite)  │                          │  (Node.js/Express)│
│   SPA Application │                          │   API REST        │
└────────┬──────────┘                          └────────┬──────────┘
         │                                              │
         │ WebSocket                                   │ TCP 5432
         └──────────────────────┬─────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   PostgreSQL Master    │
                    │  (Base de Datos)       │
                    │  Puerto: 5432          │
                    └───────────┬────────────┘
                                │
                    Replicación Streaming
                                │
                    ┌───────────▼────────────┐
                    │  PostgreSQL Replica    │
                    │  (Base de Datos)       │
                    │  Puerto: 5433          │
                    └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SERVICIOS COMPLEMENTARIOS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🤖 AI Service (Gemini)       └─ Chatbot IA de atención         │
│  📧 Mailtrap SMTP             └─ Envío de notificaciones        │
│  📊 Prometheus                └─ Métricas del sistema           │
│  📈 Grafana                   └─ Visualización de métricas      │
│  🔍 Blackbox Exporter         └─ Monitoreo de endpoints        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Lista de Servicios

| Servicio | Puerto | Descripción | Tecnología |
|----------|--------|-------------|-----------|
| **Frontend** | 3001 | Interfaz web del usuario | React 18.2 + Vite 5.4 |
| **Backend** | 3000 | API REST del sistema | Node.js + Express |
| **AI Service** | 3002 | Servicio de IA Gemini | Node.js + Gemini API |
| **PostgreSQL Master** | 5432 | Base de datos principal | PostgreSQL 15 |
| **PostgreSQL Replica** | 5433 | Base de datos replicada | PostgreSQL 15 |
| **Nginx** | 80/443 | Reverse proxy | Nginx 1.25 |
| **Prometheus** | 9090 | Recolector de métricas | Prometheus 2.45 |
| **Grafana** | 3000 | Dashboard de monitoreo | Grafana 10.0 |
| **Blackbox** | 9115 | Monitoreo de endpoints | Blackbox Exporter |

### Tecnologías Usadas y Por Qué

#### Frontend
- **React 18.2** - Librería moderna para interfaces dinámicas e interactivas
- **Vite 5.4** - Bundler rápido con HMR en desarrollo
- **Axios** - Cliente HTTP con interceptores automáticos de token
- **React Router** - Navegación entre páginas sin refresco

#### Backend
- **Node.js** - Runtime JavaScript server-side de alto rendimiento
- **Express.js** - Framework web minimalista y flexible
- **PostgreSQL** - Base de datos relacional confiable y ACID
- **JWT** - Autenticación stateless y segura
- **Nodemailer** - Envío de correos transaccionales

#### IA
- **Google Gemini API** - IA generativa moderna y precisa
- **Node.js** - Servicio independiente escalable

#### DevOps/Monitoreo
- **Docker** - Containerización para reproducibilidad
- **Docker Compose** - Orquestación local de servicios
- **PostgreSQL Streaming Replication** - Alta disponibilidad sin aplicación
- **Prometheus** - Recolección de métricas time-series
- **Grafana** - Visualización de métricas y alertas
- **Blackbox Exporter** - Monitoreo de disponibilidad de endpoints

---

## Alta Disponibilidad

### Servicios Replicados

#### 1. **PostgreSQL Replication**
```
┌──────────────────────┐         ┌──────────────────────┐
│ PostgreSQL MASTER    │         │ PostgreSQL REPLICA   │
│ (Escritura/Lectura)  │────────▶│ (Solo Lectura)       │
│ Puerto: 5432         │         │ Puerto: 5433         │
└──────────────────────┘         └──────────────────────┘
```

**Cómo funciona:**
- El MASTER recibe todas las escrituras
- Los WAL (Write Ahead Logs) se replican al REPLICA en tiempo real
- Si MASTER falla, REPLICA está listo para failover manual

**Ventajas:**
- Backups sin interrumpir el servicio
- Lectura distribuida (lectura en REPLICA si se implementa)
- RPO (Recovery Point Objective): ~0 segundos

#### 2. **Nginx con Upstream Routing**
```
┌─────────────────────┐
│   Nginx Load        │
│   Balancer          │
└────────┬────────────┘
         │
    ┌────┴────┐
    │          │
┌───▼───┐  ┌──▼───┐
│Backend│  │Backend│
│ Inst1 │  │ Inst2 │
└───────┘  └───────┘
```

**Cómo funciona:**
- Nginx distribuye tráfico entre múltiples instancias
- Health checks automáticos
- Failover transparente si una instancia cae

### Failover

**Escenario 1: Caída de PostgreSQL MASTER**
```
1. Sistema detecta que MASTER no responde
2. Administrador ejecuta: promocionar REPLICA a MASTER
3. Sistema se reconecta a nuevo MASTER (puerto 5432)
4. Servicio se restaura automáticamente
```

**Comando:**
```bash
docker exec pg-replica pg_ctl promote -D /var/lib/postgresql/data
```

**Escenario 2: Caída de Backend/Frontend**
```
1. Nginx detecta health check fallido (cada 5s)
2. Nginx automáticamente enruta al siguiente servidor disponible
3. Sin intervención manual requerida
```

---

## Componente IA

### ¿Qué Hace?

El componente IA proporciona un chatbot inteligente que:

1. **Responde Preguntas Generales**
   - Información sobre trámites
   - Requisitos de documentos
   - Horarios de atención

2. **Consultas de Licencia**
   - Lee RUT del usuario autenticado
   - Consulta base de datos municipal
   - Informa: fecha de vencimiento, días restantes, estado

3. **Historial de Conversaciones**
   - Guarda todas las preguntas/respuestas
   - Filtrable por usuario
   - Para auditoría y mejora

### ¿Por Qué es Útil para la Licitación?

 **Reduce Carga de Funcionarios**
- Responde preguntas frecuentes automáticamente
- Ciudadanos autoservicio 24/7

**Mejora Experiencia del Ciudadano**
- Respuestas inmediatas
- Información personalizada
- Menos tiempo de espera

 **Genera Datos**
- Analiza preguntas frecuentes
- Identifica problemas comunes
- Base para mejora continua

### Cómo Usarlo

#### 1. Acceder al Chat IA
```
1. Autenticarse como ciudadano
2. Click en botón "💬 Chat IA" (en el header)
3. Se abre el chat en modal
```

#### 2. Hacer Preguntas

**Pregunta General:**
```
Usuario: ¿Cuáles son los requisitos para renovación?
IA: Los requisitos para renovación de licencia son...
```

**Consulta de Vencimiento:**
```
Usuario: ¿Cuándo vence mi licencia?
Sistema: Lee el RUT automáticamente
IA: Su licencia vence el 15 de marzo 2026, en 135 días.
```

#### 3. Preguntas Sugeridas
- Al abrir el chat, verás preguntas sugeridas (FAQs)
- Click en cualquiera para enviarla automáticamente

#### 4. Historial
- Las conversaciones se guardan automáticamente
- Accesible desde perfil de usuario (próxima versión)

### Arquitectura de IA

```
┌─────────────────┐
│ Chat Frontend   │
│ (React)         │
└────────┬────────┘
         │ HTTP POST
┌────────▼────────────────────┐
│ Backend API                 │
│ POST /api/ai/chat           │
│ GET /api/ai/faq             │
│ GET /api/ai/historial       │
└────────┬────────────────────┘
         │ HTTP
┌────────▼────────────────────┐
│ AI Service (Node.js)        │
│ Puerto 3002                 │
└────────┬────────────────────┘
         │
    ┌────┴────────────────────┐
- **RAM:** 4GB
- **CPU:** 2 cores
- **Disco:** 10GB
- **OS:** Linux, macOS o Windows (con WSL2)

#### Recomendados (Producción)
- **RAM:** 8GB+
- **CPU:** 4 cores
- **Disco:** 50GB+
- **Conexión:** 100Mbps+

### Verificar Versiones

```bash
# Verificar Docker
docker --version
# Docker version 20.10.0 o superior

# Verificar Docker Compose
docker-compose --version
# Docker Compose version 1.29.0 o superior
```

### Instrucciones Paso a Paso

#### 1. Clonar Repositorio

```bash
git clone https://github.com/thomahs29/ProyectoAdminUnidad2.git
cd ProyectoAdminUnidad2
```

#### 2. Crear Archivo .env

```bash
cp .env.example .env
```

**Contenido de .env:**
```env
# Base de Datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=linares_db
DB_USER=admin
DB_PASSWORD=password_segura_123
DB_SSL=true

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria
JWT_EXPIRES=24h

# Puertos
PORT=3000
FRONTEND_PORT=3001
AI_SERVICE_PORT=3002
POSTGRES_PORT=5432
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Mailtrap (Correos)
MAILTRAP_HOST=send.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=tu_usuario_mailtrap
MAILTRAP_PASS=tu_password_mailtrap
MAILTRAP_FROM=noreply@municipalidadlinares.cl

# Gemini API
GEMINI_API_KEY=tu_api_key_gemini

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

#### 3. Levantar los Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 4. Esperar Inicialización

```bash
# La base de datos tarda ~30 segundos en inicializar
# Verificar estado:
docker-compose ps

# Si todo está "healthy", proceder al siguiente paso
```

#### 5. Verificar Conectividad

```bash
# Frontend
curl http://localhost:3001

# Backend
curl http://localhost:3000/api/health
# Debe retornar: {"status":"ok"}

# AI Service
curl http://localhost:3002/health

# PostgreSQL
docker exec postgres psql -U admin -d linares_db -c "SELECT NOW();"
```

### URLs de Acceso

| Servicio | URL | Notas |
|----------|-----|-------|
| **Frontend** | http://localhost:3001 | Aplicación principal |
| **Backend API** | http://localhost:3000/api | Ver documentación |
| **AI Service** | http://localhost:3002 | API interna |
| **PostgreSQL** | localhost:5432 | Base de datos |
| **Prometheus** | http://localhost:9090 | Métricas (admin) |
| **Grafana** | http://localhost:3000 | Dashboard (admin) |
| **PgAdmin** | http://localhost:5050 | Gestor BD (admin) |

### Usuarios y Contraseñas de Prueba

#### Sistema Principal

| Rol | Email | Contraseña | RUT |
|-----|-------|-----------|-----|
| **Ciudadano** | ciudadano@test.com | Password123! | 12345678-9 |
| **Funcionario** | funcionario@test.com | Password123! | 87654321-0 |
| **Administrador** | admin@test.com | Password123! | 11111111-1 |

#### Acceso a Herramientas

| Herramienta | Usuario | Contraseña |
|-------------|---------|-----------|
| **Grafana** | admin | admin |
| **PgAdmin** | pgadmin@test.com | pgadmin |
| **PostgreSQL** | admin | password_segura_123 |

### Comandos Útiles

#### Gestión de Servicios

```bash
# Ver estado de todos los servicios
docker-compose ps

# Reiniciar un servicio
docker-compose restart backend
docker-compose restart frontend

# Detener todos los servicios
docker-compose down

# Detener y limpiar datos (⚠️ Cuidado!)
docker-compose down -v

# Ver logs de un servicio
docker-compose logs -f [servicio]
```

#### Base de Datos

```bash
# Acceder a PostgreSQL interactivamente
docker exec -it postgres psql -U admin -d linares_db

# Hacer dump de la BD
docker exec postgres pg_dump -U admin linares_db > backup.sql

# Restaurar BD desde dump
docker exec -i postgres psql -U admin linares_db < backup.sql

# Ver tamaño de la BD
docker exec postgres psql -U admin -d linares_db -c "SELECT pg_size_pretty(pg_database_size('linares_db'));"
```

#### Backend

```bash
# Instalar dependencias
docker exec backend npm install

# Ver logs en vivo
docker-compose logs -f backend

# Ejecutar tests (si existen)
docker exec backend npm test
```

#### Frontend

```bash
# Construir para producción
docker exec frontend npm run build

# Ver logs en vivo
docker-compose logs -f frontend
```

#### Monitoreo

```bash
# Ejecutar un test de salud rápido
curl http://localhost:3000/api/health
curl http://localhost:3001

# Ver métricas Prometheus
curl http://localhost:9090/api/v1/query?query=up
```

---

## Backup y Monitoreo

### Backup de Base de Datos

#### 1. Backup Manual

```bash
# Crear backup
docker exec postgres pg_dump -U admin -d linares_db -F c > backup_$(date +%Y%m%d_%H%M%S).dump

# O en formato SQL
docker exec postgres pg_dump -U admin -d linares_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Backup Automatizado

```bash
# Script de backup automático (ejecutar con cron)
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec postgres pg_dump -U admin -d linares_db > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

**Configurar en crontab:**
```bash
# Backup diario a las 2 AM
0 2 * * * /path/to/backup.sh
```

#### 3. Backup con Script Incluido

```bash
# Usar el script de backup incluido
docker-compose exec -T postgres /backup-db.sh

# Ver backups disponibles
ls -lah infrastructure/database/backups/
```

### Restore de Base de Datos

#### 1. Restore desde Dump

```bash
# Desde archivo comprimido (.dump)
docker exec -i postgres pg_restore -U admin -d linares_db < backup_20251110_143022.dump

# Desde archivo SQL
docker exec -i postgres psql -U admin -d linares_db < backup_20251110_143022.sql
```

#### 2. Restore Completo del Sistema

```bash
# 1. Detener servicios
docker-compose down

# 2. Remover volúmenes (⚠️ Borrará datos actuales!)
docker volume rm proyectoadminunidad2_postgres_data

# 3. Levantar servicios nuevamente
docker-compose up -d

# 4. Esperar 30 segundos
sleep 30

# 5. Restaurar backup
docker exec -i postgres psql -U admin -d linares_db < backup.sql

# 6. Verificar
docker exec postgres psql -U admin -d linares_db -c "SELECT COUNT(*) FROM usuarios;"
```

### Monitoreo

#### 1. Acceder a Grafana

```
URL: http://localhost:3000
Usuario: admin
Contraseña: admin
```

**Dashboards Disponibles:**
- **00-overview.json** - Vista general del sistema
- **10-postgres.json** - Métricas de base de datos
- **20-redis.json** - Métricas de caché
- **30-containers-cadvisor.json** - Métricas de contenedores
- **40-uptime-blackbox.json** - Disponibilidad de endpoints

#### 2. Acceder a Prometheus

```
URL: http://localhost:9090

# Queries útiles:
up                                    # Estado de servicios
rate(http_request_duration[5m])       # Latencia de requests
http_requests_total                   # Total de requests
postgresql_connections                # Conexiones a BD
docker_container_memory_usage_bytes   # Memoria de contenedores
```

#### 3. Alertas Configuradas

**Alert Rules en:** `infrastructure/monitoring/alert_rules.yml`

| Alerta | Condición | Acción |
|--------|-----------|--------|
| **Servicio Caído** | `up == 0` | Email al admin |
| **BD Llena** | `Disco > 90%` | Notificación crítica |
| **Alta Latencia** | `P99 > 1s` | Investigar carga |
| **Memoria Crítica** | `Memoria > 85%` | Reiniciar si es necesario |
| **Conexiones BD** | `Conexiones > 80` | Limitar conexiones |

#### 4. Comandos de Monitoreo

```bash
# Ver estado de réplica PostgreSQL
docker exec postgres psql -U admin -c "SELECT * FROM pg_stat_replication;"

# Ver conexiones activas
docker exec postgres psql -U admin -d linares_db -c "SELECT * FROM pg_stat_activity;"

# Ver tamaño de índices
docker exec postgres psql -U admin -d linares_db -c "SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_indexes;"

# Ver consultas lentas (si está habilitado)
docker exec postgres psql -U admin -d linares_db -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### 5. Logs del Sistema

```bash
# Ver todos los logs
docker-compose logs

# Ver logs últimas 100 líneas
docker-compose logs -n 100

# Ver logs de hace 5 minutos
docker-compose logs --since 5m

# Seguir logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 6. Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Verificar conectividad a BD
docker exec backend npm test

# Verificar Gemini API
curl -X POST http://localhost:3002/api/ai/test

# Verificar replicación PostgreSQL
docker exec postgres psql -U admin -t -c "SELECT client_addr, state FROM pg_stat_replication;"
```

---

**Última actualización:** 10 de noviembre de 2025
**Versión:** 1.0.0