const express = require('express');
const { obtenerTramites, obtenerTramitePorId, crearTramite, actualizarTramite, eliminarTramite } = require('../controllers/tramiteController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, obtenerTramites);
router.get('/:id', verifyToken, obtenerTramitePorId);

router.post('/create', verifyToken, verifyRole(['admin']), crearTramite);
router.put('/update/:id', verifyToken, verifyRole(['admin']), actualizarTramite);
router.delete('/delete/:id', verifyToken, verifyRole(['admin']), eliminarTramite);

module.exports = router;