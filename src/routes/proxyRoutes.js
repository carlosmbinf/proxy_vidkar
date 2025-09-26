const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { loginHandler, authMiddleware } = require('../middlewares/ddpAuth');

const router = express.Router();

// Ruta de login -> devuelve token
router.post('/auth/login', loginHandler);

// Proxy protegido
const target = process.env.PROXY_TARGET || 'https://example.org';

router.use('/proxy', authMiddleware, createProxyMiddleware({
  target,
  changeOrigin: true,
  logLevel: 'warn',
  pathRewrite: (path) => path.replace(/^\/proxy/, ''),
  onProxyReq: (proxyReq, req) => {
    // Opcional: añadir headers con info de usuario autenticado
    if (req.session) {
      proxyReq.setHeader('x-auth-user', req.session.username);
      proxyReq.setHeader('x-auth-user-id', req.session.userId || '');
    }
  }
}));

module.exports = router;
