# Cumplimiento Normativo y Legal

## Información del Documento

**Fecha de Creación:** 30 de noviembre de 2025  
**Versión:** 1.0  
**Alcance:** Sistema de Gestión Municipal - ProyectoAdminUnidad2  
**Responsable:** Equipo de Seguridad y Legal

---

## 1. Introducción

### 1.1 Objetivo del Documento

Este documento establece cómo el Sistema de Gestión Municipal cumple con las normativas legales chilenas aplicables en materia de protección de datos personales, ciberseguridad y gobierno digital.

### 1.2 Marco Normativo Aplicable

**Normativas Principales:**

- **Ley N° 19.628 sobre Protección de la Vida Privada** - Protección de datos de carácter personal
- **Ley N° 21.459 Marco sobre Ciberseguridad e Infraestructura Crítica de la Información**
- **Ley N° 21.180 sobre Transformación Digital del Estado**
- **Decreto Supremo N° 83 de 2004** - Norma técnica sobre sistemas de información
- **Instructivo Presidencial N° 8 de 2018** - Políticas de seguridad de la información

### 1.3 Alcance de Cumplimiento

**Sistemas Cubiertos:**
- Frontend web de gestión municipal
- Backend API con datos de ciudadanos
- Base de datos PostgreSQL con información personal
- AI Service con procesamiento de datos
- Infraestructura de monitoreo y logs
- Sistema de backup y recuperación

**Datos Personales Procesados:**
- Número de RUT (identificador nacional)
- Nombres y apellidos de ciudadanos
- Correos electrónicos
- Direcciones de domicilio
- Datos de trámites municipales
- Datos de reservas de espacios públicos
- Información de empleados municipales

---

## 2. Ley N° 19.628 - Protección de Datos Personales

### 2.1 Principios de Tratamiento de Datos

**Artículo 4 - Principio de Finalidad:**

**Cumplimiento en el Sistema:**

El sistema procesa datos personales exclusivamente para las siguientes finalidades legítimas:

**Finalidad 1 - Gestión de Trámites Municipales:**
- Procesamiento de solicitudes de certificados
- Emisión de permisos municipales
- Gestión de pagos de contribuciones
- Atención de reclamos ciudadanos

**Finalidad 2 - Reservas de Espacios Públicos:**
- Administración de reservas de multicanchas
- Gestión de arriendo de quincho municipal
- Coordinación de uso de espacios comunitarios

**Finalidad 3 - Gestión de Usuarios:**
- Autenticación y autorización de usuarios
- Auditoría de accesos al sistema
- Comunicaciones relacionadas con trámites

**Implementación Técnica:**

```javascript
// services/backend/src/models/userModel.js
// Los datos se limitan estrictamente a lo necesario
const userSchema = {
  rut: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true },
  // NO se recopilan datos innecesarios como:
  // - Estado civil, religión, orientación política
  // - Datos de salud o biométricos
  // - Información financiera detallada
};
```

**Artículo 4 - Principio de Proporcionalidad:**

**Cumplimiento:**

El sistema recopila únicamente los datos mínimos necesarios para cada finalidad:

**Para Trámites Municipales:**
- RUT (obligatorio por ley para identificación ciudadana)
- Nombre completo (necesario para documentos oficiales)
- Email (canal de notificación oficial)
- Dirección (solo si es relevante para el trámite específico)

**Para Reservas de Espacios:**
- RUT y nombre (identificación del solicitante)
- Email (confirmación de reserva)
- NO se solicita: número de teléfono, dirección, datos laborales

**Implementación:**

```javascript
// services/backend/src/controllers/reservaController.js
// Validación de datos mínimos
const createReserva = async (req, res) => {
  const { rut, nombre_solicitante, email, espacio, fecha, hora } = req.body;
  
  // Solo se procesan campos estrictamente necesarios
  // Cualquier campo adicional es ignorado
  const reservaData = { rut, nombre_solicitante, email, espacio, fecha, hora };
  
  // NO se almacenan campos innecesarios del request
};
```

**Artículo 9 - Deber de Seguridad:**

**Cumplimiento:**

El sistema implementa medidas técnicas y organizativas para proteger los datos personales contra pérdida, destrucción, alteración o acceso no autorizado.

**Medidas de Seguridad Implementadas:**

**A Nivel de Aplicación:**
- Autenticación mediante JWT con tokens de corta duración (1 hora)
- Contraseñas hasheadas con bcrypt (10 rounds de salt)
- Validación y sanitización de entradas (express-validator)
- Protección contra inyección SQL mediante consultas parametrizadas
- Headers de seguridad (Helmet.js): CSP, HSTS, X-Frame-Options

**A Nivel de Base de Datos:**
- Cifrado en tránsito mediante SSL/TLS para conexiones PostgreSQL
- Separación de privilegios: usuarios con mínimos permisos necesarios
- Auditoría de accesos mediante pg_stat_statements
- Backups automáticos diarios con retención de 30 días
- Replicación maestro-réplica para alta disponibilidad

**A Nivel de Infraestructura:**
- Contenedores ejecutándose con usuarios no privilegiados
- Redes Docker aisladas (database-network, backend-network)
- Firewall de red: solo puertos necesarios expuestos (80, 443)
- Secrets gestionados mediante variables de entorno (no en código)
- Logs almacenados de forma segura con retención controlada

**Verificación de Medidas:**

```bash
# Verificar cifrado de contraseñas en BD
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT rut, nombre, LENGTH(password) as pwd_length FROM usuarios LIMIT 5;"
# Resultado esperado: pwd_length = 60 (bcrypt hash)

# Verificar usuario no privilegiado en contenedores
docker inspect backend --format='{{.Config.User}}'
# Resultado esperado: node (UID 1000)

# Verificar SSL en PostgreSQL
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW ssl;"
# Resultado esperado: on
```

**Artículo 10 - Deber de Información:**

**Cumplimiento:**

El sistema informa a los titulares de datos sobre el tratamiento de su información personal antes de su recopilación.

**Implementación en Frontend:**

