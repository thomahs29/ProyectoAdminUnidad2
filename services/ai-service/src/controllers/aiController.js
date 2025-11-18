const aiService = require('../services/aiService');
const aiModel = require('../models/aiModel');

/**
 * POST /api/ai/chat
 */
const chat = async (req, res) => {
  try {
    const { pregunta } = req.body;
    const usuarioId = req.user?.id || req.user?.usuarioId;
    const rut = req.user?.rut;

    console.log(' [Chat] Solicitud recibida:');
    console.log('   Pregunta:', pregunta);
    console.log('   Usuario ID:', usuarioId);
    console.log('   RUT:', rut);
    console.log('   Token decodificado:', req.user);

    if (!pregunta) {
      return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    const respuesta = await aiService.procesarPregunta(pregunta, usuarioId, rut);
    console.log('[Chat] Respuesta enviada, modelo:', respuesta.modelo);
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Chat] Error en chat:', error);
    res.status(500).json({ 
      error: 'Error al procesar la pregunta',
      detalle: error.message 
    });
  }
};

/**
 * GET /api/ai/faq
 * Obtener preguntas sugeridas para mostrar en el chat
 */
const faq = async (req, res) => {
  try {
    const faqs = await aiModel.obtenerFAQs();
    res.status(200).json({ faqs });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias' });
  }
};

/**
 * GET /api/ai/historial
 * Obtener historial de conversaciones del usuario
 */
const historial = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const { limite = 10 } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const conversaciones = await aiModel.obtenerHistorial(usuarioId, parseInt(limite));
    res.status(200).json({ conversaciones });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = {
  chat,
  faq,
  historial,
};
