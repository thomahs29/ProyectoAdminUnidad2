const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const aiModel = require('../models/aiModel');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let openai = null;

// Inicializar OpenAI si hay API key
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API inicializado');
} else {
  console.warn('⚠️  OPENAI_API_KEY no configurada. Usando modo simulado.');
}

/**
 * Procesar pregunta y devolver respuesta de IA
 */
const procesarPregunta = async (pregunta, usuarioId, rut) => {
  try {
    if (!pregunta || pregunta.trim().length === 0) {
      throw new Error('La pregunta no puede estar vacía');
    }

    let respuesta;
    let modelo = 'gpt-3.5-turbo';

    // Detectar si es pregunta sobre vencimiento de licencia
    const esPreguntaVencimiento = /vence|vencimiento|expiración|caducid|cuándo vence|cuándo expira/i.test(pregunta);

    if (esPreguntaVencimiento && rut) {
      try {
        const datosUsuario = await aiModel.obtenerDatosMunicipalesPorRUT(rut);

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
        console.error('Error consultando datos municipales:', error);
        respuesta = generarRespuestaSimulada(pregunta);
        modelo = 'simulado-fallback';
      }
    } else {
      // Intentar con OpenAI
      if (openai) {
        try {
          console.log('🔄 Llamando a OpenAI API...');
          const systemPrompt = `Eres un asistente de atención al ciudadano de la Municipalidad de Linares, especializado en licencias de conducir y trámites municipales. 
Proporciona respuestas claras, concisas y útiles. Cuando no sepas algo específico, sugiere contactar directamente con la municipalidad.`;

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: pregunta }
            ],
            max_tokens: 500,
            temperature: 0.7,
          });

          respuesta = aiResponse.choices[0].message.content;
          modelo = 'gpt-3.5-turbo';
        } catch (openaiError) {
          console.error('Error con OpenAI:', openaiError.message);
          respuesta = generarRespuestaSimulada(pregunta);
          modelo = 'simulado-fallback';
        }
      } else {
        // Usar respuestas simuladas
        respuesta = generarRespuestaSimulada(pregunta);
        modelo = 'simulado';
      }
    }

    // Guardar conversación
    if (usuarioId) {
      try {
        await aiModel.guardarConversacion(usuarioId, pregunta, respuesta, modelo);
      } catch (error) {
        console.error('Error guardando conversación:', error);
        // No fallar la respuesta si no se guarda el historial
      }
    }

    return {
      respuesta,
      modelo,
      tipo: 'exito',
    };
  } catch (error) {
    console.error('Error procesando pregunta:', error);
    throw error;
  }
};

/**
 * Generar respuestas simuladas
 */
const generarRespuestaSimulada = (pregunta) => {
  const preguntaLower = pregunta.toLowerCase();

  const respuestas = {
    licencia: {
      keywords: ['licencia', 'conducir', 'clase b', 'examen', 'manejo'],
      respuesta: 'Para obtener una licencia de conducir Clase B necesitas tener entre 18 y 75 años, presentar cédula de identidad, certificado médico, certificado de antecedentes, pasar examen psicotécnico y examen de manejo. El proceso toma aproximadamente 30 días.'
    },
    renovacion: {
      keywords: ['renovar', 'renovación', 'vencer', 'vencida'],
      respuesta: 'Para renovar tu licencia necesitas tener la anterior vigente o vencida hace menos de 3 años. Requieres cédula vigente, certificado médico actualizado y pagar los aranceles. La renovación es más rápida que una solicitud nueva.'
    },
    costos: {
      keywords: ['costo', 'precio', 'cuánto cuesta', 'aranceles', 'pagar'],
      respuesta: 'Los costos de licencias en Linares varían: Licencia nueva Clase B: $50.000, Renovación: $35.000, Licencia Clase C: $40.000. Estos precios pueden cambiar. Consulta directamente en la municipalidad para valores actualizados.'
    },
    horarios: {
      keywords: ['horario', 'hora', 'abierto', 'cierra', 'atención'],
      respuesta: 'La Municipalidad de Linares atiende: Lunes a viernes 08:00-17:00, Sábados 09:00-13:00, Domingos cerrado. Ubicación: Calle Principal 123, Linares.'
    },
    reservas: {
      keywords: ['reserva', 'cita', 'agendar', 'hora', 'appointment'],
      respuesta: 'Para agendar una cita puedes usar nuestro portal online. Selecciona el trámite, elige fecha y hora disponible, confirma con tu RUT y correo. Las citas deben hacerse con al menos 24 horas de anticipación.'
    },
    documentos: {
      keywords: ['documento', 'certificado', 'requisito', 'papers', 'traer'],
      respuesta: 'Para la mayoría de trámites necesitarás: Cédula de identidad vigente, comprobante de domicilio, y documentos específicos según el trámite (ej: certificado médico, antecedentes, etc). Consulta qué documentos necesitas para tu trámite específico.'
    },
  };

  for (const [key, config] of Object.entries(respuestas)) {
    if (config.keywords.some(kw => preguntaLower.includes(kw))) {
      return config.respuesta;
    }
  }

  return 'No tengo información específica sobre tu pregunta. Por favor, contacta con la Municipalidad de Linares al teléfono indicado o visita nuestro portal. ¿Hay algo más en lo que pueda ayudarte?';
};

module.exports = {
  procesarPregunta,
  generarRespuestaSimulada,
};
