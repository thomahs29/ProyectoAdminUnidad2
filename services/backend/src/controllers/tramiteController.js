const { getTramites, getTramitesById, createTramite, updateTramite, deleteTramite } = require('../models/tramiteModel');

const obtenerTramites = async (req, res) => {
    try {
        const tramites = await getTramites();
        res.json(tramites);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los trámites' });
    }
};

const obtenerTramitePorId = async (req, res) => {
    try {
        const tramite = await getTramitesById(req.params.id);
        if (tramite) {
            res.json(tramite);
        } else {
            res.status(404).json({ error: 'Trámite no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el trámite' });
    }
};

const crearTramite = async (req, res) => {
    try {
        const { nombre, descripcion, requisitos, duracion_estimada } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const tramite = await createTramite({ nombre, descripcion, requisitos, duracion_estimada });
        res.status(201).json(tramite);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el trámite' });
    }
};

const actualizarTramite = async (req, res) => {
    try {
        const { id } = req.params;
        let { nombre, descripcion, requisitos, duracion_estimada } = req.body;

        const tramiteActual = await getTramitesById(id);
        if (!tramiteActual) {
            return res.status(404).json({ error: 'Trámite no encontrado' });
        }

        if (!nombre) {
            nombre = tramiteActual.nombre;
        }

        if (!descripcion) {
            descripcion = tramiteActual.descripcion;
        }

        if (!requisitos) {
            requisitos = tramiteActual.requisitos;
        }

        if (!duracion_estimada) {
            duracion_estimada = tramiteActual.duracion_estimada;
        }

        const tramite = await updateTramite(id, { nombre, descripcion, requisitos, duracion_estimada });
        if (tramite) {
            res.json(tramite);
        } else {
            res.status(404).json({ error: 'Trámite no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el trámite' });
    }
};

const eliminarTramite = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await deleteTramite(id);
        if (eliminado) {
            res.json({ message: 'Trámite eliminado' });
        } else {
            res.status(404).json({ error: 'Trámite no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el trámite' });
    }
};

module.exports = {
    obtenerTramites,
    obtenerTramitePorId,
    crearTramite,
    actualizarTramite,
    eliminarTramite
};