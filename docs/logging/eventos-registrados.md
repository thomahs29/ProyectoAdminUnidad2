# Eventos de Seguridad Registrados

Este documento describe todos los eventos de seguridad que el sistema registra automáticamente.

## Formato de Logs

Todos los logs se emiten en formato JSON estructurado:

```json
{
  "timestamp": "2025-11-30T18:49:51.000Z",
  "level": "INFO|WARNING|ERROR|CRITICAL",
  "event_type": "tipo_de_evento",
  "message": "Descripción del evento",
  "user_id": 123,
  "user_rut": "12345678-9",
  "ip_address": "192.168.1.1",
  "endpoint": "/api/users/login",
  "...": "campos adicionales según el evento"
}
```

---

## Tipos de Eventos

### 1. `auth_success` - Autenticación Exitosa

**Cuándo se registra**: Cuando un usuario inicia sesión correctamente.

**Nivel de severidad**: `INFO`

**Campos**:
- `user_id`: ID del usuario autenticado
- `user_rut`: RUT del usuario
- `ip_address`: IP desde donde se autenticó
- `role`: Rol del usuario (ciudadano, funcionario, administrador)

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:30:00.000Z",
  "level": "INFO",
  "event_type": "auth_success",
  "message": "Login exitoso",
  "user_id": 42,
  "user_rut": "12345678-9",
  "ip_address": "192.168.1.100",
  "role": "ciudadano"
}
```

---

### 2. `auth_failed` - Autenticación Fallida

**Cuándo se registra**: Cuando un intento de login falla (usuario no encontrado o contraseña incorrecta).

**Nivel de severidad**: `WARNING`

**Campos**:
- `user_id`: ID del usuario si existe (null si no se encontró)
- `user_rut`: RUT intentado
- `ip_address`: IP del intento
- `reason`: Motivo del fallo ("Usuario no encontrado" o "Contraseña incorrecta")

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:31:00.000Z",
  "level": "WARNING",
  "event_type": "auth_failed",
  "message": "Intento de login fallido",
  "user_id": null,
  "user_rut": "99999999-9",
  "ip_address": "192.168.1.200",
  "reason": "Usuario no encontrado"
}
```

---

### 3. `access_denied_401` - Acceso Denegado por Falta de Autenticación

**Cuándo se registra**: Cuando se intenta acceder a un endpoint protegido sin token JWT.

**Nivel de severidad**: `WARNING`

**Campos**:
- `user_id`: null (no hay usuario autenticado)
- `endpoint`: Endpoint al que se intentó acceder
- `reason`: "No token provided"
- `ip_address`: IP del cliente
- `status_code`: 401

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:32:00.000Z",
  "level": "WARNING",
  "event_type": "access_denied_401",
  "message": "Acceso denegado: No token provided",
  "user_id": null,
  "endpoint": "/api/users",
  "reason": "No token provided",
  "ip_address": "192.168.1.150",
  "status_code": 401
}
```

---

### 4. `access_denied_403` - Acceso Denegado por Permisos Insuficientes

**Cuándo se registra**: Cuando un usuario autenticado intenta acceder a un recurso para el cual no tiene permisos.

**Nivel de severidad**: `WARNING`

**Campos**:
- `user_id`: ID del usuario autenticado
- `endpoint`: Endpoint al que se intentó acceder
- `reason`: "Insufficient permissions"
- `ip_address`: IP del cliente
- `status_code`: 403

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:33:00.000Z",
  "level": "WARNING",
  "event_type": "access_denied_403",
  "message": "Acceso denegado: Insufficient permissions",
  "user_id": 42,
  "endpoint": "/api/users",
  "reason": "Insufficient permissions",
  "ip_address": "192.168.1.100",
  "status_code": 403
}
```

---

### 5. `authorization_error` - Error de Autorización

**Cuándo se registra**: Cuando hay un token inválido, expirado, o sesión no válida en Redis.

**Nivel de severidad**: `ERROR`

