const express = require("express");
const { palRequest, palProxy } = require("../services/palworldClient");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");

const router = express.Router({ mergeParams: true });

router.get("/info", palProxy((req) => palRequest(req.server, "GET", "info")));
router.get("/metrics", palProxy((req) => palRequest(req.server, "GET", "metrics")));

router.post("/announce", requireRole("admin", "moderator"), palProxy(async (req) => {
  const message = String(req.body?.message || "").slice(0, 500);
  if (!message) throw Object.assign(new Error("MESSAGE_REQUIRED"), { status: 400 });
  const result = await palRequest(req.server, "POST", "announce", { message });
  auditLog.record(req, { action: "announce", detail: { message } });
  return result;
}));

router.post("/save", requireRole("admin"), palProxy(async (req) => {
  const result = await palRequest(req.server, "POST", "save");
  auditLog.record(req, { action: "save" });
  return result;
}));

router.post("/shutdown", requireRole("admin"), palProxy(async (req) => {
  const waittime = Math.max(1, Math.min(3600, parseInt(req.body?.waittime, 10) || 60));
  const message = String(req.body?.message || `Server shutting down in ${req.body?.waittime || 60}s`).slice(0, 200);
  const result = await palRequest(req.server, "POST", "shutdown", { waittime, message });
  auditLog.record(req, { action: "shutdown", detail: { waittime, message } });
  return result;
}));

router.post("/stop", requireRole("admin"), palProxy(async (req) => {
  const result = await palRequest(req.server, "POST", "stop");
  auditLog.record(req, { action: "stop" });
  return result;
}));

module.exports = router;
