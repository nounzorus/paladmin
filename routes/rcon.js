const express = require("express");
const { rconCommand } = require("../services/rconClient");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.post("/", requireRole("admin"), async (req, res) => {
  if (!req.server.rconEnabled) {
    return res.status(403).json({ error: "RCON_DISABLED" });
  }
  const command = String(req.body?.command || "").trim().slice(0, 300);
  if (!command) return res.status(400).json({ error: "RCON_COMMAND_REQUIRED" });
  try {
    const output = await rconCommand(req.server, command);
    auditLog.record(req, { action: "rcon", detail: { command } });
    res.json({ output });
  } catch (e) {
    res.status(502).json({ error: e.message, params: e.params });
  }
});

module.exports = router;
