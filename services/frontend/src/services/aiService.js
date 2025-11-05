import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Enviar pregunta a la IA
 * @param {string} pregunta - La pregunta del usuario
 * @returns {Promise<object>} Respuesta de la IA
 */
export const enviarPregunta = async (pregunta) => {
    try {
        const response = await axios.post(`${API_BASE}/ai/chat`, {
            pregunta,
        });
        return response.data;
    } catch (error) {
        console.error('Error al enviar pregunta:', error);
        throw error;
    }
};

/**
 * Obtener preguntas frecuentes
 * @returns {Promise<array>} Lista de FAQs
 */
export const obtenerFAQs = async () => {
    try {
        const response = await axios.get(`${API_BASE}/ai/faq`);
        return response.data.faqs;
    } catch (error) {
        console.error('Error al obtener FAQs:', error);
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
        const response = await axios.get(`${API_BASE}/ai/sugerencias`, {
            params: { contexto },
        });
        return response.data.preguntas;
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
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
        const response = await axios.post(`${API_BASE}/ai/vencimientos`, {
            diasAnticipacion,
        });
        return response.data.recordatorios;
    } catch (error) {
        console.error('Error al detectar vencimientos:', error);
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
        const response = await axios.get(`${API_BASE}/ai/historial?limite=${limite}`);
        return response.data.conversaciones;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw error;
    }
};
