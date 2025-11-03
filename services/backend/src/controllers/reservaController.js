const { createReserva, getReservasByUsuario, getReservas, anularReserva } = require('../models/reservaModel');
const { sendEmailAsync, tplReservaAnulada, tplReservaCreada, tplReservaAprobada, tplReservaRechazada } = require('../services/mailService');
const pool = require('../config/db');

const reservar = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const { tramite_id, fecha, hora, observaciones } = req.body;

        if (!tramite_id || !fecha || !hora) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const reserva = await createReserva({ usuario_id, tramite_id, fecha, hora, observaciones });

        // Enviar correo de confirmación de reserva

        try {
            const { user, tramite } = await getUserAndTramite({ usuario_id, tramite_id });
            if(user?.email) {
                sendEmailAsync({
                    to: user.email,
                    subject: "Confirmación de reserva - Municipalidad de Linares",
                    html: tplReservaCreada({
                        nombre: user.nombre,
                        fecha,
                        hora,
                        tramite: tramite?.nombre || 'Tramite'
                    })
                });
            }
            console.log("Correo de confirmación enviado a:", user.email);
        } catch (emailError) {
            console.error("Error al enviar correo de confirmación:", emailError);
        }

        res.status(201).json({
            msg: "Reserva creada correctamente.",
            reserva,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la reserva' });
    }
};

const obtenerReservas = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const reservas = await getReservasByUsuario(usuario_id);
        res.status(200).json(reservas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las reservas' });
    }
};

const obtenerTodasLasReservas = async (req, res) => {
    try {
        const reservas = await getReservas();
        res.status(200).json(reservas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las reservas' });
    }
};

const cancelarReserva = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const { id } = req.params;

        const reserva = await anularReserva(id, usuario_id);
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Enviar correo de anulación de reserva

        try {
            const { user, tramite } = await getUserAndTramite({ usuario_id, tramite_id: reserva.tramite_id });
            if(user?.email) {
                sendEmailAsync({
                    to: user.email,
                    subject: "Anulación de reserva - Municipalidad de Linares",
                    html: tplReservaAnulada({
                        nombre: user.nombre,
                        fecha: reserva.fecha,
                        hora: reserva.hora,
                        tramite: tramite?.nombre || 'Tramite'
                    })
                });
            }
            console.log("Correo de anulación enviado a:", user.email);
        } catch (emailError) {
            console.error("Error al enviar correo de anulación:", emailError);
        }

        res.status(200).json({
            message: 'Reserva cancelada correctamente',
            reserva,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cancelar la reserva' });
    }
};

const aprobarReserva = async (req, res) => {
    try {
        console.log('===== APROBAR RESERVA =====');
        const { id } = req.params;
        console.log('ID de reserva:', id);

        // Obtener la reserva completa primero
        const getReserva = await pool.query(
            `SELECT r.id, r.usuario_id, r.tramite_id, r.fecha, r.hora, r.observaciones
             FROM reservas r WHERE r.id = $1`,
            [id]
        );

        if (getReserva.rows.length === 0) {
            console.log('Reserva no encontrada');
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const reservaActual = getReserva.rows[0];
        console.log('Reserva actual:', reservaActual);

        // Actualizar el estado
        const reserva = await pool.query(
            `UPDATE reservas SET estado = 'confirmada' WHERE id = $1 RETURNING *`,
            [id]
        );

        const resultado = reserva.rows[0];
        console.log('Resultado actualizado:', resultado);

        // Enviar correo de aprobación (sin esperar a que termine)
        try {
            const userResult = await pool.query(
                `SELECT nombre, email FROM usuarios WHERE id = $1`, 
                [reservaActual.usuario_id]
            );
            const user = userResult.rows[0];
            console.log('Usuario encontrado:', user);

            const tramiteResult = await pool.query(
                `SELECT nombre FROM tramites WHERE id = $1`, 
                [reservaActual.tramite_id]
            );
            const tramite = tramiteResult.rows[0];
            console.log('Trámite encontrado:', tramite);

            if(user?.email) {
                sendEmailAsync({
                    to: user.email,
                    subject: "Aprobación de reserva - Municipalidad de Linares",
                    html: tplReservaAprobada({
                        nombre: user.nombre,
                        fecha: reservaActual.fecha,
                        hora: reservaActual.hora,
                        tramite: tramite?.nombre || 'Tramite'
                    })
                });
            }
            console.log("Correo de aprobación enviado a:", user?.email);
        } catch (emailError) {
            console.error("Error al enviar correo de aprobación:", emailError);
        }

        res.status(200).json({
            message: 'Reserva aprobada correctamente',
            reserva: resultado
        });
    } catch (error) {
        console.error('❌ Error en aprobarReserva:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: 'Error al aprobar la reserva', error: error.message });
    }
};

const rechazarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        // Obtener la reserva completa primero
        const getReserva = await pool.query(
            `SELECT r.id, r.usuario_id, r.tramite_id, r.fecha, r.hora
             FROM reservas r WHERE r.id = $1`,
            [id]
        );

        if (getReserva.rows.length === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const reservaActual = getReserva.rows[0];

        // Actualizar el estado
        const reserva = await pool.query(
            `UPDATE reservas SET estado = 'anulada', observaciones = $2 WHERE id = $1 RETURNING *`,
            [id, motivo || 'Sin motivo especificado']
        );

        const resultado = reserva.rows[0];

        // Enviar correo de rechazo
        try {
            const userResult = await pool.query(
                `SELECT nombre, email FROM usuarios WHERE id = $1`, 
                [reservaActual.usuario_id]
            );
            const user = userResult.rows[0];

            const tramiteResult = await pool.query(
                `SELECT nombre FROM tramites WHERE id = $1`, 
                [reservaActual.tramite_id]
            );
            const tramite = tramiteResult.rows[0];

            if(user?.email) {
                sendEmailAsync({
                    to: user.email,
                    subject: "Rechazo de reserva - Municipalidad de Linares",
                    html: tplReservaRechazada({
                        nombre: user.nombre,
                        fecha: reservaActual.fecha,
                        hora: reservaActual.hora,
                        tramite: tramite?.nombre || 'Tramite',
                        motivo: motivo || 'Sin motivo especificado'
                    })
                });
            }
            console.log("Correo de rechazo enviado a:", user?.email);
        } catch (emailError) {
            console.error("Error al enviar correo de rechazo:", emailError);
        }

        res.status(200).json({
            message: 'Reserva rechazada correctamente',
            reserva: resultado
        });
    } catch (error) {
        console.error('❌ Error en rechazarReserva:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: 'Error al rechazar la reserva', error: error.message });
    }
};

const getUserAndTramite = async ({ usuario_id, tramite_id }) => {
  const u = await pool.query(`SELECT nombre, email FROM usuarios WHERE id = $1`, [usuario_id]);
  const t = await pool.query(`SELECT nombre FROM tramites WHERE id = $1`, [tramite_id]);
  return { user: u.rows[0], tramite: t.rows[0] };
};

module.exports = {
    reservar,
    obtenerReservas,
    obtenerTodasLasReservas,
    cancelarReserva,
    aprobarReserva,
    rechazarReserva
};
