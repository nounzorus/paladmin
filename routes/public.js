const express = require("express");
const whitelist = require("../services/whitelist");
const whitelistRequests = require("../services/whitelistRequests");
const auditLog = require("../services/auditLog");
const webhooks = require("../services/webhooks");
const { resolveServer } = require("../middleware/resolveServer");

const router = express.Router({ mergeParams: true });

router.use(resolveServer);

router.get("/", (req, res) => {
  res.json({ name: req.serverRow.name });
});

router.post("/whitelist-requests", (req, res) => {
  // Honeypot: real users never fill this hidden field. Pretend success without persisting anything.
  if (req.body?.website) return res.status(201).json({ ok: true });

  if (whitelistRequests.rateLimited(req.ip)) {
    return res.status(429).json({ error: "WHITELIST_REQUEST_RATE_LIMITED" });
  }

  const userid = String(req.body?.userid || "").trim();
  if (!userid) return res.status(400).json({ error: "USERID_REQUIRED" });
  const name = req.body?.name ? String(req.body.name).trim().slice(0, 100) : null;
  const message = req.body?.message ? String(req.body.message).trim().slice(0, 500) : null;

  if (whitelist.isWhitelisted(req.serverRow.id, userid)) {
    return res.status(409).json({ error: "WHITELIST_ALREADY_EXISTS" });
  }
  if (whitelistRequests.hasPending(req.serverRow.id, userid)) {
    return res.status(409).json({ error: "WHITELIST_REQUEST_ALREADY_PENDING" });
  }

  const row = whitelistRequests.submit(req.serverRow.id, { userid, name, message }, req.ip);

  auditLog.record(
    { user: { userId: null, username: "public" }, serverRow: req.serverRow, ip: req.ip },
    { action: "whitelist_request.submit", target: userid, detail: { name, message } }
  );
  webhooks.fireEvent("whitelist_request_submitted", {
    serverId: req.serverRow.id,
    message: `📝 New whitelist request for **${req.serverRow.name}**: **${name || userid}** (${userid}).`,
  });

  res.status(201).json(row);
});

module.exports = router;
