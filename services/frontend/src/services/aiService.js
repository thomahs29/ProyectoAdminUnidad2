import { aiApi } from './api';

/**
 * Enviar pregunta a la IA (servicio independiente en puerto 3001)
 * @param {string} pregunta - La pregunta del usuario
 * @returns {Promise<object>} Respuesta de la IA
 */
export const enviarPregunta = async (pregunta) => {
    try {
        console.log('[Frontend] Enviando pregunta a IA Service:', pregunta);
        console.log('[Frontend] URL objetivo: http://localhost:3001/api/ai/chat');
        
        const response = await aiApi.post('/chat', {
            pregunta,
        });
        
        console.log('[Frontend] Respuesta recibida:', response.data);
        return response.data;
    } catch (error) {
        console.error(' [Frontend] Error enviando pregunta:', error);
        console.error('   Mensaje:', error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Data:', error.response?.data);
        throw error;
    }
};

/**
 * Obtener preguntas sugeridas
 * @returns {Promise<array>} Lista de preguntas sugeridas
 */
export const obtenerFAQs = async () => {
    try {
        console.log('[Frontend] Obteniendo FAQs desde IA Service...');
        const response = await aiApi.get('/faq');
        console.log('[Frontend] FAQs recibidas:', response.data);
        return response.data.faqs;
    } catch (error) {
        console.error(' [Frontend] Error obteniendo FAQs:', error);
        console.error('   Mensaje:', error.message);
        console.error('   Status:', error.response?.status);
        return []; 
    }
};

/**
 * Obtener historial de conversaciones
 * @param {number} limite - 
 * @returns {Promise<array>} 
 */
export const obtenerHistorial = async (limite = 10) => {
    try {
        const response = await aiApi.get(`/historial?limite=${limite}`);
        return response.data.conversaciones;
    } catch (error) {
        throw error;
    }
};
