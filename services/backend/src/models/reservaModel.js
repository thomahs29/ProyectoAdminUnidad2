const pool = require('../config/db');

const createReserva = async ({ usuario_id, tramite_id, fecha, hora, observaciones }) => {
    
    const checkHorario = await pool.query(
        `SELECT * FROM reservas WHERE fecha = $1 AND hora = $2 AND estado != 'cancelada'`,
        [fecha, hora]
    );

    if (checkHorario.rows.length > 0) {
        throw new Error('El horario ya está reservado');
    }

    const result = await pool.query(
        `INSERT INTO reservas (usuario_id, tramite_id, fecha, hora, observaciones)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [usuario_id, tramite_id, fecha, hora, observaciones]
    );

    return result.rows[0];
};

const getReservasByUsuario = async (usuario_id) => {
    const result = await pool.query(
        `SELECT r.id, r.fecha, r.hora, r.estado, t.nombre AS tramite
         FROM reservas r
         JOIN tramites t ON r.tramite_id = t.id
         WHERE r.usuario_id = $1
         ORDER BY r.fecha DESC, r.hora DESC`,
        [usuario_id]
    );
    return result.rows;
};

const getReservas = async () => {
    const result = await pool.query(
        `SELECT r.id, u.nombre AS usuario, u.rut, u.email, t.nombre AS tramite, r.fecha, r.hora, r.estado, r.observaciones
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.id
        JOIN tramites t ON r.tramite_id = t.id
        ORDER BY r.fecha DESC, r.hora DESC`
    );
    return result.rows;
};

const anularReserva = async (id, usuario_id) => {
    const result = await pool.query(
        `UPDATE reservas
        SET estado = 'anulada'
        WHERE id = $1 AND usuario_id = $2
        RETURNING *`,
        [id, usuario_id]
    );
    return result.rows[0];
};

module.exports = {
    createReserva,
    getReservasByUsuario,
    getReservas,
    anularReserva
};
