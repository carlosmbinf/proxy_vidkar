const SimpleDDP = require('simpleddp');
const ws = require('isomorphic-ws');

const endpoint = process.env.DDP_ENDPOINT || 'ws://www.vidkar.com:6000/websocket';
const baseReconnectInterval = Number(process.env.DDP_RECONNECT_INTERVAL || 10000);
const maxReconnectInterval = Number(process.env.DDP_MAX_RECONNECT_INTERVAL || 10000);

let ddp; // singleton
let connecting = false;
let lastError = null;
let lastConnectedAt = null;
let lastDisconnectedAt = null;
let currentReconnectInterval = baseReconnectInterval;

function getStatus() {
  return {
    connected: !!(ddp && ddp.connected),
    endpoint,
    lastConnectedAt,
    lastDisconnectedAt,
    lastError: lastError ? (lastError.message || String(lastError)) : null,
    reconnectInterval: currentReconnectInterval
  };
}

async function connectDDP() {
  if (ddp && ddp.connected) return ddp;
  if (connecting) {
    // Esperar hasta que se resuelva la conexión existente
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (ddp && ddp.connected) {
          clearInterval(interval);
          resolve(ddp);
        }
      }, 250);
    });
  }
  connecting = true;
  console.log('[DDP] Conectando a', endpoint, '...');
  ddp = new SimpleDDP({
    endpoint,
    SocketConstructor: ws,
    reconnectInterval: currentReconnectInterval,
    autoConnect: true,
    autoReconnect: true
  });

  return new Promise((resolve, reject) => {
    ddp.on('connected', () => {
      connecting = false;
      lastConnectedAt = new Date().toISOString();
      currentReconnectInterval = baseReconnectInterval; // reset backoff
      console.log('[DDP] Conectado al servidor Meteor');
      resolve(ddp);
    });

    ddp.on('error', err => {
      lastError = err;
      console.error('[DDP] Error de conexión:', err.message || err);
    });

    ddp.on('disconnected', () => {
      lastDisconnectedAt = new Date().toISOString();
      console.warn('[DDP] Desconectado');
      // Aumentar backoff exponencial simple
      currentReconnectInterval = Math.min(currentReconnectInterval * 2, maxReconnectInterval);
      // Intentar reconectar manualmente si la instancia existe
      if (ddp) {
        setTimeout(() => {
          if (!ddp.connected) {
            console.log('[DDP] Reintentando conexión... intervalo=' + currentReconnectInterval + 'ms');
            ddp.connect();
          }
        }, currentReconnectInterval);
      }
    });

    // Timeout de seguridad
    setTimeout(() => {
      if (!ddp.connected) {
        connecting = false;
        reject(new Error('Timeout conectando a DDP'));
      }
    }, 15000);
  });
}

async function callMethod(method, ...params) {
  const client = await connectDDP();
  return client.call(method, ...params);
}

function ensureDDPStarted() {
  connectDDP().catch(err => {
    console.error('[DDP] No se pudo establecer conexión inicial:', err.message || err);
  });
}

module.exports = {
  connectDDP,
  callMethod,
  ensureDDPStarted,
  getStatus
};
