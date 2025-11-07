const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: "../../../.env" });

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const verifyRole = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            const { role } = req.user;

            console.log("User role:", role);

            if (!rolesPermitidos.includes(role)) {
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