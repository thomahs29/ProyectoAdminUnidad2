import api from './api';

/**
 * Enviar pregunta a la IA (endpoint del backend)
 * @param {string} pregunta - La pregunta del usuario
 * @returns {Promise<object>} Respuesta de la IA
 */
export const enviarPregunta = async (pregunta) => {
    try {
        const response = await api.post('/ai/chat', {
            pregunta,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtener preguntas frecuentes
 * @returns {Promise<array>} Lista de FAQs
 */
export const obtenerFAQs = async () => {
    try {
        const response = await api.get('/ai/faq');
        return response.data.faqs;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtener preguntas sugeridas según el contexto de la página
 * @param {string} contexto - Tipo de contexto: 'reserva', 'documentos', 'licencia', 'general'
 * @returns {Promise<array>} Lista de preguntas sugeridas
 */
export const obtenerSugerencias = async (contexto = 'general') => {
    try {
        const response = await api.get('/ai/sugerencias', {
            params: { contexto },
        });
        return response.data.preguntas;
    } catch (error) {
        throw error;
    }
};

/**
 * Detectar licencias próximas a vencer
 * @param {number} diasAnticipacion - Días previos al vencimiento (default: 30)
 * @returns {Promise<array>} Lista de licencias con recordatorios
 */
export const detectarVencimientos = async (diasAnticipacion = 30) => {
    try {
        const response = await api.post('/ai/vencimientos', {
            diasAnticipacion,
        });
        return response.data.recordatorios;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtener historial de conversaciones
 * @param {number} limite - Número máximo de conversaciones (default: 10)
 * @returns {Promise<array>} Historial de conversaciones
 */
export const obtenerHistorial = async (limite = 10) => {
    try {
        const response = await api.get(`/ai/historial?limite=${limite}`);
        return response.data.conversaciones;
    } catch (error) {
        throw error;
    }
};
