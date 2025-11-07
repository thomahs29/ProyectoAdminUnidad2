const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    chat,
    vencimientos,
    faq,
    historial,
    sugerencias,
} = require('../controllers/aiController');

/**
 * POST /api/ai/chat
 * Procesar pregunta y obtener respuesta de IA (requiere autenticación)
 * Body: { pregunta: string }
 */
router.post('/chat', verifyToken, chat);

/**
 * POST /api/ai/vencimientos
 * Detectar licencias próximas a vencer y generar recordatorios
 * Body: { diasAnticipacion?: number }
 */
router.post('/vencimientos', vencimientos);

/**
 * GET /api/ai/faq
 * Obtener preguntas frecuentes
 */
router.get('/faq', faq);

/**
 * GET /api/ai/historial
 * Obtener historial de conversaciones del usuario (requiere autenticación)
 * Query: ?limite=10
 */
router.get('/historial', historial);

/**
 * GET /api/ai/sugerencias
 * Obtener preguntas sugeridas según contexto
 * Query: ?contexto=reserva|documentos|licencia|general
 */
router.get('/sugerencias', sugerencias);

module.exports = router;
