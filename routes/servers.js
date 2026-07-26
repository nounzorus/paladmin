const express = require("express");
const servers = require("../services/servers");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(servers.listForUser(req.user).map(servers.toPublic));
});

router.get("/:id", (req, res) => {
  if (!servers.userHasAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "SERVER_ACCESS_DENIED" });
  }
  const row = servers.getById(req.params.id);
  if (!row) return res.status(404).json({ error: "SERVER_NOT_FOUND" });
  res.json(servers.toPublic(row));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, host, apiPort, adminPassword, rconEnabled, rconPort } = req.body || {};
  if (!name || !host || !adminPassword) {
    return res.status(400).json({ error: "SERVER_FIELDS_REQUIRED" });
  }
  const row = servers.create({ name, host, apiPort, adminPassword, rconEnabled, rconPort });
  auditLog.record(req, { action: "server.create", target: row.name, detail: { host, apiPort } });
  res.status(201).json(servers.toPublic(row));
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const { name, host, apiPort, adminPassword, rconEnabled, rconPort } = req.body || {};
  const row = servers.update(req.params.id, { name, host, apiPort, adminPassword, rconEnabled, rconPort });
  if (!row) return res.status(404).json({ error: "SERVER_NOT_FOUND" });
  auditLog.record(req, { action: "server.update", target: row.name });
  res.json(servers.toPublic(row));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  const row = servers.getById(req.params.id);
  const ok = servers.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "SERVER_NOT_FOUND" });
  auditLog.record(req, { action: "server.delete", target: row?.name });
  res.json({ ok: true });
});

module.exports = router;
