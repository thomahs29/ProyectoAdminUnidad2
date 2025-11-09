const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * POST /api/ai/chat
 * Enviar pregunta a la IA
 */
router.post('/chat', aiController.chat);

/**
 * GET /api/ai/faq
 * Obtener todas las preguntas frecuentes
 */
router.get('/faq', aiController.faq);

/**
 * GET /api/ai/faq/:id
 * Obtener FAQ específico
 */
router.get('/faq/:id', aiController.obtenerFAQPorId);

/**
 * GET /api/ai/buscar
 * Buscar FAQs por término
 */
router.get('/buscar', aiController.buscar);

/**
 * GET /api/ai/historial
 * Obtener historial de conversaciones
 */
router.get('/historial', aiController.historial);

module.exports = router;
