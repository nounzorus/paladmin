const express = require("express");
const { palRequest, palProxy } = require("../services/palworldClient");
const { requireRole } = require("../middleware/auth");
const auditLog = require("../services/auditLog");
const bans = require("../services/bans");
const webhooks = require("../services/webhooks");

const router = express.Router({ mergeParams: true });

router.get("/", palProxy((req) => palRequest(req.server, "GET", "players")));

router.get("/bans", (req, res) => {
  res.json(bans.listActiveBans(req.serverRow.id));
});

router.post("/kick", requireRole("admin", "moderator"), palProxy(async (req) => {
  const { userid, message } = req.body || {};
  if (!userid) throw Object.assign(new Error("USERID_REQUIRED"), { status: 400 });
  const result = await palRequest(req.server, "POST", "kick", { userid, message: message || "Kicked by an administrator" });
  auditLog.record(req, { action: "kick", target: userid, detail: { message } });
  return result;
}));

router.post("/ban", requireRole("admin", "moderator"), palProxy(async (req) => {
  const { userid, message } = req.body || {};
  if (!userid) throw Object.assign(new Error("USERID_REQUIRED"), { status: 400 });
  const result = await palRequest(req.server, "POST", "ban", { userid, message: message || "Banned by an administrator" });
  auditLog.record(req, { action: "ban", target: userid, detail: { message } });
  webhooks.fireEvent("ban_issued", {
    serverId: req.serverRow.id,
    message: `🚫 **${userid}** banned on **${req.serverRow.name}** by ${req.user.username}.`,
  });
  return result;
}));

router.post("/unban", requireRole("admin", "moderator"), palProxy(async (req) => {
  const { userid } = req.body || {};
  if (!userid) throw Object.assign(new Error("USERID_REQUIRED"), { status: 400 });
  const result = await palRequest(req.server, "POST", "unban", { userid });
  auditLog.record(req, { action: "unban", target: userid });
  return result;
}));

module.exports = router;
