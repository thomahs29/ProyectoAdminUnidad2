const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const redisClient = require('../config/redis');
const { logAccessDenied, logAuthorizationError } = require('../utils/securityLogger');

dotenv.config({ path: "../../../.env" });

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Log access denied - no token provided
            logAccessDenied(401, null, req.path, 'No token provided', clientIp);
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const stored = await redisClient.get(`user_token_${decoded.id}`);
        if (!stored || stored !== token) {
            // Log authorization error - session expired or invalid
            logAuthorizationError('Session expired or invalid', decoded.id, clientIp, { endpoint: req.path });
            return res.status(401).json({ message: 'Invalid or expired session' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        // Log authorization error - invalid token
        logAuthorizationError('Invalid token', null, clientIp, {
            endpoint: req.path,
            error: error.message
        });
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const verifyRole = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            const { role, id } = req.user;
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

            console.log("User role:", role);

            if (!rolesPermitidos.includes(role)) {
                // Log access denied - insufficient permissions
                logAccessDenied(403, id, req.path, 'Insufficient permissions', clientIp);
                return res.status(403).json({ message: 'Access denied: insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error("Error verifying role:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = {
    verifyToken,
    verifyRole
};