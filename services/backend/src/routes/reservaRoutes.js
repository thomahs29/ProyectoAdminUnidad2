const express = require('express');
const { reservar, obtenerReservas, obtenerTodasLasReservas, cancelarReserva } = require('../controllers/reservaController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/reservar', verifyToken, reservar);
router.get('/usuario', verifyToken, obtenerReservas);
router.get('/all', verifyToken, obtenerTodasLasReservas);
router.put('/anular/:id', verifyToken, cancelarReserva);

module.exports = router;