```jsx
// services/frontend/src/pages/Register.jsx
// Aviso de privacidad visible antes del registro
<div className="privacy-notice">
  <h3>Protección de Datos Personales</h3>
  <p>
    Sus datos personales serán utilizados exclusivamente para:
    - Gestión de trámites municipales
    - Reservas de espacios públicos
    - Comunicaciones relacionadas con sus solicitudes
  </p>
  <p>
    Responsable: Municipalidad [Nombre]
    Base Legal: Ley N° 19.628
    Derechos: Acceso, rectificación, cancelación
    Contacto: privacidad@municipalidad.cl
  </p>
  <label>
    <input type="checkbox" required />
    He leído y acepto el tratamiento de mis datos personales
  </label>
</div>
```

**Información Proporcionada:**
- Identidad del responsable del tratamiento (Municipalidad)
- Finalidades del tratamiento (trámites, reservas)
- Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Contacto para ejercer derechos

### 2.2 Derechos de los Titulares (Derechos ARCO)

**Artículo 12 - Derecho de Acceso:**

**Implementación:**

Los ciudadanos pueden solicitar conocer qué datos personales se almacenan sobre ellos.

**Endpoint Implementado:**

```javascript
// services/backend/src/routes/userRoutes.js
router.get('/api/users/my-data', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  // Recopilar todos los datos del usuario
  const userData = await pool.query(
    'SELECT rut, nombre, apellido, email, rol, created_at FROM usuarios WHERE id = $1',
    [userId]
  );
  
  const tramites = await pool.query(
    'SELECT tipo_tramite, estado, fecha_solicitud FROM tramites WHERE usuario_id = $1',
    [userId]
  );
  
  const reservas = await pool.query(
    'SELECT espacio, fecha, hora, estado FROM reservas WHERE usuario_id = $1',
    [userId]
  );
  
  res.json({
    usuario: userData.rows[0],
    tramites: tramites.rows,
    reservas: reservas.rows
  });
});
```

**Proceso:**
1. Usuario autenticado solicita sus datos mediante la aplicación
2. Sistema recopila todos los datos asociados al RUT del usuario
3. Datos son entregados en formato JSON legible
4. Solicitud y entrega son registradas en logs de auditoría

**Artículo 12 - Derecho de Rectificación:**

**Implementación:**

Los ciudadanos pueden solicitar la corrección de datos inexactos o incompletos.

**Endpoint Implementado:**

```javascript
// services/backend/src/routes/userRoutes.js
router.put('/api/users/update-profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { nombre, apellido, email } = req.body;
  
  // Solo se permiten actualizar datos no críticos
  // RUT NO es modificable (es identificador único nacional)
  
  await pool.query(
    'UPDATE usuarios SET nombre = $1, apellido = $2, email = $3, updated_at = NOW() WHERE id = $4',
    [nombre, apellido, email, userId]
  );
  
  // Registrar modificación en logs de auditoría
  await logAuditEvent('USER_DATA_UPDATED', userId, { fields: ['nombre', 'apellido', 'email'] });
  
  res.json({ message: 'Datos actualizados correctamente' });
});
```

**Limitaciones:**
- RUT no es modificable (es el identificador único legal)
- Cambios requieren autenticación del titular
- Modificaciones son registradas para auditoría

**Artículo 12 - Derecho de Cancelación:**

**Implementación:**

Los ciudadanos pueden solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad que motivó su recopilación.

**Consideraciones Legales:**

**Datos que NO pueden eliminarse:**
- Datos de trámites finalizados (deben conservarse por obligación legal: 5 años según normativa de transparencia)
- Datos fiscales y de pagos (obligación tributaria)
- Datos de auditoría de seguridad (evidencia forense)

**Datos que SÍ pueden eliminarse:**
- Cuenta de usuario sin trámites activos ni historial legal
- Datos de reservas canceladas sin obligación de retención
- Datos personales no vinculados a obligaciones legales

**Endpoint Implementado:**

```javascript
// services/backend/src/routes/userRoutes.js
router.delete('/api/users/delete-account', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  // Verificar si existen obligaciones legales de retención
  const activeTramites = await pool.query(
    'SELECT COUNT(*) FROM tramites WHERE usuario_id = $1 AND estado != $2',
    [userId, 'finalizado']
  );
  
  if (activeTramites.rows[0].count > 0) {
    return res.status(400).json({ 
      error: 'No se puede eliminar cuenta con trámites activos' 
    });
  }
  
  // Anonimizar datos en lugar de eliminar completamente
  // (para preservar integridad referencial de trámites históricos)
  await pool.query(
    `UPDATE usuarios 
     SET nombre = 'USUARIO ELIMINADO',
         apellido = 'USUARIO ELIMINADO',
         email = 'deleted_${userId}@deleted.local',
         password = NULL,
         deleted_at = NOW()
     WHERE id = $1`,
    [userId]
  );
  
  // Registrar eliminación en logs de auditoría
  await logAuditEvent('USER_ACCOUNT_DELETED', userId, { method: 'anonymization' });
  
  res.json({ message: 'Cuenta eliminada correctamente' });
});
```

**Proceso de Anonimización:**
- Datos personales son reemplazados por valores genéricos
- RUT es hasheado irreversiblemente
- Relaciones con trámites históricos se mantienen para cumplimiento legal
- Eliminación es registrada en logs de auditoría

### 2.3 Transferencia de Datos

**Artículo 18 - Comunicación de Datos:**

**Cumplimiento:**

El sistema NO transfiere datos personales a terceros, excepto en casos permitidos por ley.

**Transferencias Permitidas:**

**A Organismos Públicos (Artículo 20):**
- Contraloría General de la República (auditorías)
- Poder Judicial (órdenes judiciales)
- Ministerio Público (investigaciones penales)
- Servicio de Impuestos Internos (fiscalización tributaria)

**Proceso de Transferencia:**

