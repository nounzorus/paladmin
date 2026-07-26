const express = require("express");
const whitelist = require("../services/whitelist");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json({
    enabled: whitelist.isEnabled(req.params.serverId),
    entries: whitelist.list(req.params.serverId),
  });
});

router.post("/", requireRole("admin", "moderator"), (req, res) => {
  const userid = String(req.body?.userid || "").trim();
  if (!userid) return res.status(400).json({ error: "USERID_REQUIRED" });
  const label = req.body?.label ? String(req.body.label).trim().slice(0, 200) : null;
  let row;
  try {
    row = whitelist.add(req.params.serverId, userid, label, req.user);
  } catch (e) {
    if (e.message === "WHITELIST_ALREADY_EXISTS") return res.status(409).json({ error: "WHITELIST_ALREADY_EXISTS" });
    throw e;
  }
  auditLog.record(req, { action: "whitelist.add", target: userid, detail: { label } });
  res.status(201).json(row);
});

router.delete("/:id", requireRole("admin", "moderator"), (req, res) => {
  const entry = whitelist.getById(req.params.id);
  const ok = whitelist.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "WHITELIST_ENTRY_NOT_FOUND" });
  auditLog.record(req, { action: "whitelist.remove", target: entry?.player_userid || req.params.id });
  res.json({ ok: true });
});

router.put("/settings", requireRole("admin"), (req, res) => {
  const enabled = !!req.body?.enabled;
  whitelist.setEnabled(req.params.serverId, enabled);
  auditLog.record(req, { action: enabled ? "whitelist.enable" : "whitelist.disable" });
  res.json({ enabled });
});

module.exports = router;
