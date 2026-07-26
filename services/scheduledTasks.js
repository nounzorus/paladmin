const cron = require("node-cron");
const db = require("../db");
const servers = require("./servers");
const { palRequest } = require("./palworldClient");
const auditLog = require("./auditLog");
const webhooks = require("./webhooks");

const activeJobs = new Map(); // taskId -> node-cron Task[]

function list(serverId) {
  return db.prepare("SELECT * FROM scheduled_tasks WHERE server_id = $serverId ORDER BY id").all({ $serverId: serverId });
}

function getById(id) {
  return db.prepare("SELECT * FROM scheduled_tasks WHERE id = $id").get({ $id: id });
}

// Cron "simple" à 5 champs avec minute/heure numériques fixes — nécessaire pour
// calculer l'heure des rappels d'avant-redémarrage par simple soustraction.
function parseSimpleCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, mon, dow] = parts;
  if (!/^\d+$/.test(min) || !/^\d+$/.test(hour)) return null;
  const minute = parseInt(min, 10), h = parseInt(hour, 10);
  if (minute > 59 || h > 23) return null;
  return { minute, hour: h, dom, mon, dow };
}

function computeWarningCron(baseCronExpression, offsetMinutes) {
  const parsed = parseSimpleCron(baseCronExpression);
  if (!parsed) {
    throw Object.assign(new Error("WARNING_REQUIRES_SIMPLE_CRON"), {});
  }
  const total = parsed.hour * 60 + parsed.minute - offsetMinutes;
  if (total < 0) {
    throw Object.assign(new Error("WARNING_CROSSES_MIDNIGHT"), { params: { offset: offsetMinutes } });
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${m} ${h} ${parsed.dom} ${parsed.mon} ${parsed.dow}`;
}

// Retourne null si valide, sinon { error: CODE, params? }
function validate({ type, cronExpression, restartWarnings }) {
  if (!["auto_save", "restart"].includes(type)) return { error: "TASK_TYPE_INVALID" };
  if (!cron.validate(cronExpression)) return { error: "CRON_INVALID" };
  if (type === "restart" && Array.isArray(restartWarnings) && restartWarnings.length) {
    for (const offset of restartWarnings) {
      try { computeWarningCron(cronExpression, offset); }
      catch (e) { return { error: e.message, params: e.params }; }
    }
  }
  return null;
}

function create({ serverId, type, cronExpression, restartWarnings, restartMessage, user }) {
  const info = db
    .prepare(
      `INSERT INTO scheduled_tasks (server_id, type, cron_expression, restart_warnings, restart_message, created_by)
       VALUES ($serverId, $type, $cronExpression, $restartWarnings, $restartMessage, $userId)`
    )
    .run({
      $serverId: serverId,
      $type: type,
      $cronExpression: cronExpression,
      $restartWarnings: restartWarnings ? JSON.stringify(restartWarnings) : null,
      $restartMessage: restartMessage || null,
      $userId: user.userId,
    });
  return getById(info.lastInsertRowid);
}

function update(id, { cronExpression, restartWarnings, restartMessage, enabled }) {
  const existing = getById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE scheduled_tasks SET
       cron_expression = $cronExpression, restart_warnings = $restartWarnings,
       restart_message = $restartMessage, enabled = $enabled, updated_at = datetime('now')
     WHERE id = $id`
  ).run({
    $id: id,
    $cronExpression: cronExpression ?? existing.cron_expression,
    $restartWarnings: restartWarnings !== undefined ? (restartWarnings ? JSON.stringify(restartWarnings) : null) : existing.restart_warnings,
    $restartMessage: restartMessage !== undefined ? restartMessage : existing.restart_message,
    $enabled: enabled === undefined ? existing.enabled : (enabled ? 1 : 0),
  });
  return getById(id);
}

function remove(id) {
  const info = db.prepare("DELETE FROM scheduled_tasks WHERE id = $id").run({ $id: id });
  return info.changes > 0;
}

function markLastRun(id) {
  db.prepare("UPDATE scheduled_tasks SET last_run_at = datetime('now') WHERE id = $id").run({ $id: id });
}

function recordSystemAudit(server, action, target, detail) {
  auditLog.record(
    { user: { userId: null, username: "scheduler" }, serverRow: server, ip: null },
    { action, target, detail }
  );
}

async function runAutoSave(task) {
  const server = servers.getById(task.server_id);
  if (!server) return;
  try {
    await palRequest(servers.toClientConfig(server), "POST", "save");
    recordSystemAudit(server, "task.run", "auto_save", { taskId: task.id });
    markLastRun(task.id);
  } catch (e) {
    console.error(`[scheduler] auto_save failed (server ${server.id}, task ${task.id}):`, e.message);
  }
}

async function runRestart(task) {
  const server = servers.getById(task.server_id);
  if (!server) return;
  try {
    await palRequest(servers.toClientConfig(server), "POST", "shutdown", { waittime: 60, message: "Scheduled restart" });
    recordSystemAudit(server, "task.run", "restart", { taskId: task.id });
    markLastRun(task.id);
  } catch (e) {
    console.error(`[scheduler] restart failed (server ${server.id}, task ${task.id}):`, e.message);
  }
}

async function runWarning(task, offsetMinutes) {
  const server = servers.getById(task.server_id);
  if (!server) return;
  const message = (task.restart_message || "Server restarting in {minutes} minutes.").replace("{minutes}", offsetMinutes);
  try {
    await palRequest(servers.toClientConfig(server), "POST", "announce", { message });
    recordSystemAudit(server, "task.warning", String(offsetMinutes), { taskId: task.id, message });
    webhooks.fireEvent("restart_imminent", { serverId: server.id, message: `⏰ **${server.name}** — ${message}` });
  } catch (e) {
    console.error(`[scheduler] warning failed (server ${server.id}, task ${task.id}):`, e.message);
  }
}

function unregisterTask(taskId) {
  const jobs = activeJobs.get(taskId);
  if (jobs) { jobs.forEach((j) => j.stop()); activeJobs.delete(taskId); }
}

function registerTask(task) {
  unregisterTask(task.id);
  if (!task.enabled) return;
  const jobs = [];
  if (task.type === "auto_save") {
    jobs.push(cron.schedule(task.cron_expression, () => runAutoSave(task)));
  } else if (task.type === "restart") {
    jobs.push(cron.schedule(task.cron_expression, () => runRestart(task)));
    const warnings = task.restart_warnings ? JSON.parse(task.restart_warnings) : [];
    for (const offset of warnings) {
      try {
        const warningCron = computeWarningCron(task.cron_expression, offset);
        jobs.push(cron.schedule(warningCron, () => runWarning(task, offset)));
      } catch (e) {
        console.error(`[scheduler] warning not registered (task ${task.id}, offset ${offset}):`, e.message);
      }
    }
  }
  activeJobs.set(task.id, jobs);
}

function reloadAll() {
  for (const id of activeJobs.keys()) unregisterTask(id);
  const tasks = db.prepare("SELECT * FROM scheduled_tasks WHERE enabled = 1").all();
  tasks.forEach(registerTask);
}

function initScheduler() {
  reloadAll();
  console.log(`[scheduler] ${activeJobs.size} scheduled task(s) loaded.`);
}

module.exports = { list, getById, validate, create, update, remove, reloadAll, initScheduler };
