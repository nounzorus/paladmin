const db = require("../db");
const CFG = require("../config");
const servers = require("./servers");
const { palRequest } = require("./palworldClient");

const lastOnlineState = new Map(); // serverId -> boolean

// Overridden by server.js to call services/webhooks.js on up/down transitions.
let onTransition = (server, online) => {
  console.log(`[metrics] server ${server.id} (${server.name}) is now ${online ? "online" : "offline"}.`);
};

function setTransitionHook(fn) {
  onTransition = fn;
}

async function pollServer(server) {
  const clientConfig = servers.toClientConfig(server);
  let online = false;
  let metrics = null;
  try {
    metrics = await palRequest(clientConfig, "GET", "metrics");
    online = true;
  } catch {
    online = false;
  }

  db.prepare(
    `INSERT INTO metrics_history (server_id, online, player_count, fps, uptime_seconds, frametime_ms)
     VALUES ($serverId, $online, $playerCount, $fps, $uptime, $frametime)`
  ).run({
    $serverId: server.id,
    $online: online ? 1 : 0,
    $playerCount: metrics?.currentplayernum ?? null,
    $fps: metrics?.serverfps ?? null,
    $uptime: metrics?.uptime ?? null,
    $frametime: metrics?.serverframetime ?? null,
  });

  const wasOnline = lastOnlineState.get(server.id);
  if (wasOnline !== undefined && wasOnline !== online) {
    onTransition(server, online);
  }
  lastOnlineState.set(server.id, online);
}

async function pollAll() {
  for (const server of servers.list()) {
    await pollServer(server);
  }
}

function prune() {
  db.prepare("DELETE FROM metrics_history WHERE captured_at < datetime('now', '-' || $days || ' days')")
    .run({ $days: CFG.metricsRetentionDays });
}

function start() {
  pollAll();
  setInterval(pollAll, CFG.metricsPollIntervalMs).unref();
  setInterval(prune, 60 * 60 * 1000).unref();
}

function history(serverId, { hours } = {}) {
  const h = Math.min(24 * 30, Math.max(1, parseInt(hours, 10) || 24));
  return db
    .prepare(
      `SELECT captured_at, online, player_count, fps, uptime_seconds, frametime_ms
       FROM metrics_history
       WHERE server_id = $serverId AND captured_at >= datetime('now', '-' || $hours || ' hours')
       ORDER BY captured_at`
    )
    .all({ $serverId: serverId, $hours: h });
}

module.exports = { start, history, setTransitionHook };
