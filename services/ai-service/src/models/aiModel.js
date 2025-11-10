const pool = require('../config/db');

// Obtener preguntas sugeridas (FAQs como sugerencias)
const obtenerFAQs = async () => {
  try {
    const result = await pool.query(
      'SELECT id, pregunta, categoria FROM ia_faqs WHERE activa = true ORDER BY categoria, pregunta'
    );
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    throw error;
  }
};

// Obtener datos municipales por RUT
const obtenerDatosMunicipalesPorRUT = async (rut) => {
  try {
    const result = await pool.query(
      `SELECT 
        rut, nombre, licencia_numero, licencia_fecha_vencimiento, 
        licencia_estado, patente_numero, patente_estado, 
        permiso_estado, juzgado_estado, aseo_estado
       FROM datos_municipales 
       WHERE rut = $1`,
      [rut]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error obteniendo datos municipales:', error);
    throw error;
  }
};

// Guardar conversación en historial
const guardarConversacion = async (usuarioId, pregunta, respuesta, modelo) => {
  try {
    // Solo guardar si usuarioId es válido y es UUID
    if (!usuarioId || usuarioId === 'undefined') {
      console.warn('⚠️  No se guarda conversación: usuarioId inválido');
      return null;
    }

    const result = await pool.query(
      `INSERT INTO ia_conversaciones (usuario_id, pregunta, respuesta, modelo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, creado_en`,
      [usuarioId, pregunta, respuesta, modelo]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error guardando conversación:', error.message);
    // No fallar la respuesta si no se guarda el historial
    return null;
  }
};

// Obtener historial de conversaciones de un usuario
const obtenerHistorial = async (usuarioId, limite = 10) => {
  try {
    const result = await pool.query(
      `SELECT pregunta, respuesta, modelo, creado_en
       FROM ia_conversaciones
       WHERE usuario_id = $1
       ORDER BY creado_en DESC
       LIMIT $2`,
      [usuarioId, limite]
    );
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
};

module.exports = {
  obtenerFAQs,
  obtenerDatosMunicipalesPorRUT,
  guardarConversacion,
  obtenerHistorial,
};
