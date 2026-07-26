const db = require("../db");
const CFG = require("../config");
const servers = require("./servers");
const { palRequest } = require("./palworldClient");
const auditLog = require("./auditLog");
const webhooks = require("./webhooks");

function isEnabled(serverId) {
  const row = db
    .prepare("SELECT enabled FROM whitelist_settings WHERE server_id = $serverId")
    .get({ $serverId: serverId });
  return !!row?.enabled;
}

function setEnabled(serverId, enabled) {
  db.prepare(
    `INSERT INTO whitelist_settings (server_id, enabled, updated_at)
     VALUES ($serverId, $enabled, datetime('now'))
     ON CONFLICT(server_id) DO UPDATE SET enabled = $enabled, updated_at = datetime('now')`
  ).run({ $serverId: serverId, $enabled: enabled ? 1 : 0 });
}

function list(serverId) {
  return db
    .prepare("SELECT * FROM whitelist_entries WHERE server_id = $serverId ORDER BY created_at DESC")
    .all({ $serverId: serverId });
}

function getById(id) {
  return db.prepare("SELECT * FROM whitelist_entries WHERE id = $id").get({ $id: id });
}

function isWhitelisted(serverId, userid) {
  return !!db
    .prepare("SELECT 1 FROM whitelist_entries WHERE server_id = $serverId AND player_userid = $userid")
    .get({ $serverId: serverId, $userid: userid });
}

function add(serverId, userid, label, user) {
  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO whitelist_entries (server_id, player_userid, label, added_by, added_by_username)
         VALUES ($serverId, $userid, $label, $userId, $username)`
      )
      .run({
        $serverId: serverId,
        $userid: userid,
        $label: label,
        $userId: user.userId,
        $username: user.username,
      });
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) throw new Error("WHITELIST_ALREADY_EXISTS");
    throw e;
  }
  return getById(info.lastInsertRowid);
}

function remove(id) {
  const info = db.prepare("DELETE FROM whitelist_entries WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

function recordSystemAudit(server, action, target, detail) {
  auditLog.record(
    { user: { userId: null, username: "whitelist" }, serverRow: server, ip: null },
    { action, target, detail }
  );
}

// The Palworld REST API has no connection filter, so enforcement means polling
// connected players and kicking anyone not on the list — same workaround
// philosophy as bans.js deriving state from the audit log.
function playerUid(p) {
  return p.userId || p.userid || p.playerId || "";
}

async function enforceServer(server) {
  if (!isEnabled(server.id)) return;
  const clientConfig = servers.toClientConfig(server);
  let players;
  try {
    const result = await palRequest(clientConfig, "GET", "players");
    players = result?.players || [];
  } catch {
    return; // unreachable this cycle — try again next poll
  }
  for (const p of players) {
    const uid = playerUid(p);
    if (!uid || isWhitelisted(server.id, uid)) continue;
    try {
      await palRequest(clientConfig, "POST", "kick", { userid: uid, message: "Not on the server whitelist" });
      recordSystemAudit(server, "whitelist.auto_kick", uid, { name: p.name });
      webhooks.fireEvent("whitelist_kick", {
        serverId: server.id,
        message: `🚷 **${p.name || uid}** auto-kicked from **${server.name}** (not on the whitelist).`,
      });
    } catch (e) {
      console.error(`[whitelist] auto-kick failed (server ${server.id}, player ${uid}):`, e.message);
    }
  }
}

async function pollAll() {
  for (const server of servers.list()) {
    await enforceServer(server);
  }
}

function start() {
  pollAll();
  setInterval(pollAll, CFG.whitelistPollIntervalMs).unref();
}

module.exports = { isEnabled, setEnabled, list, getById, add, remove, isWhitelisted, start };
