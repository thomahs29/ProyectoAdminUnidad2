const aiService = require('../services/aiService');
const aiModel = require('../models/aiModel');

/**
 * POST /api/ai/chat
 * Procesar pregunta y obtener respuesta
 */
const chat = async (req, res) => {
  try {
    const { pregunta } = req.body;
    const usuarioId = req.user?.id;
    const rut = req.user?.rut;

    if (!pregunta) {
      return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    const respuesta = await aiService.procesarPregunta(pregunta, usuarioId, rut);
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ 
      error: 'Error al procesar la pregunta',
      detalle: error.message 
    });
  }
};

/**
 * GET /api/ai/faq
 * Obtener todas las preguntas frecuentes
 */
const faq = async (req, res) => {
  try {
    const faqs = await aiModel.obtenerFAQs();
    res.status(200).json({ faqs });
  } catch (error) {
    console.error('Error obteniendo FAQs:', error);
    res.status(500).json({ error: 'Error al obtener FAQs' });
  }
};

/**
 * GET /api/ai/faq/:id
 * Obtener FAQ específico
 */
const obtenerFAQPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await aiModel.obtenerFAQPorId(id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ no encontrada' });
    }

    res.status(200).json(faq);
  } catch (error) {
    console.error('Error obteniendo FAQ:', error);
    res.status(500).json({ error: 'Error al obtener FAQ' });
  }
};

/**
 * GET /api/ai/buscar
 * Buscar FAQs por término
 */
const buscar = async (req, res) => {
  try {
    const { termino } = req.query;

    if (!termino) {
      return res.status(400).json({ error: 'El término de búsqueda es requerido' });
    }

    const resultados = await aiModel.buscarFAQs(termino);
    res.status(200).json({ resultados });
  } catch (error) {
    console.error('Error buscando FAQs:', error);
    res.status(500).json({ error: 'Error al buscar FAQs' });
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
  obtenerFAQPorId,
  buscar,
  historial,
};
