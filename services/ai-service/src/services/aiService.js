const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const aiModel = require('../models/aiModel');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let genAI = null;

// Inicializar Google Generative AI si hay API key
if (process.env.GEMINI_API_KEY) {
  // La API key de Google AI Studio se usa directamente
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Google Generative AI (Gemini) inicializado con API key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
} else {
  console.error('❌ GEMINI_API_KEY no configurada. El servicio no funcionará.');
}

/**
 * Procesar pregunta y devolver respuesta de IA
 */
const procesarPregunta = async (pregunta, usuarioId, rut) => {
  try {
    if (!pregunta || pregunta.trim().length === 0) {
      throw new Error('La pregunta no puede estar vacía');
    }

    console.log(`\n📨 NUEVA PREGUNTA RECIBIDA: "${pregunta}"`);
    console.log(`📌 Usuario ID: ${usuarioId}, RUT: ${rut}`);

    let respuesta;
    let modelo = 'gpt-3.5-turbo';

    // Detectar si es pregunta sobre vencimiento de licencia
    const esPreguntaVencimiento = /vence|vencimiento|expiración|caducid|cuándo vence|cuándo expira/i.test(pregunta);
    console.log(`🔍 ¿Es pregunta sobre vencimiento? ${esPreguntaVencimiento}`);

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
        respuesta = await generarRespuestaConIA(pregunta);
        modelo = 'gemini-2.0-flash-exp';
      }
    } else {
      // Usar Gemini para cualquier otra pregunta
      console.log('🧠 Intentando usar Gemini para responder...');
      respuesta = await generarRespuestaConIA(pregunta);
      modelo = genAI ? 'gemini-2.0-flash-exp' : 'error-no-api';
      console.log(`✅ Modelo usado: ${modelo}`);
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
 * Generar respuesta con Google Generative AI (Gemini)
 */
const generarRespuestaConIA = async (pregunta) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 GENERANDO RESPUESTA CON IA...`);
  console.log(`Pregunta: "${pregunta}"`);
  console.log(`genAI disponible: ${!!genAI}`);
  console.log(`GEMINI_API_KEY configurada: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`${'='.repeat(80)}`);
  
  if (genAI) {
    try {
      console.log('🔄 Llamando a Google Generative AI (Gemini)...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      console.log('✅ Modelo Gemini obtenido exitosamente');

      const systemPrompt = `Eres un asistente de atención al ciudadano de la Municipalidad de Linares, especializado en licencias de conducir y trámites municipales. 
Proporciona respuestas claras, concisas y útiles. Cuando no sepas algo específico, sugiere contactar directamente con la municipalidad.`;

      console.log('📤 Enviando solicitud a Gemini API...');
      console.log(`   System Prompt: ${systemPrompt.substring(0, 50)}...`);
      
      const result = await model.generateContent([
        `${systemPrompt}\n\nPregunta del usuario: ${pregunta}`
      ]);

      console.log('📥 Respuesta recibida de Gemini API');
      const response = await result.response;
      const text = response.text();

      console.log('✅ RESPUESTA DE GEMINI OBTENIDA CORRECTAMENTE');
      console.log(`📝 Respuesta completa (${text.length} caracteres):`);
      console.log(`   ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      console.log(`${'='.repeat(80)}\n`);
      return text;
    } catch (geminiError) {
      console.error(`\n${'!'.repeat(80)}`);
      console.error('❌ ERROR CON GEMINI:');
      console.error('Mensaje:', geminiError.message);
      console.error('Nombre:', geminiError.name);
      console.error('Status:', geminiError.status);
      console.error('Stack:', geminiError.stack);
      console.error(`${'!'.repeat(80)}\n`);
      throw geminiError; // Lanzar el error, no usar fallback
    }
  } else {
    console.error('\n❌ Google Generative AI NO configurada. Verificar GEMINI_API_KEY en .env');
    throw new Error('Gemini AI no está configurado. Verifica GEMINI_API_KEY en .env');
  }
};

module.exports = {
  procesarPregunta,
  generarRespuestaConIA,
};
