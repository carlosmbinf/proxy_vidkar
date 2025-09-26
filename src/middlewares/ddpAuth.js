const { callMethod } = require('../services/ddpClient');

// Cache simple en memoria para tokens emitidos tras login
const sessions = new Map(); // token -> { userId, username, expiresAt }
const TOKEN_TTL = Number(process.env.PROXY_TOKEN_TTL_SECONDS || 3600); // segundos
const LOGIN_METHOD = process.env.DDP_LOGIN_METHOD || 'validateUserCredentials';

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function loginHandler(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }
  try {
    // Esperamos que el método Meteor devuelva algo como { success: true, userId }
    const result = await callMethod(LOGIN_METHOD, { username, password });
    if (!result || result.success !== true) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_TTL * 1000;
    sessions.set(token, { userId: result.userId, username, expiresAt });
    return res.json({ token, expiresAt });
  } catch (err) {
    console.error('[AUTH] Error login:', err.message || err);
    return res.status(500).json({ error: 'Error autenticando contra Meteor' });
  }
}

function authMiddleware(req, res, next) {
  if (process.env.PROXY_REQUIRE_AUTH === 'false') return next();
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Token inválido' });
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Token expirado' });
  }
  req.session = session;
  return next();
}

module.exports = {
  loginHandler,
  authMiddleware,
  _sessions: sessions // export para posibles tests
};
