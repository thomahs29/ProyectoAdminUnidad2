# Guía del Dashboard de Logs de Seguridad

Esta guía explica cómo usar Grafana para visualizar y analizar los logs de seguridad del sistema.

## Acceso al Dashboard

### 1. Acceder a Grafana

- **URL**: `https://localhost/grafana` 

### 2. Abrir el Explorador de Logs

1. En el menú lateral izquierdo, click en **Explore** (ícono de brújula)
2. En el dropdown superior, seleccionar datasource **Loki**

## Usando el Explorador de Logs

### Interfaz del Explorador

La interfaz tiene 3 secciones principales:

1. **Query Builder** (arriba): Donde escribes las queries
2. **Gráfico** (medio): Visualización temporal de logs
3. **Tabla de Logs** (abajo): Logs individuales

### Query Builder

#### Opción 1: Builder Visual

1. Click en **Label filters**
2. Seleccionar etiqueta: `container_name`
3. Seleccionar operador: `=`
4. Seleccionar valor: `proyecto-backend`
5. Click en **Run Query**

#### Opción 2: Código LogQL

1. Click en **Code** (esquina superior derecha del builder)
2. Escribir query directamente:
   ```logql
   {container_name="proyecto-backend"} | json
   ```
3. Presionar **Shift + Enter** para ejecutar

---

## Queries Comunes

### Ver Todos los Eventos de Seguridad

```logql
{container_name="proyecto-backend"} | json | event_type!=""
```

Esto muestra todos los logs que tienen un `event_type` (es decir, eventos de seguridad).

### Ver Logins Fallidos

```logql
{container_name="proyecto-backend"} | json | event_type="auth_failed"
```

### Ver Accesos Denegados

```logql
{container_name="proyecto-backend"} | json | event_type=~"access_denied_.*"
```

### Ver Actividad de un Usuario Específico

```logql
{container_name="proyecto-backend"} | json | user_id="123"
```

### Ver Solo Errores

```logql
{container_name="proyecto-backend"} | json | level=~"ERROR|CRITICAL"
```

