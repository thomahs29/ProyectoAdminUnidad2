let OpenAI;
let openai = null;

try {
    OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    } else {
        console.warn('OPENAI_API_KEY no configurada. Usando modo simulado.');
    }
} catch (error) {
    console.error('Error inicializando OpenAI:', error.message);
}

const pool = require('../config/db');
const municipalesModel = require('../models/municipalesModel');

/**
 * Procesar pregunta del usuario y obtener respuesta de IA
 * @param {string} pregunta - Pregunta del usuario
 * @param {number} usuarioId - ID del usuario (para historial)
 * @param {string} rut - RUT del usuario (para consultar datos municipales)
 * @returns {Promise<object>} Respuesta de IA
 */
const chatWithAI = async (pregunta, usuarioId, rut) => {
    try {
        // Validar que la pregunta no esté vacía
        if (!pregunta || pregunta.trim().length === 0) {
            throw new Error('La pregunta no puede estar vacía');
        }

        let respuesta;
        let modelo = 'gpt-3.5-turbo';

        // Verificar si la pregunta es específicamente sobre vencimiento de licencia
        const esPrefiuntaLicencia = /vence|vencimiento|expiración|caducid|cuándo vence|cuándo expira/i.test(pregunta);
        
        if (esPrefiuntaLicencia && rut) {
            try {
                // Consultar datos municipales
                const datosUsuario = await municipalesModel.obtenerPorRUT(rut);
                
                if (datosUsuario && datosUsuario.licencia_fecha_vencimiento) {
                    const fechaVencimiento = new Date(datosUsuario.licencia_fecha_vencimiento);
                    const hoy = new Date();
                    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
                    
                    const fechaFormato = fechaVencimiento.toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    });
                    
                    const estado = datosUsuario.licencia_estado === 'al_día' ? '✓ Al día' : '⚠️ Con deuda';
                    
                    if (diasRestantes > 0) {
                        respuesta = `Estimado(a) ${datosUsuario.nombre}, su licencia de conducir ${estado} vence el ${fechaFormato}, es decir, en ${diasRestantes} día(s). Le recomendamos renovarla en caso de necesitarlo.`;
                    } else if (diasRestantes === 0) {
                        respuesta = `Su licencia vence hoy (${fechaFormato}). Le recomendamos renovarla a la brevedad.`;
                    } else {
                        respuesta = `Su licencia expiró hace ${Math.abs(diasRestantes)} día(s). Por favor, comuníquese con la municipalidad para renovarla.`;
                    }
                    
                    modelo = 'municipales-consulta';
                } else {
                    respuesta = 'No encontramos información sobre su licencia de conducir en el sistema. Por favor, contacte directamente con la municipalidad.';
                    modelo = 'municipales-no-encontrado';
                }
            } catch (error) {
                respuesta = generarRespuestaSimulada(pregunta);
            }
        } else {
            
            // Si OpenAI está disponible, usarlo
            if (openai) {
                try {
                    console.log('🔄 Llamando a OpenAI API...');
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
                    respuesta = generarRespuestaSimulada(pregunta);
                    modelo = 'gpt-3.5-turbo-simulado';
                }
            } else {
                // Modo simulado
                respuesta = generarRespuestaSimulada(pregunta);
                modelo = 'gpt-3.5-turbo-simulado';
            }
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
        throw error;
    }
};

/**
 * Generar respuesta simulada basada en palabras clave - MEJORADA
 */
