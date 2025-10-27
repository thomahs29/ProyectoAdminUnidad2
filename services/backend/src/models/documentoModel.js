const pool = require('../config/db');

const saveDocumento = async ({
    reserva_id,
    nombre_archivo,
    ruta_archivo,
    tipo_mime,
    peso_mb
}) => {
    const result = await pool.query(
        `INSERT INTO documentos (reserva_id, nombre_archivo, ruta_archivo, tipo_mime, peso_mb)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [reserva_id, nombre_archivo, ruta_archivo, tipo_mime, peso_mb]
    );
    return result.rows[0];
};

const getDocumentosByReserva = async (reserva_id) => {
    const result = await pool.query(
        `SELECT * FROM documentos WHERE reserva_id = $1
        ORDER BY subido_en DESC`,
        [reserva_id]
    );
    return result.rows;
};

module.exports = {
    saveDocumento,
    getDocumentosByReserva
};