```javascript
// services/backend/src/controllers/dataTransferController.js
// Transferencia solo mediante solicitud formal documentada
const transferToPublicEntity = async (req, res) => {
  const { entity, legalBasis, requestDocument, dataRequested } = req.body;
  
  // Validar base legal
  if (!['audit', 'judicial_order', 'investigation'].includes(legalBasis)) {
    return res.status(403).json({ error: 'Base legal insuficiente' });
  }
  
  // Registrar solicitud en logs de auditoría
  await logAuditEvent('DATA_TRANSFER_REQUEST', req.user.id, {
    entity,
    legalBasis,
    documentNumber: requestDocument,
    timestamp: new Date()
  });
  
  // Requiere aprobación de autoridad municipal
  // (implementación específica según flujo de aprobación)
};
```

**NO se transfiere datos a:**
- Empresas privadas con fines comerciales
- Servicios de marketing o publicidad
- Analítica de terceros (Google Analytics, etc.)
- Servicios cloud fuera de Chile (datos permanecen localmente)

### 2.4 Registro de Tratamiento de Datos

**Cumplimiento:**

Aunque no es obligatorio por Ley 19.628, se mantiene un registro de actividades de tratamiento como buena práctica.

**Registro Implementado:**

**Actividad 1 - Gestión de Usuarios:**
- Responsable: Municipalidad [Nombre]
- Finalidad: Autenticación y autorización
- Categorías de datos: RUT, nombre, apellido, email, contraseña (hasheada)
- Categorías de interesados: Ciudadanos y empleados municipales
- Destinatarios: Solo personal autorizado de la municipalidad
- Plazo de conservación: 5 años tras última actividad
- Medidas de seguridad: Cifrado, control de acceso, auditoría

**Actividad 2 - Gestión de Trámites:**
- Responsable: Municipalidad [Nombre]
- Finalidad: Procesamiento de solicitudes municipales
- Categorías de datos: RUT, nombre, tipo de trámite, documentos adjuntos
- Categorías de interesados: Ciudadanos solicitantes
- Destinatarios: Funcionarios municipales autorizados
- Plazo de conservación: 5 años (obligación legal de transparencia)
- Medidas de seguridad: Cifrado de documentos, trazabilidad completa

**Actividad 3 - Gestión de Reservas:**
- Responsable: Municipalidad [Nombre]
- Finalidad: Administración de espacios públicos
- Categorías de datos: RUT, nombre, email, fecha/hora de reserva
- Categorías de interesados: Ciudadanos usuarios de espacios públicos
- Destinatarios: Personal de administración de espacios municipales
- Plazo de conservación: 1 año tras finalización de reserva
- Medidas de seguridad: Acceso restringido, logs de auditoría

---

## 3. Ley N° 21.459 - Marco de Ciberseguridad

### 3.1 Ámbito de Aplicación

**Artículo 1 - Objetivo de la Ley:**

Esta ley establece un marco para la gestión de ciberseguridad en organismos del Estado, incluyendo municipalidades.

**Aplicabilidad al Sistema:**

Aunque el sistema no es clasificado como "infraestructura crítica de la información" según el artículo 7, cumple voluntariamente con los estándares de la ley como buena práctica de seguridad.

### 3.2 Gestión de Ciberseguridad (Artículo 5)

**Obligaciones Establecidas:**

Los organismos del Estado deben implementar medidas de ciberseguridad apropiadas al nivel de riesgo de sus sistemas.

**Cumplimiento Implementado:**

**Medida 1 - Política de Seguridad de la Información:**

Documento establecido: `docs/politica-seguridad.md`

Contiene:
- Política de contraseñas diferenciadas por tipo de usuario
- Política de actualizaciones de software
- Política de control de acceso con mínimo privilegio
- Política de gestión de logs y auditoría
- Responsables y procedimientos de cumplimiento

**Medida 2 - Gestión de Riesgos:**

Documento establecido: `docs/matriz-riesgos.md`

Incluye:
- Identificación de 10 riesgos principales (OWASP Top 10)
- Evaluación de probabilidad e impacto
- Clasificación de nivel de riesgo (Alto, Medio, Bajo)
- Medidas de mitigación específicas para cada riesgo
- Responsables de implementación

**Medida 3 - Plan de Respuesta a Incidentes:**

Documento establecido: `docs/plan-incidentes.md`

Define:
- Procedimientos de detección de incidentes
- Protocolos de contención inmediata
- Procesos de análisis y erradicación
- Procedimientos de recuperación del sistema
- Documentación de lecciones aprendidas

**Medida 4 - Hardening de Sistemas:**

Documentos establecidos: `docs/hardening-database.md`, `docs/hardening-contenedores.md`

Implementan:
- Separación de responsabilidades con usuarios de mínimo privilegio
- Cifrado de datos en tránsito (SSL/TLS)
- Auditoría de eventos críticos
- Control de versiones y actualizaciones
- Principio de menor privilegio en contenedores

### 3.3 Notificación de Incidentes (Artículo 11)

**Obligación Legal:**

Los organismos del Estado deben notificar incidentes de ciberseguridad significativos a la Agencia Nacional de Ciberseguridad (ANCI).

**Criterios de Notificación:**

**Incidentes que DEBEN notificarse:**
- Compromiso de datos personales de 1000 o más ciudadanos
- Interrupción de servicios críticos por más de 4 horas
- Acceso no autorizado a sistemas clasificados
- Exfiltración confirmada de datos sensibles
- Ataques que afecten la integridad de procesos municipales

**Incidentes que NO requieren notificación:**
- Intentos fallidos de acceso sin compromiso
- Vulnerabilidades detectadas sin evidencia de explotación
- Interrupciones menores por mantenimiento
- Incidentes de severidad baja sin impacto en datos o servicios

**Proceso de Notificación:**

```
1. Detección del incidente (según plan-incidentes.md)
2. Evaluación de severidad por equipo de seguridad
3. Si cumple criterios: Notificación a ANCI dentro de 24 horas
4. Formato: Formulario oficial ANCI con:
   - Tipo de incidente
   - Fecha y hora de detección
   - Sistemas afectados
   - Datos comprometidos (si aplica)
   - Medidas de contención tomadas
   - Estimación de impacto
5. Seguimiento con informes de actualización cada 72 horas hasta resolución
```