**Campos**:
- `user_id`: ID del usuario si se pudo extraer del token (puede ser null)
- `error`: Tipo de error ("Invalid token", "Session expired or invalid")
- `ip_address`: IP del cliente
- `endpoint`: Endpoint al que se intentó acceder

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:34:00.000Z",
  "level": "ERROR",
  "event_type": "authorization_error",
  "message": "Error de autorización: Invalid token",
  "user_id": null,
  "error": "Invalid token",
  "ip_address": "192.168.1.100",
  "endpoint": "/api/reservas"
}
```

---

### 6. `sensitive_access` - Acceso a Endpoint Sensible

**Cuándo se registra**: Cuando un usuario accede a endpoints críticos como gestión de usuarios, reportes, configuración municipal, etc.

**Nivel de severidad**: `INFO`

**Campos**:
- `user_id`: ID del usuario
- `endpoint`: Endpoint accedido
- `method`: Método HTTP (GET, POST, PUT, DELETE)
- `action`: Descripción de la acción
- `ip_address`: IP del cliente

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:35:00.000Z",
  "level": "INFO",
  "event_type": "sensitive_access",
  "message": "Acceso a endpoint sensible: GET /api/reportes",
  "user_id": 1,
  "endpoint": "/api/reportes",
  "method": "GET",
  "action": "Generar reporte",
  "ip_address": "192.168.1.10"
}
```

---

### 7. `config_change` - Cambio en Configuración del Sistema

**Cuándo se registra**: Cuando un administrador crea, modifica o elimina configuraciones del sistema (ej: crear nuevo usuario).

**Nivel de severidad**: `INFO`

**Campos**:
- `user_id`: ID del administrador que hizo el cambio
- `action`: Acción realizada (CREATE, UPDATE, DELETE)
- `resource`: Recurso modificado (usuario, configuración, etc.)
- Campos adicionales según el cambio realizado

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:36:00.000Z",
  "level": "INFO",
  "event_type": "config_change",
  "message": "Cambio de configuración: CREATE usuario",
  "user_id": 1,
  "action": "CREATE",
  "resource": "usuario",
  "new_user_id": 50,
  "new_user_rut": "11111111-1",
  "new_user_role": "funcionario"
}
```

---

### 8. `db_error` - Error de Base de Datos

**Cuándo se registra**: Cuando hay un error de conexión a la base de datos o un error al ejecutar una query.

**Nivel de severidad**: `CRITICAL` (para connection_error) o `ERROR` (para query_error)

**Campos**:
- `error_message`: Mensaje de error
- `error_code`: Código de error de PostgreSQL
- `query`: Query SQL que falló (truncada a 200 caracteres)

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:37:00.000Z",
  "level": "CRITICAL",
  "event_type": "db_error",
  "message": "Error de base de datos: Connection refused",
  "error_message": "connect ECONNREFUSED",
  "error_code": "ECONNREFUSED"
}
```

---

### 9. `db_slow_query` - Query Lento en Base de Datos

**Cuándo se registra**: Cuando una query SQL tarda más de 1 segundo en ejecutarse.

**Nivel de severidad**: `WARNING`

**Campos**:
- `query`: Query SQL (truncada a 200 caracteres)
- `duration`: Duración en milisegundos

**Ejemplo**:
```json
{
  "timestamp": "2025-11-30T15:38:00.000Z",
  "level": "WARNING",
  "event_type": "db_slow_query",
  "message": "Query lento detectado",
  "query": "SELECT * FROM reservas WHERE fecha >= NOW() - INTERVAL '30 days'",
  "duration": 1523
}
```

---

## Cómo Consultar los Logs

### Desde Grafana

1. Acceder a Grafana: `https://localhost/grafana` (usuario: admin, contraseña: admin)
2. Ir a "Explore" en el menú lateral
3. Seleccionar datasource "Loki"
4. Usar queries LogQL 

### Desde CLI

Usar el script incluido:

```bash
# Ver últimos 50 eventos
./scripts/logs/query-security-logs.sh --last 50

# Ver intentos de login fallidos
./scripts/logs/query-security-logs.sh --type auth_failed

# Ver eventos de un usuario específico
./scripts/logs/query-security-logs.sh --user-id 123
```

---

## Retención de Logs

- **Duración**: 7 días (168 horas)
- **Ubicación**: Volume Docker `loki-data`
- **Rotación**: Automática por Loki
