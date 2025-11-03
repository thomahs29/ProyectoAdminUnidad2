const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../config/upload');

const { uploadDocumento, getDocumentos, downloadDocumento} = require('../controllers/documentoController');

const router = express.Router();

router.post("/upload", verifyToken, upload.single('documento'), uploadDocumento);
router.get("/reserva/:reserva_id", verifyToken, getDocumentos);
router.get("/download/:nombre", verifyToken, downloadDocumento);

module.exports = router;