const express = require("express");
const { issueToken, revokeToken, requireAuth, loginAllowed, recordFailure, clearFailures } = require("../middleware/auth");
const users = require("../services/users");
const { verifyPassword } = require("../services/passwords");

const router = express.Router();

router.post("/login", async (req, res) => {
  const ip = req.ip;
  if (!loginAllowed(ip)) {
    return res.status(429).json({ error: "LOGIN_RATE_LIMITED" });
  }
  const { username, password } = req.body || {};
  const user = typeof username === "string" ? users.getByUsername(username) : null;
  const ok =
    user &&
    !user.disabled &&
    typeof password === "string" &&
    (await verifyPassword(password, user.password_hash));
  if (!ok) {
    recordFailure(ip);
    return res.status(401).json({ error: "LOGIN_INVALID_CREDENTIALS" });
  }
  clearFailures(ip);
  res.json({ token: issueToken(user), username: user.username, role: user.role });
});

router.post("/logout", (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  revokeToken(token);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

module.exports = router;
