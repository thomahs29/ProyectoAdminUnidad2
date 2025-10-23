const pool = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async ({ rut, nombre, email, password, role }) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
    `INSERT INTO usuarios (rut, nombre, email, password_hash, role_id)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name = $5))
     RETURNING id, rut, nombre, email`,
    [rut, nombre, email, hashedPassword, role]
  );

    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await pool.query(
        `SELECT u.id, u.rut, u.nombre, u.email, u.password_hash, r.name AS role
         FROM usuarios u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = $1`,
        [email]
    );

    return result.rows[0];
};

const getUserByRut = async (rut) => {
    const result = await pool.query(
        `SELECT u.id, u.rut, u.nombre, u.email, u.password_hash, r.name AS role
            FROM usuarios u
            JOIN roles r ON u.role_id = r.id
            WHERE u.rut = $1`,
        [rut]
    );
    return result.rows[0];
}

const getAllUsers = async () => {
    const result = await pool.query(
        `SELECT u.id, u.rut, u.nombre, u.email, r.name AS role
         FROM usuarios u
         JOIN roles r ON u.role_id = r.id`
    );
    return result.rows;
};

module.exports = {
    createUser,
    getUserByEmail,
    getAllUsers,
    getUserByRut
};