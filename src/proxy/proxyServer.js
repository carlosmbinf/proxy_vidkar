require('dotenv').config();
const { callMethod } = require('../services/ddpClient');
const ProxyChain = require('proxy-chain');
const bcrypt = require('bcrypt');

// Configuración
const PROXY_PORT = Number(process.env.FORWARD_PROXY_PORT || 3002);
const DDP_USER_METHOD = process.env.DDP_USER_LOOKUP_METHOD || 'validateProxyUser'; // Debe devolver { _id, services: { password: { bcrypt: hash } }, baneado, ip }
const DDP_LOG_CONN_METHOD = process.env.DDP_LOG_CONN_METHOD || "markProxyConnected"; // ej: registrarConexionProxy
const DDP_LOG_DISC_METHOD = process.env.DDP_LOG_DISC_METHOD || "markProxyDisconnected"; // ej: registrarDesconexionProxy
const LIMIT_IP_MATCH = process.env.PROXY_VALIDATE_IP === 'true';

/*
  Flujo de autenticación:
  1. Cliente se conecta al proxy y envía Basic Auth (username, password)
  2. Buscamos user via DDP method DDP_USER_METHOD
  3. Hasheamos password entrante con bcrypt.compareSync
     - Se asume que el método Meteor envía el hash bcrypt estándar en services.password.bcrypt
  4. Validaciones: baneado, ip coincidencia (opcional)
  5. Registrar conexión (opcional) via DDP_LOG_CONN_METHOD
  6. En desconexión registrar consumo si se quisiera (placeholder)
*/

async function validateUser(username, password, hostname, connectionId) {
  try {
    const userAprobado = await callMethod(DDP_USER_METHOD,  username, password, hostname );
    if (!userAprobado) {
      return { auth: false, msg: 'Credenciales inválidas' };
    }

    if (DDP_LOG_CONN_METHOD) {
      try { callMethod(DDP_LOG_CONN_METHOD,  username, connectionId, hostname ); } catch(e) { console.warn('[PROXY] No se pudo registrar conexión:', e.message); }
    }

    return { auth: true, user:username };
  } catch (err) {
    console.error('[PROXY] Error validando usuario:', err.message || err);
    return { auth: false, msg: 'Error interno autenticando' };
  }
}

console.log(`[PROXY] Iniciando forward proxy en puerto ${PROXY_PORT}`);

const server = new ProxyChain.Server({
  port: PROXY_PORT,
  authRealm: 'DDP Proxy Service',
  prepareRequestFunction: async ({ username, password, hostname, connectionId }) => {
    const { auth, msg, user } = await validateUser(username, password, hostname, connectionId);
    if (!auth) {
      return { requestAuthentication: true, failMsg: msg || 'Credenciales inválidas' };
    }
    // Si necesitas forzar upstream proxy, puedes devolver upstreamProxyUrl aquí
    return { requestAuthentication: false };
  }
});

server.listen(() => {
  console.log(`[PROXY] Proxy escuchando en puerto ${PROXY_PORT}`);
});

server.on('connectionClosed', async ({ connectionId, stats }) => {
  // stats: { srcTxBytes, srcRxBytes, trgTxBytes, trgRxBytes }
  if (DDP_LOG_DISC_METHOD) {
    try {
      await callMethod(DDP_LOG_DISC_METHOD, { connectionId, stats });
    } catch (e) {
      console.warn('[PROXY] No se pudo registrar desconexión:', e.message);
    }
  }
});

server.on('requestFailed', ({ request, error }) => {
  console.warn(`[PROXY] Falla en request ${request && request.url}:`, error && error.message);
});

module.exports = server;
