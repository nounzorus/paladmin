/**
 * Sessions du panel (jetons en mémoire, expirent après 12 h)
 * + anti-bruteforce simple sur le login
 */
const crypto = require("crypto");

const sessions = new Map(); // token -> { expiry, userId, username, role }
const SESSION_TTL = 12 * 60 * 60 * 1000;

function issueToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    expiry: Date.now() + SESSION_TTL,
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return token;
}
function checkToken(token) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiry) { sessions.delete(token); return null; }
  return session;
}
function revokeToken(token) {
  sessions.delete(token);
}
setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) if (now > s.expiry) sessions.delete(t);
}, 60 * 1000).unref();

const loginAttempts = new Map(); // ip -> { count, until }
function loginAllowed(ip) {
  const a = loginAttempts.get(ip);
  if (!a) return true;
  if (a.until && Date.now() < a.until) return false;
  return true;
}
function recordFailure(ip) {
  const a = loginAttempts.get(ip) || { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= 5) { a.until = Date.now() + 5 * 60 * 1000; a.count = 0; }
  loginAttempts.set(ip, a);
}
function clearFailures(ip) {
  loginAttempts.delete(ip);
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const session = checkToken(token);
  if (!session) return res.status(401).json({ error: "SESSION_INVALID" });
  req.user = session;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "ROLE_INSUFFICIENT" });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  issueToken,
  revokeToken,
  loginAllowed,
  recordFailure,
  clearFailures,
};
