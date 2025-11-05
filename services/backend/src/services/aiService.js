let OpenAI;
let openai = null;

try {
    OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ OpenAI API inicializada correctamente');
    } else {
        console.warn('⚠️ OPENAI_API_KEY no configurada. Usando modo simulado.');
    }
} catch (error) {
    console.error('❌ Error inicializando OpenAI:', error.message);
}

const pool = require('../config/db');

/**
 * Procesar pregunta del usuario y obtener respuesta de IA
 * @param {string} pregunta - Pregunta del usuario
 * @param {number} usuarioId - ID del usuario (para historial)
 * @returns {Promise<object>} Respuesta de IA
 */
const chatWithAI = async (pregunta, usuarioId) => {
    try {
        // Validar que la pregunta no esté vacía
        if (!pregunta || pregunta.trim().length === 0) {
            throw new Error('La pregunta no puede estar vacía');
        }

        let respuesta;
        let modelo = 'gpt-3.5-turbo';

        // Si OpenAI está disponible, usarlo
        if (openai) {
            try {
                const systemPrompt = `Eres un asistente de atención al ciudadano de la Municipalidad de Linares, especializado en licencias de conducir y trámites municipales. 
        Proporciona respuestas claras, concisas y profesionales en español.
        Si la pregunta está fuera de tu área, sugiere contactar directamente con la municipalidad.`;

                const response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt,
                        },
                        {
                            role: 'user',
                            content: pregunta,
                        },
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                });

                respuesta = response.choices[0].message.content;
            } catch (openaiError) {
                console.warn('Error con OpenAI, usando modo simulado:', openaiError.message);
                respuesta = generarRespuestaSimulada(pregunta);
                modelo = 'gpt-3.5-turbo-simulado';
            }
        } else {
            // Modo simulado
            respuesta = generarRespuestaSimulada(pregunta);
            modelo = 'gpt-3.5-turbo-simulado';
        }

        // Guardar en historial de conversaciones
        if (usuarioId) {
            await guardarConversacion(usuarioId, pregunta, respuesta, modelo);
        }

        return {
            pregunta,
            respuesta,
            modelo,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error en chatWithAI:', error.message);
        throw error;
    }
};

/**
 * Generar respuesta simulada basada en palabras clave
 */
const generarRespuestaSimulada = (pregunta) => {
    const preguntaLower = pregunta.toLowerCase();
    
    const respuestas = {
        'licencia': 'El costo de renovación de la licencia de conducir varía según el tipo de licencia. En promedio, oscila entre $30,000 y $50,000 pesos chilenos. Se recomienda contactar directamente con la municipalidad para conocer el costo exacto.',
        'renovar': 'Para renovar su licencia de conducir necesita: 1) Cédula de identidad vigente, 2) Comprobante de domicilio, 3) Examen médico, 4) Examen psicotécnico. Le sugerimos agendar una cita a través de nuestra plataforma.',
        'horario': 'Nuestro horario de atención es de lunes a viernes de 8:00 a 17:00 horas. Los sábados y domingos atendemos solo por casos especiales.',
        'reserva': 'Puede hacer su reserva accediendo a nuestra plataforma en línea, seleccionando la fecha y hora disponible que mejor le convengan.',
        'documento': 'Para trámites municipales típicamente necesita: Cédula de identidad, comprobante de domicilio, y documentos específicos según el tipo de trámite.',
        'costo': 'Los costos varían según el tipo de servicio. Le recomendamos consultar directamente en nuestras oficinas o llamar al número de atención al público.',
    };

    for (const [palabra, respuesta] of Object.entries(respuestas)) {
        if (preguntaLower.includes(palabra)) {
            return respuesta;
        }
    }

    return 'Disculpe, no tengo una respuesta específica para esa pregunta. Le recomendamos contactar directamente con la municipalidad o revisar nuestras preguntas frecuentes.';
};

/**
 * Detectar licencias próximas a vencer y generar recordatorio
 * @param {number} diasAnticipacion - Días previos al vencimiento
 * @returns {Promise<array>} Array de licencias por vencer con recordatorio
 */