**Contacto ANCI:**
- Email: incidentes@anci.gob.cl
- Teléfono: +56 2 XXXX XXXX
- Plataforma web: https://www.anci.gob.cl/notificaciones

### 3.4 Auditoría y Supervisión (Artículo 13)

**Obligación:**

Los organismos del Estado deben permitir auditorías de ciberseguridad por parte de la ANCI.

**Cumplimiento:**

**Preparación para Auditoría:**

El sistema mantiene documentación completa de:
- Políticas de seguridad implementadas (politica-seguridad.md)
- Matriz de riesgos actualizada (matriz-riesgos.md)
- Registros de incidentes (si ocurrieron)
- Logs de auditoría de accesos y cambios
- Evidencia de cumplimiento de medidas de hardening

**Logs de Auditoría Disponibles:**

```bash
# Logs de autenticación (últimos 90 días)
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM audit_log WHERE event_type = 'USER_LOGIN' ORDER BY timestamp DESC LIMIT 100;"

# Logs de modificaciones de datos sensibles
docker exec postgres-master psql -U admin -d municipalidad_db -c "SELECT * FROM audit_log WHERE event_type IN ('USER_DATA_UPDATED', 'USER_ACCOUNT_DELETED') ORDER BY timestamp DESC;"

# Logs de accesos a datos personales
docker exec backend node -e "const fs = require('fs'); console.log(fs.readFileSync('/var/log/data_access.log', 'utf8'));"
```

**Retención de Logs:**
- Logs de autenticación: 90 días
- Logs de acceso a datos personales: 1 año
- Logs de incidentes de seguridad: 5 años
- Logs de cambios en configuración: 2 años

---

## 4. Ley N° 21.180 - Transformación Digital del Estado

### 4.1 Interoperabilidad (Artículo 5)

**Obligación:**

Los sistemas del Estado deben diseñarse para permitir la interoperabilidad con otros sistemas públicos.

**Cumplimiento:**

**Arquitectura de API RESTful:**

El sistema expone APIs REST estándar que facilitan la integración con otros sistemas municipales o gubernamentales.

**Endpoints de Interoperabilidad:**

```javascript
// services/backend/src/routes/municipalesRoutes.js
// API pública para consulta de datos municipales (sin datos personales)

// GET /api/municipales/tramites/tipos
// Retorna catálogo de tipos de trámites disponibles
// Formato JSON estándar

// GET /api/municipales/espacios/disponibilidad
// Retorna disponibilidad de espacios públicos
// Formato JSON estándar

// POST /api/municipales/notificaciones/webhook
// Recibe notificaciones desde otros sistemas del Estado
// Formato JSON estándar con autenticación API Key
```

**Estándares Implementados:**
- Protocolo HTTP/HTTPS estándar
- Formato JSON para intercambio de datos
- Autenticación mediante JWT (estándar RFC 7519)
- Documentación de API disponible (OpenAPI/Swagger)
- Versionado de API (v1, v2) para retrocompatibilidad

**Ejemplo de Respuesta Estándar:**

```json
{
  "version": "1.0",
  "timestamp": "2025-11-30T10:30:00Z",
  "data": {
    "tipos_tramites": [
      {
        "id": 1,
        "codigo": "CERT-NAC",
        "nombre": "Certificado de Nacimiento",
        "plazo_dias": 5,
        "costo": 0
      },
      {
        "id": 2,
        "codigo": "PERM-CONST",
        "nombre": "Permiso de Construcción",
        "plazo_dias": 30,
        "costo": 15000
      }
    ]
  },
  "metadata": {
    "total": 2,
    "page": 1,
    "per_page": 20
  }
}
```

### 4.2 Seguridad Digital (Artículo 6)

**Obligación:**

Los órganos del Estado deben garantizar la seguridad de sus plataformas digitales.

**Cumplimiento:**

**Medidas de Seguridad Implementadas:**

**Autenticación Fuerte:**
- Contraseñas con requisitos de complejidad (mínimo 8 caracteres, mayúsculas, minúsculas, números)
- Tokens JWT con expiración de 1 hora
- Rotación obligatoria de contraseñas cada 90 días para administradores
- Bloqueo de cuenta tras 5 intentos fallidos

**Cifrado:**
- HTTPS obligatorio para todas las comunicaciones (TLS 1.3)
- Cifrado de contraseñas con bcrypt (10 rounds)
- SSL/TLS para conexiones a PostgreSQL
- Variables sensibles en variables de entorno (no en código)

**Control de Acceso:**
- Roles diferenciados: administrador, funcionario, ciudadano
- Principio de mínimo privilegio en base de datos
- Autorización basada en JWT con claims de rol
- Aislamiento de redes Docker (database-network, backend-network)

**Monitoreo:**
- Grafana dashboards para métricas en tiempo real
- Prometheus para alertas de anomalías
- Logs centralizados de accesos y errores
- Auditoría de queries de base de datos

**Verificación de Cumplimiento:**

```bash
# Verificar HTTPS configurado en nginx
docker exec proyecto-gateway cat /etc/nginx/nginx.conf | grep ssl

# Verificar TLS en PostgreSQL
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW ssl;"

# Verificar roles y permisos
docker exec postgres-master psql -U admin -d municipalidad_db -c "\du"
```

### 4.3 Datos Abiertos (Artículo 8)

**Obligación:**

Los órganos del Estado deben poner a disposición del público los datos que no tengan carácter de reservados o secretos.

**Cumplimiento:**

**Datos Públicos Disponibles (sin datos personales):**

**Endpoint de Datos Abiertos:**

