const express = require("express");
const scheduledTasks = require("../services/scheduledTasks");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json(scheduledTasks.list(req.params.serverId));
});

router.post("/", (req, res) => {
  const { type, cronExpression, restartWarnings, restartMessage } = req.body || {};
  const err = scheduledTasks.validate({ type, cronExpression, restartWarnings });
  if (err) return res.status(400).json(err);
  const row = scheduledTasks.create({
    serverId: req.params.serverId, type, cronExpression, restartWarnings, restartMessage, user: req.user,
  });
  scheduledTasks.reloadAll();
  auditLog.record(req, { action: "task.create", target: String(row.id), detail: { type, cronExpression } });
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const existing = scheduledTasks.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: "TASK_NOT_FOUND" });
  const { cronExpression, restartWarnings, restartMessage, enabled } = req.body || {};
  const err = scheduledTasks.validate({
    type: existing.type,
    cronExpression: cronExpression ?? existing.cron_expression,
    restartWarnings: restartWarnings !== undefined ? restartWarnings : (existing.restart_warnings ? JSON.parse(existing.restart_warnings) : undefined),
  });
  if (err) return res.status(400).json(err);
  const row = scheduledTasks.update(req.params.id, { cronExpression, restartWarnings, restartMessage, enabled });
  scheduledTasks.reloadAll();
  auditLog.record(req, { action: "task.update", target: String(row.id) });
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const ok = scheduledTasks.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "TASK_NOT_FOUND" });
  scheduledTasks.reloadAll();
  auditLog.record(req, { action: "task.delete", target: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
