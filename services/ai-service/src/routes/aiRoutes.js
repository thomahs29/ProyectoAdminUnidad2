const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * POST /api/ai/chat
 * Enviar pregunta a la IA y obtener respuesta
 */
router.post('/chat', aiController.chat);

/**
 * GET /api/ai/faq
 * Obtener preguntas sugeridas
 */
router.get('/faq', aiController.faq);

/**
 * GET /api/ai/historial
 * Obtener historial de conversaciones del usuario
 */
router.get('/historial', aiController.historial);

module.exports = router;
