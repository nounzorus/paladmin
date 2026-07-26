const express = require("express");
const auditLog = require("../services/auditLog");

const router = express.Router();

router.get("/", (req, res) => {
  const { serverId, userId, action, limit, offset } = req.query;
  res.json(auditLog.list({ serverId, userId, action, limit, offset }));
});

module.exports = router;
