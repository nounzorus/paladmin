const express = require("express");
const webhooks = require("../services/webhooks");
const auditLog = require("../services/auditLog");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(webhooks.list());
});

router.post("/", (req, res) => {
  const { serverId, url, label, events } = req.body || {};
  if (!url || !Array.isArray(events) || !events.length) {
    return res.status(400).json({ error: "WEBHOOK_FIELDS_REQUIRED" });
  }
  const row = webhooks.create({ serverId: serverId || null, url, label, events, user: req.user });
  auditLog.record(req, { action: "webhook.create", target: row.label || row.url, detail: { events } });
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const { url, label, events, enabled } = req.body || {};
  const row = webhooks.update(req.params.id, { url, label, events, enabled });
  if (!row) return res.status(404).json({ error: "WEBHOOK_NOT_FOUND" });
  auditLog.record(req, { action: "webhook.update", target: row.label || row.url });
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const row = webhooks.getById(req.params.id);
  const ok = webhooks.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "WEBHOOK_NOT_FOUND" });
  auditLog.record(req, { action: "webhook.delete", target: row?.label || row?.url });
  res.json({ ok: true });
});

router.post("/:id/test", async (req, res) => {
  const webhook = webhooks.getById(req.params.id);
  if (!webhook) return res.status(404).json({ error: "WEBHOOK_NOT_FOUND" });
  try {
    const ok = await webhooks.sendTest(webhook);
    if (!ok) return res.status(502).json({ error: "WEBHOOK_TEST_REJECTED" });
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: "WEBHOOK_TEST_ERROR", params: { message: e.message } });
  }
});

module.exports = router;
