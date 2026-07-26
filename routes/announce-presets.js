const express = require("express");
const announcePresets = require("../services/announcePresets");
const { requireRole } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json(announcePresets.list(req.params.serverId));
});

router.post("/", requireRole("admin", "moderator"), (req, res) => {
  const label = String(req.body?.label || "").trim().slice(0, 100);
  const message = String(req.body?.message || "").trim().slice(0, 500);
  if (!label || !message) return res.status(400).json({ error: "PRESET_FIELDS_REQUIRED" });
  const row = announcePresets.create({ serverId: req.params.serverId, label, message, user: req.user });
  res.status(201).json(row);
});

router.delete("/:id", requireRole("admin", "moderator"), (req, res) => {
  const ok = announcePresets.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "PRESET_NOT_FOUND" });
  res.json({ ok: true });
});

module.exports = router;
