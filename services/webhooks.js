const db = require("../db");

function list() {
  return db.prepare("SELECT * FROM webhooks ORDER BY id").all();
}

function getById(id) {
  return db.prepare("SELECT * FROM webhooks WHERE id = $id").get({ $id: id });
}

function create({ serverId, url, label, events, user }) {
  const info = db
    .prepare(
      `INSERT INTO webhooks (server_id, url, label, events, created_by)
       VALUES ($serverId, $url, $label, $events, $userId)`
    )
    .run({
      $serverId: serverId ?? null,
      $url: url,
      $label: label || null,
      $events: JSON.stringify(events || []),
      $userId: user.userId,
    });
  return getById(info.lastInsertRowid);
}

function update(id, { url, label, events, enabled }) {
  const existing = getById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE webhooks SET url = $url, label = $label, events = $events, enabled = $enabled, updated_at = datetime('now')
     WHERE id = $id`
  ).run({
    $id: id,
    $url: url ?? existing.url,
    $label: label !== undefined ? label : existing.label,
    $events: events !== undefined ? JSON.stringify(events) : existing.events,
    $enabled: enabled === undefined ? existing.enabled : (enabled ? 1 : 0),
  });
  return getById(id);
}

function remove(id) {
  const info = db.prepare("DELETE FROM webhooks WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

function markFired(id, status) {
  db.prepare("UPDATE webhooks SET last_fired_at = datetime('now'), last_status = $status WHERE id = $id")
    .run({ $id: id, $status: status });
}

async function postDiscord(url, content) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal: AbortSignal.timeout(10_000),
  });
  return r.ok;
}

// Ne rejette jamais — appelée en fire-and-forget depuis les routes/services appelants.
// last_status stocke un code stable (traduit côté frontend), pas une phrase.
async function fireEvent(eventKey, { serverId, message }) {
  try {
    const rows = db
      .prepare("SELECT * FROM webhooks WHERE enabled = 1 AND (server_id IS NULL OR server_id = $serverId)")
      .all({ $serverId: serverId });
    for (const row of rows) {
      let events = [];
      try { events = JSON.parse(row.events); } catch { /* ignore */ }
      if (!events.includes(eventKey)) continue;
      try {
        const ok = await postDiscord(row.url, message);
        markFired(row.id, ok ? "WEBHOOK_OK" : "WEBHOOK_HTTP_ERROR");
      } catch (e) {
        markFired(row.id, "WEBHOOK_ERROR");
      }
    }
  } catch (e) {
    console.error(`[webhooks] fireEvent(${eventKey}) failed:`, e.message);
  }
}

async function sendTest(webhook) {
  try {
    const ok = await postDiscord(webhook.url, `Test message from Palworld Admin Panel — webhook "${webhook.label || webhook.id}" is configured correctly.`);
    markFired(webhook.id, ok ? "WEBHOOK_OK" : "WEBHOOK_HTTP_ERROR");
    return ok;
  } catch (e) {
    markFired(webhook.id, "WEBHOOK_ERROR");
    throw e;
  }
}

module.exports = { list, getById, create, update, remove, fireEvent, sendTest };
