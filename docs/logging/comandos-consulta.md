# Comandos de Consulta de Logs

Referencia rápida de comandos y queries para consultar logs de seguridad.

## SCRIPT PARA PROBAR LOS LOGS DESDE POWERSHELL

.\scripts\logs\test-security-logs.ps1

## LogQL (Loki Query Language)

### Queries Básicas

```logql
# Todos los logs del backend
{container_name="proyecto-backend"}

# Todos los logs de seguridad (formato JSON)
{container_name="proyecto-backend"} |= "event_type"

# Logs de últimas 6 horas
{container_name="proyecto-backend"} |= "event_type" [6h]
```

{container_name="proyecto-backend"} | json | event_type!=""


### Filtrar por Nivel de Severidad

```logql
# Solo errores
{container_name="proyecto-backend"} | json | level="ERROR"

# Solo warnings y errores
{container_name="proyecto-backend"} | json | level=~"WARNING|ERROR"

# Solo eventos críticos
{container_name="proyecto-backend"} | json | level="CRITICAL"
```

### Filtrar por Tipo de Evento

```logql
# Logins fallidos
{container_name="proyecto-backend"} | json | event_type="auth_failed"

# Logins exitosos
{container_name="proyecto-backend"} | json | event_type="auth_success"

# Todos los intentos de login (exitosos y fallidos)
{container_name="proyecto-backend"} | json | event_type=~"auth_.*"

# Accesos denegados (401 y 403)
{container_name="proyecto-backend"} | json | event_type=~"access_denied_.*"

# Accesos a endpoints sensibles
{container_name="proyecto-backend"} | json | event_type="sensitive_access"

# Cambios de configuración
{container_name="proyecto-backend"} | json | event_type="config_change"

# Errores de base de datos
{container_name="proyecto-backend"} | json | event_type=~"db_.*"
```

### Filtrar por Usuario

```logql
# Eventos de un usuario específico
{container_name="proyecto-backend"} | json | user_id="123"
```


### Filtrar por Endpoint

```logql
# Accesos a /api/users
{container_name="proyecto-backend"} | json | endpoint=~"/api/users.*"

# Accesos a endpoints de reportes
{container_name="proyecto-backend"} | json | endpoint=~"/api/reportes.*"
```


## Comandos Docker

### Ver Logs en Tiempo Real

```bash
# Backend
docker logs proyecto-backend -f

# Loki
docker logs loki -f

# Promtail
docker logs promtail -f

# Ver solo últimas 100 líneas
docker logs proyecto-backend --tail 100

# Ver logs desde hace 10 minutos
docker logs proyecto-backend --since 10m
```

### Filtrar Logs de Docker

```bash
# Solo logs con "error"
docker logs proyecto-backend 2>&1 | grep -i error

# Solo logs JSON (eventos de seguridad)
docker logs proyecto-backend 2>&1 | grep "event_type"

# Contar intentos de login fallidos
docker logs proyecto-backend 2>&1 | grep "auth_failed" | wc -l
```

---

## Comandos del Script de Consulta

### Uso Básico

```bash
# Dar permisos de ejecución
chmod +x scripts/logs/query-security-logs.sh

# Ver últimos 50 eventos
./scripts/logs/query-security-logs.sh --last 50

# Ver últimos 10 eventos
./scripts/logs/query-security-logs.sh --last 10
```

### Filtrar por Tipo de Evento

```bash
# Logins fallidos
./scripts/logs/query-security-logs.sh --type auth_failed

# Logins exitosos
./scripts/logs/query-security-logs.sh --type auth_success

# Accesos denegados (401)
./scripts/logs/query-security-logs.sh --type access_denied_401

# Accesos denegados (403)
./scripts/logs/query-security-logs.sh --type access_denied_403

# Accesos a endpoints sensibles
./scripts/logs/query-security-logs.sh --type sensitive_access

# Cambios de configuración
./scripts/logs/query-security-logs.sh --type config_change

# Errores de base de datos
./scripts/logs/query-security-logs.sh --type db_error

# Queries lentos
./scripts/logs/query-security-logs.sh --type db_slow_query
```

### Filtrar por Usuario

```bash
# Ver eventos de usuario con ID 123
./scripts/logs/query-security-logs.sh --user-id 123

# Ver logins fallidos de usuario específico
./scripts/logs/query-security-logs.sh --type auth_failed --user-id 42
```

### Filtrar por Tiempo

```bash
# Última hora
./scripts/logs/query-security-logs.sh --since 1h

# Últimos 30 minutos
./scripts/logs/query-security-logs.sh --since 30m

# Últimas 2 horas
./scripts/logs/query-security-logs.sh --since 2h

# Último día
./scripts/logs/query-security-logs.sh --since 1d
```

### Combinaciones

```bash
# Logins fallidos de la última hora
./scripts/logs/query-security-logs.sh --type auth_failed --since 1h

# Últimos 20 accesos a endpoints sensibles
./scripts/logs/query-security-logs.sh --type sensitive_access --last 20

# Actividad de usuario 1 en las últimas 6 horas
./scripts/logs/query-security-logs.sh --user-id 1 --since 6h
```