const db = require("../db");

function list(serverId, playerUserid) {
  return db
    .prepare(
      `SELECT * FROM player_notes WHERE server_id = $serverId AND player_userid = $playerUserid
       ORDER BY created_at DESC`
    )
    .all({ $serverId: serverId, $playerUserid: playerUserid });
}

function create(serverId, playerUserid, note, user) {
  const info = db
    .prepare(
      `INSERT INTO player_notes (server_id, player_userid, note, created_by, created_by_username)
       VALUES ($serverId, $playerUserid, $note, $userId, $username)`
    )
    .run({
      $serverId: serverId,
      $playerUserid: playerUserid,
      $note: note,
      $userId: user.userId,
      $username: user.username,
    });
  return db.prepare("SELECT * FROM player_notes WHERE id = $id").get({ $id: info.lastInsertRowid });
}

function remove(id) {
  const info = db.prepare("DELETE FROM player_notes WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

module.exports = { list, create, remove };
