/**
 * Palworld Admin Panel — backend
 * Proxifie l'API REST officielle des serveurs dédiés Palworld
 * (et fournit un client RCON de secours pour les commandes console).
 */
const express = require("express");
const path = require("path");

const CFG = require("./config");
require("./db"); // initialise la base SQLite (crée le fichier + schéma si besoin)
const bootstrapAdmin = require("./db/bootstrapAdmin");
const { initScheduler } = require("./services/scheduledTasks");
const metricsHistory = require("./services/metricsHistory");
const webhooks = require("./services/webhooks");
const whitelist = require("./services/whitelist");
const { requireAuth, requireRole } = require("./middleware/auth");
const { resolveServer, requireServerAccess } = require("./middleware/resolveServer");

const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const serversRouter = require("./routes/servers");
const playersRouter = require("./routes/players");
const serverActionsRouter = require("./routes/server-actions");
const settingsRouter = require("./routes/settings");
const rconRouter = require("./routes/rcon");
const auditLogRouter = require("./routes/audit-log");
const playerNotesRouter = require("./routes/player-notes");
const announcePresetsRouter = require("./routes/announce-presets");
const scheduledTasksRouter = require("./routes/scheduled-tasks");
const metricsHistoryRouter = require("./routes/metrics-history");
const webhooksRouter = require("./routes/webhooks");
const whitelistRouter = require("./routes/whitelist");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.use("/auth", authRouter);
app.use("/api/users", requireAuth, requireRole("admin"), usersRouter);
app.use("/api/audit-log", requireAuth, requireRole("admin"), auditLogRouter);
app.use("/api/webhooks", requireAuth, requireRole("admin"), webhooksRouter);
app.use("/api/servers", requireAuth, serversRouter);
app.use(
  "/api/servers/:serverId/players/:userid/notes",
  requireAuth, resolveServer, requireServerAccess(),
  playerNotesRouter
);
app.use(
  "/api/servers/:serverId/players",
  requireAuth, resolveServer, requireServerAccess(),
  playersRouter
);
app.use(
  "/api/servers/:serverId/announce-presets",
  requireAuth, resolveServer, requireServerAccess(),
  announcePresetsRouter
);
app.use(
  "/api/servers/:serverId/settings",
  requireAuth, resolveServer, requireServerAccess(),
  settingsRouter
);
app.use(
  "/api/servers/:serverId/rcon",
  requireAuth, resolveServer, requireServerAccess(),
  rconRouter
);
app.use(
  "/api/servers/:serverId/scheduled-tasks",
  requireAuth, requireRole("admin"), resolveServer, requireServerAccess(),
  scheduledTasksRouter
);
app.use(
  "/api/servers/:serverId/metrics-history",
  requireAuth, resolveServer, requireServerAccess(),
  metricsHistoryRouter
);
app.use(
  "/api/servers/:serverId/whitelist",
  requireAuth, resolveServer, requireServerAccess(),
  whitelistRouter
);
app.use(
  "/api/servers/:serverId",
  requireAuth, resolveServer, requireServerAccess(),
  serverActionsRouter
);

// Repli SPA : toute route non-API sert index.html (routage côté client par Vue Router)
app.get(/^(?!\/api|\/auth).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

metricsHistory.setTransitionHook((server, online) => {
  webhooks.fireEvent(online ? "server_up" : "server_down", {
    serverId: server.id,
    message: `${online ? "🟢" : "🔴"} **${server.name}** is ${online ? "back online" : "unreachable"}.`,
  });
});

bootstrapAdmin().then(() => {
  initScheduler();
  metricsHistory.start();
  whitelist.start();
  app.listen(CFG.panelPort, () => {
    console.log(`Palworld Admin Panel listening on http://0.0.0.0:${CFG.panelPort}`);
  });
});
