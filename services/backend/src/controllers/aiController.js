const {
    chatWithAI,
    detectarVencimientos,
    obtenerFAQs,
    obtenerHistorial,
    obtenerPreguntasSugeridas,
} = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Procesar pregunta y obtener respuesta de IA
 */
const chat = async (req, res) => {
    try {
        const { pregunta } = req.body;
        const usuarioId = req.user?.id; // ID del usuario autenticado (si existe)
        const rut = req.user?.rut; // RUT del usuario autenticado

        if (!pregunta) {
            return res.status(400).json({ error: 'La pregunta es requerida' });
        }

        const respuesta = await chatWithAI(pregunta, usuarioId, rut);

        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar la pregunta', detalle: error.message });
    }
};

/**
 * POST /api/ai/vencimientos
 * Detectar licencias próximas a vencer y generar recordatorios
 */
const vencimientos = async (req, res) => {
    try {
        const { diasAnticipacion = 30 } = req.body;

        // Validar que diasAnticipacion sea un número válido
        if (isNaN(diasAnticipacion) || diasAnticipacion < 1 || diasAnticipacion > 365) {
            return res.status(400).json({
                error: 'diasAnticipacion debe ser un número entre 1 y 365',
            });
        }

        const recordatorios = await detectarVencimientos(diasAnticipacion);

        res.status(200).json({
            total: recordatorios.length,
            recordatorios,
            generadoEn: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error en vencimientos controller:', error.message);
        res.status(500).json({ error: 'Error al detectar vencimientos', detalle: error.message });
    }
};

/**
 * GET /api/ai/faq
 * Obtener preguntas frecuentes
 */
const faq = async (req, res) => {
    try {
        const faqs = await obtenerFAQs();

        res.status(200).json({
            total: faqs.length,
            faqs,
        });
    } catch (error) {
        console.error('Error en faq controller:', error.message);
        res.status(500).json({ error: 'Error al obtener FAQs', detalle: error.message });
    }
};

/**
 * GET /api/ai/historial
 * Obtener historial de conversaciones del usuario autenticado
 */
const historial = async (req, res) => {
    try {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ error: 'Debe estar autenticado' });
        }

        const limite = parseInt(req.query.limite) || 10;
        const conversaciones = await obtenerHistorial(usuarioId, limite);

        res.status(200).json({
            total: conversaciones.length,
            conversaciones,
        });
    } catch (error) {
        console.error('Error en historial controller:', error.message);
        res.status(500).json({ error: 'Error al obtener historial', detalle: error.message });
    }
};

/**
 * GET /api/ai/sugerencias
 * Obtener preguntas sugeridas basadas en contexto
 */
const sugerencias = async (req, res) => {
    try {
        const { contexto = 'general' } = req.query;

        const preguntas = await obtenerPreguntasSugeridas(contexto);

        res.status(200).json({
            contexto,
            preguntas,
            total: preguntas.length,
        });
    } catch (error) {
        console.error('Error en sugerencias controller:', error.message);
        res.status(500).json({ error: 'Error al obtener sugerencias', detalle: error.message });
    }
};

module.exports = {
    chat,
    vencimientos,
    faq,
    historial,
    sugerencias,
};
