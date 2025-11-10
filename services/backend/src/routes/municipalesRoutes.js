const express = require('express');
const { consultarPorRUT, generarDatos } = require('../controllers/municipalesController');

const router = express.Router();

/**
 * GET /api/municipales/consultar?rut=XX.XXX.XXX-X
 * Consultar datos municipales por RUT (sin autenticación requerida)
 */
router.get('/consultar', consultarPorRUT);

/**
 * POST /api/municipales/generar-datos
 * Generar datos de prueba para un RUT
 * Body: { rut: "XX.XXX.XXX-X", nombre?: "Nombre" }
 */
router.post('/generar-datos', generarDatos);

module.exports = router;