const detectarVencimientos = async (diasAnticipacion = 30) => {
    try {
        // Consultar licencias próximas a vencer
        const result = await pool.query(
            `SELECT u.id, u.nombre, u.email, l.numero_licencia, l.fecha_vencimiento, l.clase
             FROM usuarios u
             JOIN licencias l ON u.id = l.usuario_id
             WHERE l.fecha_vencimiento <= NOW() + INTERVAL '${diasAnticipacion} days'
             AND l.fecha_vencimiento > NOW()
             AND l.estado = 'activa'
             ORDER BY l.fecha_vencimiento ASC`
        );

        const licenciasVencimiento = result.rows;

        // Generar recordatorios personalizados
        const recordatorios = licenciasVencimiento.map((licencia) => {
            const diasRestantes = Math.ceil(
                (new Date(licencia.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
            );

            const recordatorio = `Estimado(a) ${licencia.nombre}, le informamos que su licencia de conducir clase ${licencia.clase} vence el ${new Date(licencia.fecha_vencimiento).toLocaleDateString('es-CL')} en ${diasRestantes} día(s). Le recomendamos renovarla a la brevedad en nuestras oficinas o a través de la plataforma en línea.`;

            return {
                usuarioId: licencia.id,
                nombre: licencia.nombre,
                email: licencia.email,
                numeroLicencia: licencia.numero_licencia,
                fechaVencimiento: licencia.fecha_vencimiento,
                diasRestantes,
                clase: licencia.clase,
                recordatorio,
            };
        });

        return recordatorios;
    } catch (error) {
        console.error('Error en detectarVencimientos:', error.message);
        throw error;
    }
};

/**
 * Obtener FAQs predefinidas (para preguntas comunes sin usar IA)
 * @returns {Promise<array>} Array de preguntas frecuentes
 */
const obtenerFAQs = async () => {
    try {
        const result = await pool.query(
            `SELECT id, pregunta, respuesta, categoría
             FROM ia_faqs
             WHERE activo = true
             ORDER BY categoría, id`
        );
        return result.rows;
    } catch (error) {
        console.error('Error en obtenerFAQs:', error.message);
        // Retornar FAQs por defecto si la tabla no existe
        return obtenerFAQsDefault();
    }
};

/**
 * FAQs por defecto (en caso de que la tabla no exista)
 */
const obtenerFAQsDefault = () => {
    return [
        {
            id: 1,
            pregunta: '¿Cuánto cuesta renovar la licencia de conducir?',
            respuesta: 'El costo de renovación varía según el tipo de licencia. Consulte directamente en el municipio o llamar al número de atención al público.',
            categoría: 'Licencias',
        },
        {
            id: 2,
            pregunta: '¿Cuál es el horario de atención?',
            respuesta: 'Nuestro horario de atención es de lunes a viernes de 8:00 a 17:00 horas. Los sábados y domingos atendemos por casos especiales.',
            categoría: 'General',
        },
        {
            id: 3,
            pregunta: '¿Qué documentos necesito para renovar mi licencia?',
            respuesta: 'Necesita: Cédula de identidad vigente, comprobante de domicilio, examen médico y examen psicotécnico. Consulte con un ejecutivo para más detalles.',
            categoría: 'Licencias',
        },
        {
            id: 4,
            pregunta: '¿Cómo hago una reserva?',
            respuesta: 'Puede hacer su reserva a través de nuestra plataforma en línea, seleccionando la fecha y hora disponible que mejor le convengan.',
            categoría: 'Trámites',
        },
    ];
};

/**
 * Guardar conversación en la base de datos
 * @param {number} usuarioId - ID del usuario
 * @param {string} pregunta - Pregunta del usuario
 * @param {string} respuesta - Respuesta de IA
 * @param {string} modelo - Modelo utilizado
 */
const guardarConversacion = async (usuarioId, pregunta, respuesta, modelo = 'gpt-3.5-turbo') => {
    try {
        // Crear tabla si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ia_conversaciones (
                id SERIAL PRIMARY KEY,
                usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
                pregunta TEXT NOT NULL,
                respuesta TEXT NOT NULL,
                modelo VARCHAR(50),
                creado_en TIMESTAMP DEFAULT NOW()
            );
        `);

        // Insertar conversación
        await pool.query(
            `INSERT INTO ia_conversaciones (usuario_id, pregunta, respuesta, modelo)
             VALUES ($1, $2, $3, $4)`,
            [usuarioId, pregunta, respuesta, modelo]
        );
    } catch (error) {
        console.error('Error al guardar conversación:', error.message);
        // No lanzar error para no afectar la respuesta al usuario
    }
};

/**
 * Obtener historial de conversaciones de un usuario
 * @param {number} usuarioId - ID del usuario
 * @param {number} limite - Número máximo de conversaciones a retornar
 */
const obtenerHistorial = async (usuarioId, limite = 10) => {
    try {
        const result = await pool.query(
            `SELECT id, pregunta, respuesta, modelo, creado_en
             FROM ia_conversaciones
             WHERE usuario_id = $1
             ORDER BY creado_en DESC
             LIMIT $2`,
            [usuarioId, limite]
        );
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial:', error.message);
        return [];
    }
};

/**
 * Obtener preguntas sugeridas contextuales
 * @param {string} contexto - Contexto de la página (ej: 'reserva', 'documentos')
 * @returns {Promise<array>} Preguntas sugeridas
 */
const obtenerPreguntasSugeridas = async (contexto = 'general') => {
    const preguntasContextuales = {
        reserva: [
            '¿Qué documentos necesito llevar a mi cita?',
            '¿Puedo cambiar la fecha de mi reserva?',
            '¿Cuánto tiempo toma un trámite de licencia?',
            '¿Cómo cancelar una reserva?',
        ],
        documentos: [
            '¿Qué tipos de documentos debo presentar?',
            '¿Dónde obtengo un certificado de residencia?',
            '¿Cuál es el costo de los trámites?',
            '¿Cuánto demoran en procesar mis documentos?',
        ],
        licencia: [
            '¿Cuándo vence mi licencia?',
            '¿Puedo renovar antes del vencimiento?',
            '¿Cuál es el costo de renovación?',
            '¿Qué clases de licencias existen?',
            '¿Cómo sé si tengo licencia vigente?',
        ],
        general: [
            '¿Cuál es el horario de atención?',
            '¿Cómo hago una reserva?',
            '¿Qué tipos de trámites ofrece la municipalidad?',
            '¿Cuáles son los requisitos para renovar licencia?',
            '¿Dónde está ubicada la municipalidad?',
        ],
    };

    return preguntasContextuales[contexto] || preguntasContextuales.general;
};

module.exports = {
    chatWithAI,
    detectarVencimientos,
    obtenerFAQs,
    guardarConversacion,
    obtenerHistorial,
    obtenerPreguntasSugeridas,
};