const generarRespuestaSimulada = (pregunta) => {
    const preguntaLower = pregunta.toLowerCase();
    
    // Base de conocimiento extendida sobre licencias de conducir
    const respuestas = [
        // Preguntas sobre DOCUMENTOS NECESARIOS
        {
            palabrasClaves: ['documentos', 'documento', 'necesito', 'requiero', 'qué necesito', 'requiero'],
            respuesta: 'Para solicitar una licencia de conducir en Linares, necesitará:\n\n1. Cédula de Identidad vigente\n2. Comprobante de domicilio (factura de servicios, contrato de arriendo, etc.)\n3. Examen médico (realizado por profesional autorizado)\n4. Examen psicotécnico (evaluación de capacidades)\n5. Comprobante de pago de aranceles municipales\n\nRecomendamos agendar una cita en nuestra plataforma para evitar filas.',
        },
        // Preguntas sobre LICENCIA CLASE B
        {
            palabrasClaves: ['clase b', 'licencia b'],
            respuesta: 'La Licencia Clase B permite conducir:\n\n- Automóviles particulares\n- Camionetas de carga (hasta 3,500 kg)\n- Vehículos similares\n\nRequisitos especiales:\n- Edad mínima: 18 años\n- Antigüedad mínima con Clase A: NO REQUERIDA\n- Documentación general + certificado de aprobación de exámenes\n\nLa vigencia es de 5 años. Puede renovarla 60 días antes del vencimiento.',
        },
        // Preguntas sobre RENOVACIÓN
        {
            palabrasClaves: ['renovar', 'renovación'],
            respuesta: 'Para renovar su licencia de conducir:\n\n1. Acérquese 30-60 días antes del vencimiento\n2. Traiga su licencia actual y cédula\n3. Comprobante de domicilio actualizado\n4. Examen médico reciente\n5. Examen psicotécnico (si la municipalidad lo requiere)\n6. Comprobante de pago de aranceles\n\nTarifa aproximada: $25,000 - $35,000\nPlazo: 5 años desde la renovación',
        },
        // Preguntas sobre COSTO
        {
            palabrasClaves: ['costo', 'cuesta', 'precio', 'aranceles', 'tarifa', 'valor'],
            respuesta: 'Aranceles de Licencia de Conducir en Linares:\n\n- Licencia nueva (Clase B): $35,000 - $40,000\n- Renovación (5 años): $28,000 - $35,000\n- Licencia de Aprendiz: $15,000\n- Permisos especiales: $10,000 - $20,000\n\nEstos valores son aproximados y pueden variar. Consulte en nuestras oficinas para confirmar el costo exacto según su caso.',
        },
        // Preguntas sobre HORARIOS
        {
            palabrasClaves: ['horario', 'hora', 'atención', 'abierto', 'cierra', 'abre'],
            respuesta: 'Horario de Atención Municipal:\n\nLunes a Viernes: 8:00 - 17:00 horas\nSábados: 8:00 - 13:00 (solo trámites urgentes)\nDomingos: Cerrado\n\nVacaciones municipales: Consulte el calendario oficial\nRecomendación: Agende su cita en línea para evitar esperas',
        },
        // Preguntas sobre RESERVAS
        {
            palabrasClaves: ['reserva', 'agendar', 'cita', 'disponible', 'agendamiento'],
            respuesta: 'Para agendar una cita en la Municipalidad de Linares:\n\n1. Acceda a nuestra plataforma en línea\n2. Seleccione el tipo de trámite (Licencia de Conducir)\n3. Elija la fecha y hora disponible\n4. Confirme sus datos personales\n5. Recibirá confirmación por correo\n\nTambién puede escribirnos a: atencion@linares.cl\nO llamar: +56 75 2123456',
        },
        // Preguntas sobre EXAMEN MÉDICO
        {
            palabrasClaves: ['examen médico', 'médico'],
            respuesta: 'Examen Médico para Licencia:\n\nDebe incluir:\n- Revisión de vista (agudeza visual mínima 8/10)\n- Evaluación auditiva\n- Prueba de reflexos\n- Evaluación general de salud\n\nCosto aproximado: $15,000 - $25,000\nValidez: 1 año desde emisión\n\nPuede realizarlo en clínicas autorizadas o laboratorios afiliados a la municipalidad.',
        },
        // Preguntas sobre EXAMEN PSICOTÉCNICO
        {
            palabrasClaves: ['psicotécnico', 'psico', 'capacidades', 'aptitud'],
            respuesta: 'Examen Psicotécnico:\n\nEvalúa sus capacidades para conducir:\n- Reacción ante situaciones\n- Coordinación motriz\n- Concentración y atención\n- Percepción visual\n- Manejo del estrés\n\nCosto: $10,000 - $20,000\nDuración: 20-30 minutos\n\nSe realizan en centros psicotécnicos autorizados.',
        },
        // Preguntas sobre PÉRDIDA/ROBO DE LICENCIA
        {
            palabrasClaves: ['perdí', 'pérdida', 'robo', 'extraviada', 'perdida', 'robada'],
            respuesta: 'Si perdió su licencia de conducir:\n\n1. Denuncie ante Carabineros (obtener parte)\n2. Acérquese a la municipalidad con la denuncia\n3. Traiga cédula de identidad\n4. Costo de reposición: ~$15,000\n5. Se expide de inmediato\n\nAdvertencia: No puede conducir sin licencia válida',
        },
    ];

    // Buscar respuesta según palabras clave (búsqueda más flexible)
    for (const item of respuestas) {
        for (const palabra of item.palabrasClaves) {
            if (preguntaLower.includes(palabra)) {
                return item.respuesta;
            }
        }
    }

    // Respuesta por defecto
    return 'Disculpe, no tengo información específica sobre esa pregunta. Le recomendamos:\n\nLlamar a atención al ciudadano: +56 75 2123456\nEnviar correo a: atencion@linares.cl\nVisitar nuestro sitio web: www.linares.cl\n\n¿Hay algo más en lo que pueda ayudarle?';
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
            pregunta: '¿Cuándo vence mi licencia de conducir?',
            respuesta: 'Puede ver la fecha de vencimiento de su licencia en su sección "Mis Datos Municipales" dentro de la plataforma. Si su licencia está al día, aparecerá con estado verde. Si tiene deuda, aparecerá con estado rojo. Haga clic en la opción de vencimiento para ver los días exactos que quedan.',
            categoría: 'Licencias',
        },
        {
            id: 2,
            pregunta: '¿Cuánto cuesta renovar la licencia de conducir?',
            respuesta: 'El costo de renovación varía según el tipo de licencia. Consulte directamente en el municipio o llamar al número de atención al público.',
            categoría: 'Licencias',
        },
        {
            id: 3,
            pregunta: '¿Cuál es el horario de atención?',
            respuesta: 'Nuestro horario de atención es de lunes a viernes de 8:00 a 17:00 horas. Los sábados y domingos atendemos por casos especiales.',
            categoría: 'General',
        },
        {
            id: 4,
            pregunta: '¿Qué documentos necesito para renovar mi licencia?',
            respuesta: 'Necesita: Cédula de identidad vigente, comprobante de domicilio, examen médico y examen psicotécnico. Consulte con un ejecutivo para más detalles.',
            categoría: 'Licencias',
        },
        {
            id: 5,
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
