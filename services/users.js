const db = require("../db");
const { hashPassword } = require("./passwords");

function toPublic(row) {
  if (!row) return null;
  const { password_hash, ...pub } = row;
  return pub;
}

function list() {
  return db.prepare("SELECT * FROM users ORDER BY username").all().map(toPublic);
}

function getById(id) {
  return db.prepare("SELECT * FROM users WHERE id = $id").get({ $id: id });
}

function getByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = $username").get({ $username: username });
}

function count() {
  return db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
}

async function create({ username, password, role }) {
  const password_hash = await hashPassword(password);
  const info = db
    .prepare("INSERT INTO users (username, password_hash, role) VALUES ($username, $password_hash, $role)")
    .run({ $username: username, $password_hash: password_hash, $role: role });
  return getById(info.lastInsertRowid);
}

async function update(id, { role, disabled, password }) {
  const existing = getById(id);
  if (!existing) return null;
  const password_hash = password ? await hashPassword(password) : existing.password_hash;
  db.prepare(
    "UPDATE users SET role = $role, disabled = $disabled, password_hash = $password_hash WHERE id = $id"
  ).run({
    $id: id,
    $role: role ?? existing.role,
    $disabled: disabled === undefined ? existing.disabled : (disabled ? 1 : 0),
    $password_hash: password_hash,
  });
  return getById(id);
}

function remove(id) {
  const info = db.prepare("DELETE FROM users WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

function setServerAssignments(userId, serverIds) {
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM user_servers WHERE user_id = $userId").run({ $userId: userId });
    const insert = db.prepare("INSERT INTO user_servers (user_id, server_id) VALUES ($userId, $serverId)");
    for (const serverId of serverIds) insert.run({ $userId: userId, $serverId: serverId });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function getServerAssignments(userId) {
  return db
    .prepare("SELECT server_id FROM user_servers WHERE user_id = $userId")
    .all({ $userId: userId })
    .map((r) => r.server_id);
}

module.exports = {
  toPublic,
  list,
  getById,
  getByUsername,
  count,
  create,
  update,
  remove,
  setServerAssignments,
  getServerAssignments,
};
