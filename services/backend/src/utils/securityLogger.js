/**
 * Security Logger Module
 * 
 * Proporciona funciones de logging centralizadas para eventos de seguridad.
 * Todos los logs se emiten en formato JSON estructurado para facilitar el parsing en Loki.
 */

/**
 * Niveles de log
 */
const LogLevel = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

/**
 * Tipos de eventos de seguridad
 */
const EventType = {
    AUTH_SUCCESS: 'auth_success',
    AUTH_FAILED: 'auth_failed',
    ACCESS_DENIED_401: 'access_denied_401',
    ACCESS_DENIED_403: 'access_denied_403',
    AUTHORIZATION_ERROR: 'authorization_error',
    SENSITIVE_ACCESS: 'sensitive_access',
    CONFIG_CHANGE: 'config_change',
    DB_ERROR: 'db_error',
    DB_SLOW_QUERY: 'db_slow_query'
};

/**
 * Función base para emitir logs estructurados
 */
const logStructured = (level, eventType, message, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        event_type: eventType,
        message,
        ...details
    };

    // Emitir como JSON para que Promtail lo parsee
    console.log(JSON.stringify(logEntry));
};

/**
 * Registra un intento de autenticación
 * @param {boolean} success - Si el login fue exitoso
 * @param {number|null} userId - ID del usuario (null si falló)
 * @param {string} rut - RUT del usuario que intentó autenticarse
 * @param {string} ip - Dirección IP del cliente
 * @param {object} details - Detalles adicionales
 */
const logAuthAttempt = (success, userId, rut, ip, details = {}) => {
    const eventType = success ? EventType.AUTH_SUCCESS : EventType.AUTH_FAILED;
    const level = success ? LogLevel.INFO : LogLevel.WARNING;
    const message = success ? 'Login exitoso' : 'Intento de login fallido';

    logStructured(level, eventType, message, {
        user_id: userId,
        user_rut: rut,
        ip_address: ip,
        ...details
    });
};

/**
 * Registra un acceso denegado (401 o 403)
 * @param {number} statusCode - 401 o 403
 * @param {number|null} userId - ID del usuario (puede ser null si no está autenticado)
 * @param {string} endpoint - Endpoint que se intentó acceder
 * @param {string} reason - Razón del rechazo
 * @param {string} ip - Dirección IP del cliente
 */
const logAccessDenied = (statusCode, userId, endpoint, reason, ip) => {
    const eventType = statusCode === 401 ? EventType.ACCESS_DENIED_401 : EventType.ACCESS_DENIED_403;
    const level = LogLevel.WARNING;
    const message = `Acceso denegado: ${reason}`;

    logStructured(level, eventType, message, {
        user_id: userId,
        endpoint,
        reason,
        ip_address: ip,
        status_code: statusCode
    });
};

/**
 * Registra un error de autorización (token inválido, sesión expirada, etc.)
 * @param {string} error - Tipo de error
 * @param {number|null} userId - ID del usuario si se pudo extraer del token
 * @param {string} ip - Dirección IP del cliente
 * @param {object} details - Detalles adicionales
 */
const logAuthorizationError = (error, userId, ip, details = {}) => {
    const level = LogLevel.ERROR;
    const message = `Error de autorización: ${error}`;

    logStructured(level, EventType.AUTHORIZATION_ERROR, message, {
        user_id: userId,
        error,
        ip_address: ip,
        ...details
    });
};

/**
 * Registra acceso a un endpoint sensible
 * @param {number} userId - ID del usuario
 * @param {string} endpoint - Endpoint accedido
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {string} action - Acción realizada
 * @param {string} ip - Dirección IP del cliente
 */
const logSensitiveAccess = (userId, endpoint, method, action, ip) => {
    const level = LogLevel.INFO;
    const message = `Acceso a endpoint sensible: ${method} ${endpoint}`;

    logStructured(level, EventType.SENSITIVE_ACCESS, message, {
        user_id: userId,
        endpoint,
        method,
        action,
        ip_address: ip
    });
};

/**
 * Registra un cambio en la configuración del sistema
 * @param {number} userId - ID del usuario que hizo el cambio
 * @param {string} action - Acción realizada (CREATE, UPDATE, DELETE)
 * @param {string} resource - Recurso modificado (usuario, configuración, etc.)
 * @param {object} details - Detalles del cambio
 */
const logConfigChange = (userId, action, resource, details = {}) => {
    const level = LogLevel.INFO;
    const message = `Cambio de configuración: ${action} ${resource}`;

    logStructured(level, EventType.CONFIG_CHANGE, message, {
        user_id: userId,
        action,
        resource,
        ...details
    });
};

/**
 * Registra un evento relacionado con la base de datos
 * @param {string} event - Tipo de evento (error, slow_query, etc.)
 * @param {object} error - Objeto de error (si aplica)
 * @param {string} query - Query SQL (opcional, solo para slow queries)
 * @param {object} details - Detalles adicionales
 */
const logDatabaseEvent = (event, error = null, query = null, details = {}) => {
    let level = LogLevel.INFO;
    let eventType = EventType.DB_ERROR;
    let message = event;

    if (event === 'slow_query') {
        level = LogLevel.WARNING;
        eventType = EventType.DB_SLOW_QUERY;
        message = 'Query lento detectado';
    } else if (error) {
        level = LogLevel.CRITICAL;
        message = `Error de base de datos: ${error.message || event}`;
    }

    logStructured(level, eventType, message, {
        error_message: error?.message,
        error_code: error?.code,
        query: query ? query.substring(0, 200) : null, // Limitar tamaño del query
        ...details
    });
};

module.exports = {
    LogLevel,
    EventType,
    logAuthAttempt,
    logAccessDenied,
    logAuthorizationError,
    logSensitiveAccess,
    logConfigChange,
    logDatabaseEvent
};