```javascript
// services/backend/src/routes/openDataRoutes.js
// API pública sin autenticación para datos estadísticos

// GET /api/open-data/tramites/estadisticas
// Estadísticas agregadas de trámites (sin identificar personas)
router.get('/tramites/estadisticas', async (req, res) => {
  const stats = await pool.query(`
    SELECT 
      tipo_tramite,
      COUNT(*) as total,
      AVG(EXTRACT(EPOCH FROM (fecha_resolucion - fecha_solicitud))/86400) as dias_promedio
    FROM tramites
    WHERE estado = 'finalizado'
    GROUP BY tipo_tramite
  `);
  
  res.json({
    data: stats.rows,
    metadata: {
      descripcion: 'Estadísticas de trámites municipales',
      actualizacion: 'Diaria',
      licencia: 'CC BY 4.0'
    }
  });
});

// GET /api/open-data/espacios/uso
// Estadísticas de uso de espacios públicos (sin identificar usuarios)
router.get('/espacios/uso', async (req, res) => {
  const stats = await pool.query(`
    SELECT 
      espacio,
      DATE_TRUNC('month', fecha) as mes,
      COUNT(*) as total_reservas
    FROM reservas
    WHERE estado = 'confirmada'
    GROUP BY espacio, mes
    ORDER BY mes DESC
  `);
  
  res.json({
    data: stats.rows,
    metadata: {
      descripcion: 'Uso de espacios públicos municipales',
      actualizacion: 'Mensual',
      licencia: 'CC BY 4.0'
    }
  });
});
```

**Datos que NO se publican (protegidos por Ley 19.628):**
- RUT de ciudadanos
- Nombres y datos personales de solicitantes
- Contenido específico de trámites individuales
- Direcciones de domicilio
- Correos electrónicos

**Formato de Datos Abiertos:**
- JSON (legible por máquinas y humanos)
- CSV para descarga masiva (implementable)
- Licencia Creative Commons BY 4.0
- Actualización automática diaria/mensual

### 4.4 Accesibilidad Digital (Artículo 9)

**Obligación:**

Las plataformas digitales del Estado deben ser accesibles para personas con discapacidad.

**Cumplimiento Parcial:**

**Medidas Implementadas:**

**Accesibilidad en Frontend:**

```jsx
// services/frontend/src/pages/Login.jsx
// Etiquetas semánticas y ARIA labels para lectores de pantalla

<form role="form" aria-labelledby="login-title">
  <h1 id="login-title">Iniciar Sesión</h1>
  
  <label htmlFor="email">Correo Electrónico</label>
  <input 
    id="email"
    type="email"
    aria-required="true"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert"></span>
  
  <label htmlFor="password">Contraseña</label>
  <input 
    id="password"
    type="password"
    aria-required="true"
    aria-describedby="password-error"
  />
  <span id="password-error" role="alert"></span>
  
  <button type="submit" aria-label="Enviar formulario de inicio de sesión">
    Ingresar
  </button>
</form>
```

**Estándares Aplicados:**
- HTML semántico (header, nav, main, footer, section)
- ARIA labels para elementos interactivos
- Contraste de colores adecuado (WCAG AA)
- Navegación por teclado funcional (tab, enter, esc)
- Mensajes de error accesibles (role="alert")

**Pendientes de Implementación:**
- Versión de alto contraste del sitio
- Ajuste de tamaño de fuente (zoom nativo del navegador)
- Compatibilidad total con lectores de pantalla (NVDA, JAWS)
- Certificación WCAG 2.1 nivel AA (auditoría externa pendiente)

---

## 5. Decreto Supremo N° 83 - Norma Técnica de Seguridad

### 5.1 Clasificación de la Información

**Artículo 3 - Niveles de Clasificación:**

**Cumplimiento:**

La información procesada por el sistema se clasifica en:

**Nivel 1 - Pública:**
- Catálogos de trámites municipales
- Horarios de atención
- Ubicación de espacios públicos
- Estadísticas agregadas sin datos personales
- Normativas y reglamentos municipales

**Ubicación:** Frontend público, API de datos abiertos  
**Medidas:** Ninguna restricción de acceso

**Nivel 2 - Interna:**
- Datos de configuración del sistema (no sensibles)
- Logs de aplicación (sin datos personales)
- Métricas de rendimiento
- Documentación técnica interna

**Ubicación:** Repositorio Git privado, logs de monitoreo  
**Medidas:** Acceso restringido al equipo de desarrollo/DevOps

**Nivel 3 - Confidencial:**
- Datos personales de ciudadanos (RUT, nombre, email)
- Contenido de trámites individuales
- Información de reservas con datos del solicitante
- Credenciales de usuarios (hasheadas)

**Ubicación:** Base de datos PostgreSQL  
**Medidas:** Cifrado en tránsito, control de acceso estricto, auditoría

**Nivel 4 - Secreto:**
- Credenciales administrativas (DB_ROOT_PASSWORD, JWT_SECRET)
- Claves de cifrado
- Tokens de APIs externas (GEMINI_API_KEY)
- Configuraciones de seguridad críticas

**Ubicación:** Variables de entorno, secrets management  
**Medidas:** Nunca en código fuente, acceso solo personal autorizado, rotación periódica

### 5.2 Control de Acceso

**Artículo 5 - Acceso Basado en Necesidad de Conocer:**

**Cumplimiento:**

**Matriz de Acceso por Rol:**

**Rol: Ciudadano (usuario final)**
- Acceso a: Sus propios datos, sus trámites, sus reservas
- NO acceso a: Datos de otros ciudadanos, configuración del sistema, logs
- Implementación: JWT con claim `role: 'ciudadano'`, queries filtradas por `usuario_id`

**Rol: Funcionario Municipal**
- Acceso a: Trámites asignados, reservas del día, datos de ciudadanos relacionados con sus funciones
- NO acceso a: Datos de todos los ciudadanos, configuración del sistema, credenciales
- Implementación: JWT con claim `role: 'funcionario'`, queries filtradas por departamento/función

**Rol: Administrador Municipal**
- Acceso a: Todos los datos de trámites, usuarios, reservas, estadísticas completas
- NO acceso a: Credenciales de base de datos, secrets de infraestructura
- Implementación: JWT con claim `role: 'admin'`, acceso completo a API backend

**Rol: DevOps/DBA**
- Acceso a: Infraestructura, base de datos, logs, configuraciones, backups
- NO acceso a: Contenido de trámites individuales (solo en caso de incidente con autorización)
- Implementación: Acceso SSH/Docker limitado, conexiones a BD auditadas

