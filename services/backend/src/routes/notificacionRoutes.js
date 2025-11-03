const express = require('express');
const { enviarNotificacionMasiva } = require('../controllers/notificacionController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/notificaciones/enviar
router.post('/enviar', 
    verifyToken, 
    verifyRole(['admin']), 
    enviarNotificacionMasiva
);

module.exports = router;
