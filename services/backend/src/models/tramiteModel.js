const pool = require('../config/db');

const getTramites = async () => {
    const result = await pool.query(
        `SELECT * FROM tramites ORDER BY id ASC`
    );
    return result.rows;
};

const getTramitesById = async (id) => {
    const result = await pool.query(
        `SELECT * FROM tramites WHERE id = $1`, [id]
    );
    return result.rows[0];
};

const createTramite = async ({ nombre, descripcion, requisitos, duracion_estimada}) => {
    const result = await pool.query(
        `INSERT INTO tramites (nombre, descripcion, requisitos, duracion_estimada) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [nombre, descripcion, requisitos, duracion_estimada]
    );
    return result.rows[0];
};

const updateTramite = async (id, { nombre, descripcion, requisitos, duracion_estimada}) => {
    const result = await pool.query(
        `UPDATE tramites
        SET nombre = $1, descripcion = $2, requisitos = $3, duracion_estimada = $4
        WHERE id = $5 RETURNING *`,
        [nombre, descripcion, requisitos, duracion_estimada, id]
    );
    return result.rows[0];
};

const deleteTramite = async (id) => {
    const result = await pool.query(
        `DELETE FROM tramites WHERE id = $1 RETURNING *`, [id]
    );
    return result.rows[0];
};

module.exports = {
    getTramites,
    getTramitesById,
    createTramite,
    updateTramite,
    deleteTramite
};