**Implementación en Código:**

```javascript
// services/backend/src/middleware/authMiddleware.js
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.rol; // Extraído del JWT
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acceso denegado: privilegios insuficientes' 
      });
    }
    
    next();
  };
};

// Ejemplo de uso en rutas
router.get('/api/users/all', authMiddleware, requireRole(['admin']), getAllUsers);
router.get('/api/tramites/assigned', authMiddleware, requireRole(['funcionario', 'admin']), getAssignedTramites);
```

### 5.3 Gestión de Respaldos

**Artículo 7 - Copias de Seguridad:**

**Cumplimiento:**

**Política de Backups Implementada:**

**Backup de Base de Datos:**
- Frecuencia: Diario (automático a las 02:00 AM)
- Retención: 30 días
- Ubicación: Volumen Docker local (producción: storage externo)
- Tipo: Full backup de PostgreSQL (pg_dump)

**Script de Backup:**

```bash
#!/bin/bash
# scripts/backup/backup-db.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# Backup de base de datos
docker exec postgres-master pg_dump -U admin -d municipalidad_db -F c -f /tmp/${BACKUP_FILE}
docker cp postgres-master:/tmp/${BACKUP_FILE} ${BACKUP_DIR}/${BACKUP_FILE}

# Comprimir backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Eliminar backups antiguos (>30 días)
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completado: ${BACKUP_FILE}.gz"
```

**Automatización con Cron:**

```bash
# Crontab del servicio de backup
0 2 * * * /app/scripts/backup/backup-db.sh >> /var/log/backup.log 2>&1
```

**Backup de Archivos:**
- Documentos adjuntos a trámites: Backup semanal
- Configuraciones del sistema: Backup después de cada cambio (Git)
- Logs de auditoría: Backup mensual con retención de 5 años

**Pruebas de Restauración:**
- Frecuencia: Mensual
- Procedimiento: Restaurar backup en entorno de prueba
- Validación: Verificar integridad de datos y funcionalidad del sistema
- Documentación: Registrar resultado en log de pruebas

### 5.4 Gestión de Incidentes

**Artículo 8 - Reporte de Incidentes:**

**Cumplimiento:**

Documento establecido: `docs/plan-incidentes.md`

**Procedimiento de Reporte:**

1. **Detección:** Monitoreo continuo con Prometheus/Grafana
2. **Clasificación:** Severidad (Crítica, Alta, Media, Baja)
3. **Notificación:** Equipo de seguridad notificado según severidad
4. **Documentación:** Registro en formulario estándar
5. **Escalamiento:** A ANCI si cumple criterios (Ley 21.459)

**Registro de Incidentes:**

```javascript
// services/backend/src/models/incidentModel.js
const incidentSchema = {
  incident_id: String,          // INC-20251130-001
  detection_date: Date,         // Fecha/hora de detección
  reported_by: String,          // Usuario que reporta
  severity: String,             // Crítica, Alta, Media, Baja
  incident_type: String,        // Tipo de incidente
  affected_systems: Array,      // Sistemas afectados
  description: String,          // Descripción detallada
  actions_taken: Array,         // Acciones tomadas
  status: String,               // Activo, Contenido, Resuelto
  resolution_date: Date,        // Fecha de resolución
  lessons_learned: String       // Lecciones aprendidas
};
```

---

## 6. Instructivo Presidencial N° 8 - Políticas de Seguridad

### 6.1 Gestión de Usuarios y Contraseñas

**Cumplimiento:**

**Política de Contraseñas Implementada:**

Documento: `docs/politica-seguridad.md` - Sección 2

**Requisitos por Tipo de Usuario:**

**Usuarios Finales (Ciudadanos):**
- Longitud mínima: 8 caracteres
- Complejidad: Al menos 1 mayúscula, 1 minúscula, 1 número
- Rotación: No obligatoria (pueden cambiar voluntariamente)
- Recuperación: Mediante email verificado

**Usuarios Administradores:**
- Longitud mínima: 12 caracteres
- Complejidad: Mayúsculas, minúsculas, números y símbolos especiales
- Rotación: Obligatoria cada 90 días
- Recuperación: Proceso manual con verificación de identidad

**Usuarios de Servicios (Backend, AI Service):**
- Generación: Aleatoria con `openssl rand -base64 32`
- Almacenamiento: Variables de entorno (nunca en código)
- Rotación: Cada cambio de versión o sospecha de compromiso

**Implementación de Validación:**

```javascript
// services/backend/src/middleware/passwordValidator.js
const validatePassword = (password, userRole) => {
  const minLength = userRole === 'admin' ? 12 : 8;
  
  if (password.length < minLength) {
    throw new Error(`Contraseña debe tener al menos ${minLength} caracteres`);
  }
  
  if (!/[A-Z]/.test(password)) {
    throw new Error('Contraseña debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    throw new Error('Contraseña debe contener al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    throw new Error('Contraseña debe contener al menos un número');
  }
  
  if (userRole === 'admin' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new Error('Contraseña de administrador debe contener símbolos especiales');
  }
  
  return true;
};
```

### 6.2 Actualizaciones de Seguridad

**Cumplimiento:**

**Política de Actualizaciones:**

Documento: `docs/politica-seguridad.md` - Sección 3

**Frecuencia de Actualizaciones:**

**Dependencias npm (Backend, AI Service, Frontend):**
- Revisión: Semanal con `npm audit`
- Aplicación: Inmediata para vulnerabilidades críticas/altas
- Responsable: Equipo de Desarrollo
- Herramienta: `npm audit fix`, Dependabot

**Imágenes Docker Base:**
- Revisión: Mensual
- Aplicación: Actualización a versiones LTS más recientes
- Responsable: DevOps
- Herramienta: Docker Scout, renovate

**PostgreSQL:**
- Revisión: Trimestral
- Aplicación: Minor updates cada trimestre, major updates planificados
- Responsable: DBA
- Proceso: Actualización en réplica, pruebas, promoción

