const express = require("express");
const users = require("../services/users");
const servers = require("../services/servers");
const auditLog = require("../services/auditLog");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(users.list());
});

router.post("/", async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !["admin", "moderator", "viewer"].includes(role)) {
    return res.status(400).json({ error: "USER_FIELDS_REQUIRED" });
  }
  if (users.getByUsername(username)) {
    return res.status(409).json({ error: "USERNAME_TAKEN" });
  }
  const user = await users.create({ username, password, role });
  auditLog.record(req, { action: "user.create", target: user.username, detail: { role } });
  res.status(201).json(users.toPublic(user));
});

router.put("/:id", async (req, res) => {
  const { role, disabled, password } = req.body || {};
  if (role && !["admin", "moderator", "viewer"].includes(role)) {
    return res.status(400).json({ error: "ROLE_INVALID" });
  }
  const user = await users.update(req.params.id, { role, disabled, password });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
  auditLog.record(req, { action: "user.update", target: user.username, detail: { role, disabled, passwordChanged: !!password } });
  res.json(users.toPublic(user));
});

router.delete("/:id", (req, res) => {
  const target = users.getById(req.params.id);
  if (!target) return res.status(404).json({ error: "USER_NOT_FOUND" });
  if (target.role === "admin") {
    const adminCount = users.list().filter((u) => u.role === "admin").length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: "CANNOT_DELETE_LAST_ADMIN" });
    }
  }
  users.remove(req.params.id);
  auditLog.record(req, { action: "user.delete", target: target.username });
  res.json({ ok: true });
});

router.get("/:id/servers", (req, res) => {
  if (!users.getById(req.params.id)) return res.status(404).json({ error: "USER_NOT_FOUND" });
  res.json(users.getServerAssignments(req.params.id));
});

router.put("/:id/servers", (req, res) => {
  const target = users.getById(req.params.id);
  if (!target) return res.status(404).json({ error: "USER_NOT_FOUND" });
  const { serverIds } = req.body || {};
  if (!Array.isArray(serverIds)) return res.status(400).json({ error: "SERVER_IDS_REQUIRED" });
  for (const id of serverIds) {
    if (!servers.getById(id)) return res.status(400).json({ error: "SERVER_ID_NOT_FOUND", params: { id } });
  }
  users.setServerAssignments(req.params.id, serverIds);
  auditLog.record(req, { action: "user.servers.update", target: target.username, detail: { serverIds } });
  res.json({ ok: true });
});

module.exports = router;
