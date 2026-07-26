const express = require("express");
const whitelistRequests = require("../services/whitelistRequests");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json(whitelistRequests.list(req.params.serverId, req.query.status));
});

router.post("/:id/approve", requireRole("admin", "moderator"), (req, res) => {
  const row = whitelistRequests.approve(req.params.id, req.user);
  if (!row) return res.status(404).json({ error: "WHITELIST_REQUEST_NOT_FOUND" });
  auditLog.record(req, { action: "whitelist_request.approve", target: row.player_userid });
  res.json(row);
});

router.post("/:id/reject", requireRole("admin", "moderator"), (req, res) => {
  const row = whitelistRequests.reject(req.params.id, req.user);
  if (!row) return res.status(404).json({ error: "WHITELIST_REQUEST_NOT_FOUND" });
  auditLog.record(req, { action: "whitelist_request.reject", target: row.player_userid });
  res.json(row);
});

router.delete("/:id", requireRole("admin", "moderator"), (req, res) => {
  const ok = whitelistRequests.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "WHITELIST_REQUEST_NOT_FOUND" });
  auditLog.record(req, { action: "whitelist_request.delete", target: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
