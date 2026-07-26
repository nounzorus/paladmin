const CFG = require("../config");
const users = require("../services/users");

async function bootstrapAdmin() {
  if (users.count() > 0) return;
  await users.create({
    username: CFG.adminBootstrapUsername,
    password: CFG.adminBootstrapPassword,
    role: "admin",
  });
  console.log(`[BOOT] Initial admin account created: ${CFG.adminBootstrapUsername}`);
}

module.exports = bootstrapAdmin;
