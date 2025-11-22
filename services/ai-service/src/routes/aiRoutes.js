const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * POST /api/ai/chat
 */
router.post('/chat', aiController.chat);

/**
 * GET /api/ai/faq
 * Obtener preguntas sugeridas
 */
router.get('/faq', aiController.faq);

/**
 * GET /api/ai/historial
 */
router.get('/historial', aiController.historial);

module.exports = router;
