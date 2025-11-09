const { saveDocumento, getDocumentosByReserva } = require('../models/documentoModel');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads', 'documents');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const uploadDocumento = async (req, res) => {
    try {
        const { reserva_id } = req.body;
        const file = req.file;

        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }
        if (!reserva_id) {
            return res.status(400).json({ error: 'Falta el ID de la reserva' });
        }

        const storedFilename = file.filename;
        const ruta = path.posix.join('uploads', 'documents', storedFilename);
        const peso = Number((file.size / (1024 * 1024)).toFixed(2));

        const doc = await saveDocumento({
            reserva_id,
            nombre_archivo: file.originalname,
            ruta_archivo: storedFilename,
            tipo_mime: file.mimetype,
            peso_mb: peso
        });

        res.status(201).json({ message: 'Documento subido exitosamente', doc });
    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ error: 'Error al subir documento' });    
    }
};

const getDocumentos = async (req, res) => {
    try {
        const { reserva_id } = req.params;
        const documentos = await getDocumentosByReserva(reserva_id);
        res.status(200).json(documentos);
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
};

const downloadDocumento = async (req, res) => {
    try {
        const { nombre } = req.params;

        const safeName = path.basename(nombre);
        const filePath = path.join(UPLOADS_DIR, safeName);
        
        console.log('requested filename:', nombre);
        console.log('safe filename:', safeName);
        console.log("Intentando descargar archivo:", filePath);

        // Verificamos si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }

        // Devuelve el archivo al cliente
        res.download(filePath, safeName, (err) => {
            if (err) {
                console.error("Error al enviar archivo:", err.message);
                res.status(500).json({ error: "Error al descargar el archivo" });
            }
        });
    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ error: 'Error al descargar documento' });
    }
};

module.exports = {
    uploadDocumento,
    getDocumentos,
    downloadDocumento
};