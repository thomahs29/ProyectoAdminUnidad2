const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Auth] Sin token en request:', {
        path: req.path,
        method: req.method,
        headers: Object.keys(req.headers)
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth] Verificando token...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth] Token válido para usuarioId:', decoded.usuarioId);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth] Error verificando token:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
