const db = require("../db");
const whitelist = require("./whitelist");

// Public submission spam guard: N requests per IP per window, across all servers.
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const rateLimits = new Map(); // ip -> { count, windowStart }

function rateLimited(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now - entry.windowStart > RATE_WINDOW_MS) rateLimits.delete(ip);
  }
}, 60 * 1000).unref();

function list(serverId, status) {
  if (status) {
    return db
      .prepare("SELECT * FROM whitelist_requests WHERE server_id = $serverId AND status = $status ORDER BY created_at DESC")
      .all({ $serverId: serverId, $status: status });
  }
  return db
    .prepare("SELECT * FROM whitelist_requests WHERE server_id = $serverId ORDER BY created_at DESC")
    .all({ $serverId: serverId });
}

function getById(id) {
  return db.prepare("SELECT * FROM whitelist_requests WHERE id = $id").get({ $id: id });
}

function hasPending(serverId, userid) {
  return !!db
    .prepare("SELECT 1 FROM whitelist_requests WHERE server_id = $serverId AND player_userid = $userid AND status = 'pending'")
    .get({ $serverId: serverId, $userid: userid });
}

function submit(serverId, { userid, name, message }, ip) {
  const info = db
    .prepare(
      `INSERT INTO whitelist_requests (server_id, player_userid, player_name, message, ip)
       VALUES ($serverId, $userid, $name, $message, $ip)`
    )
    .run({
      $serverId: serverId,
      $userid: userid,
      $name: name || null,
      $message: message || null,
      $ip: ip || null,
    });
  return getById(info.lastInsertRowid);
}

function approve(id, user) {
  const row = getById(id);
  if (!row) return null;
  try {
    whitelist.add(row.server_id, row.player_userid, row.player_name, user);
  } catch (e) {
    if (e.message !== "WHITELIST_ALREADY_EXISTS") throw e;
  }
  db.prepare(
    `UPDATE whitelist_requests SET status = 'approved', reviewed_by = $userId, reviewed_by_username = $username, reviewed_at = datetime('now')
     WHERE id = $id`
  ).run({ $id: id, $userId: user.userId, $username: user.username });
  return getById(id);
}

function reject(id, user) {
  const row = getById(id);
  if (!row) return null;
  db.prepare(
    `UPDATE whitelist_requests SET status = 'rejected', reviewed_by = $userId, reviewed_by_username = $username, reviewed_at = datetime('now')
     WHERE id = $id`
  ).run({ $id: id, $userId: user.userId, $username: user.username });
  return getById(id);
}

function remove(id) {
  const info = db.prepare("DELETE FROM whitelist_requests WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

module.exports = { rateLimited, list, getById, hasPending, submit, approve, reject, remove };
