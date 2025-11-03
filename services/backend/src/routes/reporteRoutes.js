const express = require('express');
const { genReporteReservas, genReporteTramites } = require('../controllers/reporteController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/reservas', verifyToken, verifyRole(['admin', 'funcionario']), genReporteReservas);

router.get('/tramites', verifyToken, verifyRole(['admin', 'funcionario']), genReporteTramites);

module.exports = router;