const db = require("../db");

// Un preset est visible sur un serveur s'il est global (server_id NULL) ou spécifique à ce serveur.
function list(serverId) {
  return db
    .prepare(
      `SELECT * FROM announce_presets WHERE server_id IS NULL OR server_id = $serverId
       ORDER BY label`
    )
    .all({ $serverId: serverId });
}

function create({ serverId, label, message, user }) {
  const info = db
    .prepare(
      `INSERT INTO announce_presets (server_id, label, message, created_by)
       VALUES ($serverId, $label, $message, $userId)`
    )
    .run({ $serverId: serverId ?? null, $label: label, $message: message, $userId: user.userId });
  return db.prepare("SELECT * FROM announce_presets WHERE id = $id").get({ $id: info.lastInsertRowid });
}

function remove(id) {
  const info = db.prepare("DELETE FROM announce_presets WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

module.exports = { list, create, remove };