**Alpine Linux (base de contenedores):**
- Revisión: Mensual
- Aplicación: Actualización a última versión de Alpine 3.x
- Responsable: DevOps
- Proceso: Rebuild de imágenes con `--no-cache`

**Nginx:**
- Revisión: Trimestral
- Aplicación: Actualización a última stable
- Responsable: DevOps
- Proceso: Actualización en entorno de prueba, luego producción

**Verificación de Actualizaciones:**

```bash
# Verificar versiones actuales
docker exec backend npm list --depth=0
docker exec postgres-master psql -U admin -c "SELECT version();"
docker exec proyecto-gateway nginx -v

# Escanear vulnerabilidades
npm audit --audit-level=moderate
docker scout cves proyecto-backend
docker scout cves proyecto-frontend
```

### 6.3 Registro de Eventos (Logging)

**Cumplimiento:**

**Política de Logs:**

Documento: `docs/politica-seguridad.md` - Sección 5

**Eventos Registrados:**

**Logs de Autenticación:**
- Login exitoso: Usuario, IP, timestamp
- Login fallido: Usuario, IP, timestamp, razón
- Logout: Usuario, timestamp, duración de sesión
- Retención: 90 días

**Logs de Acceso a Datos:**
- Consulta de datos personales: Usuario, datos accedidos, timestamp
- Modificación de datos: Usuario, datos modificados (antes/después), timestamp
- Eliminación de datos: Usuario, datos eliminados, timestamp, justificación
- Retención: 1 año

**Logs de Cambios en Configuración:**
- Cambios en usuarios de BD: DBA, cambio realizado, timestamp
- Cambios en configuración de aplicación: DevOps, parámetro modificado, timestamp
- Cambios en reglas de firewall/nginx: DevOps, regla modificada, timestamp
- Retención: 2 años

**Logs de Errores:**
- Errores de aplicación: Tipo, stack trace, usuario afectado, timestamp
- Errores de base de datos: Query fallida, error, timestamp
- Errores de infraestructura: Servicio, error, timestamp
- Retención: 30 días

**Logs de Seguridad:**
- Intentos de acceso no autorizado: IP, recurso, timestamp
- Detección de patrones maliciosos: Tipo de ataque, IP, timestamp
- Incidentes de seguridad: Según plan-incidentes.md
- Retención: 5 años

**Implementación:**

```javascript
// services/backend/src/services/auditLogger.js
const logAuditEvent = async (eventType, userId, details) => {
  await pool.query(`
    INSERT INTO audit_log (event_type, user_id, ip_address, details, timestamp)
    VALUES ($1, $2, $3, $4, NOW())
  `, [eventType, userId, details.ip, JSON.stringify(details)]);
  
  // También log a archivo para backup
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    user: userId,
    details: details
  };
  
  fs.appendFileSync('/var/log/audit.log', JSON.stringify(logEntry) + '\n');
};

// Ejemplo de uso
await logAuditEvent('USER_DATA_ACCESS', req.user.id, {
  ip: req.ip,
  resource: 'tramites',
  action: 'view',
  tramite_id: tramiteId
});
```

---

## 7. Brechas de Cumplimiento y Plan de Mejora

### 7.1 Brechas Identificadas

**Brecha 1 - Certificación de Accesibilidad:**

**Normativa:** Ley 21.180 Artículo 9  
**Estado Actual:** Implementación parcial de WCAG 2.1  
**Brecha:** Falta certificación oficial de accesibilidad nivel AA

**Plan de Mitigación:**
- Acción: Contratar auditoría de accesibilidad externa
- Responsable: Jefe de Proyecto
- Plazo: 6 meses
- Costo estimado: $500.000 - $1.000.000

**Brecha 2 - Autenticación Multifactor (MFA):**

**Normativa:** Instructivo Presidencial 8 (recomendación)  
**Estado Actual:** Solo autenticación por contraseña  
**Brecha:** Falta implementación de segundo factor de autenticación

**Plan de Mitigación:**
- Acción: Implementar MFA con TOTP (Google Authenticator, Authy)
- Responsable: Equipo de Desarrollo
- Plazo: 3 meses
- Prioridad: Alta (para administradores), Media (para usuarios finales)

**Brecha 3 - Cifrado en Reposo:**

**Normativa:** Ley 19.628 Artículo 9 (deber de seguridad)  
**Estado Actual:** Datos cifrados solo en tránsito, no en reposo  
**Brecha:** Base de datos PostgreSQL sin cifrado de disco

**Plan de Mitigación:**
- Acción: Implementar cifrado de volúmenes Docker con LUKS/dm-crypt
- Responsable: DevOps
- Plazo: 4 meses
- Complejidad: Alta

**Brecha 4 - Disaster Recovery Plan:**

**Normativa:** Decreto 83 Artículo 7  
**Estado Actual:** Backups implementados, falta plan de DR completo  
**Brecha:** Falta documentación de procedimientos de recuperación ante desastres

**Plan de Mitigación:**
- Acción: Documentar y probar plan de recuperación completo
- Responsable: DevOps + DBA
- Plazo: 2 meses
- Incluye: RTO (Recovery Time Objective), RPO (Recovery Point Objective)

### 7.2 Mejoras Planificadas

**Mejora 1 - Automatización de Cumplimiento:**

Implementar pipeline de CI/CD que valide automáticamente:
- Escaneo de vulnerabilidades en cada commit (npm audit, docker scout)
- Validación de políticas de seguridad (linters, pre-commit hooks)
- Tests de accesibilidad automatizados (axe-core, pa11y)
- Verificación de configuraciones de hardening

**Plazo:** 3 meses  
**Responsable:** DevOps

**Mejora 2 - Portal de Transparencia:**

Crear sección pública con:
- Políticas de privacidad y tratamiento de datos
- Procedimiento para ejercer derechos ARCO
- Contacto de delegado de protección de datos
- Estadísticas de trámites (datos abiertos)

**Plazo:** 2 meses  
**Responsable:** Desarrollo + Legal

**Mejora 3 - Capacitación del Personal:**

