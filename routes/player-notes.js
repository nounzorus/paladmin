const express = require("express");
const playerNotes = require("../services/playerNotes");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json(playerNotes.list(req.params.serverId, req.params.userid));
});

router.post("/", requireRole("admin", "moderator"), (req, res) => {
  const note = String(req.body?.note || "").trim().slice(0, 1000);
  if (!note) return res.status(400).json({ error: "NOTE_REQUIRED" });
  const row = playerNotes.create(req.params.serverId, req.params.userid, note, req.user);
  auditLog.record(req, { action: "player_note.create", target: req.params.userid, detail: { note } });
  res.status(201).json(row);
});

router.delete("/:noteId", requireRole("admin", "moderator"), (req, res) => {
  const ok = playerNotes.remove(req.params.noteId);
  if (!ok) return res.status(404).json({ error: "NOTE_NOT_FOUND" });
  auditLog.record(req, { action: "player_note.delete", target: req.params.userid });
  res.json({ ok: true });
});

module.exports = router;
