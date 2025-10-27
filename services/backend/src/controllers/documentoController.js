const { saveDocumento, getDocumentosByReserva } = require('../models/documentoModel');
const path = require('path');
const fs = require('fs');

const uploadDocumento = async (req, res) => {
    try {
        const { reserva_id } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }
        if (!reserva_id) {
            return res.status(400).json({ error: 'Falta el ID de la reserva' });
        }

        const file = req.file;
        const ruta = path.join('uploads', 'documents', file.filename);
        const peso = (file.size / (1024 * 1024)).toFixed(2);

        const doc = await saveDocumento({
            reserva_id,
            nombre_archivo: file.originalname,
            ruta_archivo: ruta,
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

        // Ruta absoluta hacia la carpeta uploads/documentos
        const filePath = path.join(__dirname, "../uploads/documents", nombre);

        // Verificamos si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }

        // Devuelve el archivo al cliente
        res.download(filePath, (err) => {
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