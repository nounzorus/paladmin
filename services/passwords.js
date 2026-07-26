/**
 * Hachage de mot de passe — crypto.scrypt (stdlib, pas de dépendance supplémentaire)
 * Format stocké : scrypt:<saltHex>:<hashHex>
 */
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LEN = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LEN);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || "").split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(password, salt, expected.length);
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

module.exports = { hashPassword, verifyPassword };