Programa de capacitación en:
- Protección de datos personales (Ley 19.628)
- Ciberseguridad (Ley 21.459)
- Respuesta a incidentes
- Derechos de los ciudadanos

**Frecuencia:** Anual  
**Responsable:** RRHH + Seguridad

---

## 8. Auditoría de Cumplimiento

### 8.1 Checklist de Cumplimiento

**Ley 19.628 - Protección de Datos:**
- [X] Datos procesados solo para finalidades legítimas
- [X] Principio de proporcionalidad implementado
- [X] Medidas de seguridad técnicas implementadas
- [X] Información a titulares antes de recopilación
- [X] Derecho de acceso implementado
- [X] Derecho de rectificación implementado
- [X] Derecho de cancelación implementado (con limitaciones legales)
- [X] No hay transferencias a terceros privados
- [ ] Cifrado en reposo (PENDIENTE)

**Ley 21.459 - Ciberseguridad:**
- [X] Política de seguridad documentada
- [X] Gestión de riesgos implementada
- [X] Plan de respuesta a incidentes definido
- [X] Hardening de sistemas implementado
- [X] Procedimiento de notificación a ANCI definido
- [X] Logs de auditoría con retención adecuada
- [ ] Simulacro de incidente realizado (PENDIENTE)

**Ley 21.180 - Transformación Digital:**
- [X] API REST para interoperabilidad
- [X] Seguridad digital implementada (HTTPS, autenticación)
- [X] Datos abiertos disponibles (estadísticas sin datos personales)
- [~] Accesibilidad digital (PARCIAL - falta certificación)

**Decreto 83 - Norma Técnica:**
- [X] Clasificación de información definida
- [X] Control de acceso basado en roles
- [X] Backups automáticos diarios
- [X] Procedimiento de reporte de incidentes
- [ ] Plan de disaster recovery completo (PENDIENTE)

**Instructivo Presidencial 8:**
- [X] Política de contraseñas diferenciada
- [X] Política de actualizaciones definida
- [X] Registro de eventos de seguridad
- [ ] Autenticación multifactor (PENDIENTE)

### 8.2 Evidencias de Cumplimiento

**Documentación Disponible:**

1. `docs/politica-seguridad.md` - Política de seguridad de la información
2. `docs/matriz-riesgos.md` - Evaluación de riesgos OWASP Top 10
3. `docs/plan-incidentes.md` - Plan de respuesta a incidentes
4. `docs/hardening-database.md` - Hardening de PostgreSQL
5. `docs/hardening-contenedores.md` - Hardening de contenedores Docker
6. `docs/owasp-top10.md` - Análisis de vulnerabilidades
7. `docs/cumplimiento-normativo.md` - Este documento

**Evidencias Técnicas:**

```bash
# Generar reporte de cumplimiento técnico

echo "=== REPORTE DE CUMPLIMIENTO TÉCNICO ===" > compliance_report.txt
echo "Fecha: $(date)" >> compliance_report.txt
echo "" >> compliance_report.txt

echo "1. Versiones de Software:" >> compliance_report.txt
docker exec postgres-master psql -U admin -c "SELECT version();" >> compliance_report.txt
docker exec backend node --version >> compliance_report.txt
docker exec frontend nginx -v 2>> compliance_report.txt
echo "" >> compliance_report.txt

echo "2. Usuarios de Base de Datos:" >> compliance_report.txt
docker exec postgres-master psql -U admin -d municipalidad_db -c "\du" >> compliance_report.txt
echo "" >> compliance_report.txt

echo "3. Configuración SSL PostgreSQL:" >> compliance_report.txt
docker exec postgres-master psql -U admin -d municipalidad_db -c "SHOW ssl;" >> compliance_report.txt
echo "" >> compliance_report.txt

echo "4. Escaneo de Vulnerabilidades:" >> compliance_report.txt
npm audit --audit-level=moderate >> compliance_report.txt
echo "" >> compliance_report.txt

echo "5. Permisos de Contenedores:" >> compliance_report.txt
docker inspect backend --format='User: {{.Config.User}}' >> compliance_report.txt
docker inspect frontend --format='User: {{.Config.User}}' >> compliance_report.txt
docker inspect ai-service --format='User: {{.Config.User}}' >> compliance_report.txt
echo "" >> compliance_report.txt

echo "Reporte generado exitosamente"
```

### 8.3 Contacto de Cumplimiento

**Delegado de Protección de Datos:**
- Nombre: [Responsable Legal/Privacidad]
- Email: privacidad@municipalidad.cl
- Teléfono: +56 2 XXXX XXXX
- Función: Atender consultas y solicitudes ARCO

**Oficial de Seguridad de la Información:**
- Nombre: [Responsable Seguridad]
- Email: seguridad@municipalidad.cl
- Teléfono: +56 9 XXXX XXXX
- Función: Supervisar cumplimiento de normativas de ciberseguridad

**Coordinador de Cumplimiento Normativo:**
- Nombre: [Responsable Cumplimiento]
- Email: cumplimiento@municipalidad.cl
- Teléfono: +56 2 XXXX XXXX
- Función: Coordinar auditorías y actualización de políticas

---

## 9. Control de Versiones del Documento

**Versión 1.0 - 30 de noviembre de 2025:**
- Creación inicial del documento de cumplimiento normativo
- Análisis de Ley 19.628 (Protección de Datos)
- Análisis de Ley 21.459 (Ciberseguridad)
- Análisis de Ley 21.180 (Transformación Digital)
- Análisis de Decreto 83 (Norma Técnica)
- Análisis de Instructivo Presidencial 8
- Identificación de brechas y plan de mejora
- Checklist de cumplimiento

**Próximas Revisiones Programadas:**
- Marzo 2026 (revisión trimestral)
- Después de cambios legislativos
- Después de auditorías externas

**Responsable de Mantenimiento:** Equipo Legal + Seguridad

---

**Documento aprobado por:**  
Responsable de Cumplimiento Normativo - ProyectoAdminUnidad2  
Fecha: 30 de noviembre de 2025
