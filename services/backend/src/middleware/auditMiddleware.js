/**
 * Audit Middleware
 * 
 * Middleware para auditar accesos a endpoints sensibles del sistema.
 * Se ejecuta después de verifyToken para capturar información del usuario autenticado.
 */

const { logSensitiveAccess } = require('../utils/securityLogger');

/**
 * Lista de endpoints sensibles a auditar
 * Estos endpoints requieren logging adicional por su impacto en el sistema
 */
const sensitiveEndpoints = [
    // Usuarios (CRUD)
    { pattern: /^\/api\/users\/\d+$/, methods: ['PUT', 'DELETE'], action: 'Modificar/eliminar usuario' },
    { pattern: /^\/api\/users$/, methods: ['POST'], action: 'Crear usuario' },
    { pattern: /^\/api\/users$/, methods: ['GET'], action: 'Listar usuarios' },

    // Reportes (generación de archivos)
    { pattern: /^\/api\/reportes/, methods: ['GET', 'POST'], action: 'Generar reporte' },

    // Notificaciones masivas
    { pattern: /^\/api\/notificaciones\/enviar-masivo/, methods: ['POST'], action: 'Enviar notificación masiva' },

    // Configuración municipal
    { pattern: /^\/api\/municipales/, methods: ['GET', 'POST', 'PUT', 'DELETE'], action: 'Acceso a config municipal' },
];

/**
 * Verifica si un endpoint es sensible
 */
const isSensitiveEndpoint = (path, method) => {
    return sensitiveEndpoints.find(
        endpoint => endpoint.pattern.test(path) && endpoint.methods.includes(method)
    );
};

/**
 * Middleware de auditoría
 * Debe ser usado DESPUÉS de verifyToken para tener acceso a req.user
 */
const auditMiddleware = (req, res, next) => {
    const sensitiveEndpoint = isSensitiveEndpoint(req.path, req.method);

    if (sensitiveEndpoint && req.user) {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

        // Log sensitive access
        logSensitiveAccess(
            req.user.id,
            req.path,
            req.method,
            sensitiveEndpoint.action,
            clientIp
        );
    }

    next();
};

module.exports = auditMiddleware;
