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

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware para logs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/tramites', tramiteRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/documentos', documentoRoutes);

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
}); 