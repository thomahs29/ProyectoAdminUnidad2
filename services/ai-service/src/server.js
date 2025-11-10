const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const aiRoutes = require('./routes/aiRoutes');
const { verifyToken } = require('./middleware/authMiddleware');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'AI Service running', 
    timestamp: new Date().toISOString() 
  });
});

// Endpoint de diagnóstico (sin autenticación)
app.get('/api/ai/test', (req, res) => {
  console.log('✅ Test endpoint llamado - Servicio responde correctamente');
  res.status(200).json({ 
    message: '✅ AI Service conectado correctamente',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    port: PORT
  });
});

// Middleware para logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas protegidas de IA
app.use('/api/ai', verifyToken, aiRoutes);

// Middleware de error global
app.use((err, req, res, next) => {
  console.error('[ERROR GLOBAL]', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
});

module.exports = app;
