const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rutas externas
const proxyRoutes = require('./routes/proxyRoutes');
// DDP service
const { ensureDDPStarted, getStatus: getDDPStatus } = require('./services/ddpClient');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar rutas proxy/auth
app.use('/api', proxyRoutes);

// Estado DDP
app.get('/ddp/status', (req, res) => {
  res.json(getDDPStatus());
});

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'API Backend funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas (debe ir antes del manejador de errores)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  ensureDDPStarted();
});

module.exports = app;