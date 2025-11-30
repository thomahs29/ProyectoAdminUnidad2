const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const db = require('./config/db');
const userRoutes = require("./routes/userRoutes.js");
const reservaRoutes = require("./routes/reservaRoutes.js");
const tramiteRoutes = require("./routes/tramiteRoutes.js");
const testRoutes = require("./routes/testRoutes.js");
const documentoRoutes = require("./routes/documentoRoutes.js");
const notificacionRoutes = require("./routes/notificacionRoutes.js");
const municipalesRoutes = require("./routes/municipalesRoutes.js");
const reporteRoutes = require("./routes/reporteRoutes.js");
const auditMiddleware = require("./middleware/auditMiddleware.js");
const { inicializarDatos } = require("./models/municipalesModel.js");

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware para logs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Rutas públicas (sin auditoría)
app.use('/api/reservas', reservaRoutes);
app.use('/api/tramites', tramiteRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/documentos', documentoRoutes);

// Rutas sensibles (con auditoría)
app.use('/api/users', auditMiddleware, userRoutes);
app.use('/api/notificaciones', auditMiddleware, notificacionRoutes);
app.use('/api/municipales', auditMiddleware, municipalesRoutes);
app.use('/api/reportes', auditMiddleware, reporteRoutes);

// Middleware de error global
app.use((err, req, res, next) => {
    console.error('[ERROR GLOBAL]', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    db.testDBConnection();
    inicializarDatos();
});