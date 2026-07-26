const db = require("../db");

/**
 * Enregistre une action dans le journal d'audit.
 * req.user est toujours présent (routes montées derrière requireAuth).
 * req.serverRow est présent pour les actions liées à un serveur, absent pour
 * les actions globales (gestion des utilisateurs/serveurs eux-mêmes).
 */
function record(req, { action, target, detail }) {
  db.prepare(
    `INSERT INTO audit_log (user_id, username, server_id, server_name, action, target, detail, ip)
     VALUES ($userId, $username, $serverId, $serverName, $action, $target, $detail, $ip)`
  ).run({
    $userId: req.user.userId,
    $username: req.user.username,
    $serverId: req.serverRow ? req.serverRow.id : null,
    $serverName: req.serverRow ? req.serverRow.name : null,
    $action: action,
    $target: target ?? null,
    $detail: detail ? JSON.stringify(detail) : null,
    $ip: req.ip ?? null,
  });
}

function list({ serverId, userId, action, limit, offset } = {}) {
  const clauses = [];
  const params = {};
  if (serverId) { clauses.push("server_id = $serverId"); params.$serverId = serverId; }
  if (userId) { clauses.push("user_id = $userId"); params.$userId = userId; }
  if (action) { clauses.push("action = $action"); params.$action = action; }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const off = Math.max(0, parseInt(offset, 10) || 0);
  const rows = db
    .prepare(`SELECT * FROM audit_log ${where} ORDER BY created_at DESC, id DESC LIMIT $limit OFFSET $offset`)
    .all({ ...params, $limit: lim, $offset: off });
  const total = db.prepare(`SELECT COUNT(*) AS n FROM audit_log ${where}`).get(params).n;
  return { rows, total, limit: lim, offset: off };
}

module.exports = { record, list };
