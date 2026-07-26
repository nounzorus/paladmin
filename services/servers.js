const db = require("../db");

function toPublic(row) {
  if (!row) return null;
  const { admin_password, ...pub } = row;
  return pub;
}

// Config utilisable par palworldClient/rconClient (host/ports/mot de passe)
function toClientConfig(row) {
  if (!row) return null;
  return {
    host: row.host,
    apiPort: row.api_port,
    adminPassword: row.admin_password,
    rconEnabled: !!row.rcon_enabled,
    rconPort: row.rcon_port,
  };
}

function list() {
  return db.prepare("SELECT * FROM servers ORDER BY name").all();
}

function listForUser(user) {
  if (user.role === "admin") return list();
  return db
    .prepare(
      `SELECT s.* FROM servers s
       JOIN user_servers us ON us.server_id = s.id
       WHERE us.user_id = $userId
       ORDER BY s.name`
    )
    .all({ $userId: user.userId });
}

function getById(id) {
  return db.prepare("SELECT * FROM servers WHERE id = $id").get({ $id: id });
}

function userHasAccess(user, serverId) {
  if (user.role === "admin") return true;
  const row = db
    .prepare("SELECT 1 FROM user_servers WHERE user_id = $userId AND server_id = $serverId")
    .get({ $userId: user.userId, $serverId: serverId });
  return !!row;
}

function create({ name, host, apiPort, adminPassword, rconEnabled, rconPort }) {
  const info = db
    .prepare(
      `INSERT INTO servers (name, host, api_port, admin_password, rcon_enabled, rcon_port)
       VALUES ($name, $host, $apiPort, $adminPassword, $rconEnabled, $rconPort)`
    )
    .run({
      $name: name,
      $host: host,
      $apiPort: apiPort || 8212,
      $adminPassword: adminPassword,
      $rconEnabled: rconEnabled ? 1 : 0,
      $rconPort: rconPort || 25575,
    });
  return getById(info.lastInsertRowid);
}

function update(id, { name, host, apiPort, adminPassword, rconEnabled, rconPort }) {
  const existing = getById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE servers SET
       name = $name, host = $host, api_port = $apiPort, admin_password = $adminPassword,
       rcon_enabled = $rconEnabled, rcon_port = $rconPort, updated_at = datetime('now')
     WHERE id = $id`
  ).run({
    $id: id,
    $name: name ?? existing.name,
    $host: host ?? existing.host,
    $apiPort: apiPort ?? existing.api_port,
    $adminPassword: adminPassword || existing.admin_password,
    $rconEnabled: rconEnabled === undefined ? existing.rcon_enabled : (rconEnabled ? 1 : 0),
    $rconPort: rconPort ?? existing.rcon_port,
  });
  return getById(id);
}

function remove(id) {
  const info = db.prepare("DELETE FROM servers WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

module.exports = { toPublic, toClientConfig, list, listForUser, getById, userHasAccess, create, update, remove };
