const { createReserva, getReservasByUsuario, getReservas, anularReserva } = require('../models/reservaModel');

const reservar = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const { tramite_id, fecha, hora, observaciones } = req.body;

        if (!tramite_id || !fecha || !hora) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const reserva = await createReserva({ usuario_id, tramite_id, fecha, hora, observaciones });
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

        res.status(200).json({
            message: 'Reserva cancelada correctamente',
            reserva,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cancelar la reserva' });
    }
};

module.exports = {
    reservar,
    obtenerReservas,
    obtenerTodasLasReservas,
    cancelarReserva
};
