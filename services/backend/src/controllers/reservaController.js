const { createReserva, getReservasByUsuario, getReservas, anularReserva } = require('../models/reservaModel');
const { sendEmailAsync, tplReservaAnulada, tplReservaCreada } = require('../services/mailService');
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

const getUserAndTramite = async ({ usuario_id, tramite_id }) => {
  const u = await pool.query(`SELECT nombre, email FROM usuarios WHERE id = $1`, [usuario_id]);
  const t = await pool.query(`SELECT nombre FROM tramites WHERE id = $1`, [tramite_id]);
  return { user: u.rows[0], tramite: t.rows[0] };
};

module.exports = {
    reservar,
    obtenerReservas,
    obtenerTodasLasReservas,
    cancelarReserva
};
