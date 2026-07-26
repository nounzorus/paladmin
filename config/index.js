/**
 * Configuration (environment variables)
 */
const CFG = {
  panelPort: parseInt(process.env.PANEL_PORT || "8080", 10),
  dbPath: process.env.PANEL_DB_PATH || "./data/paladmin.db",
  adminBootstrapUsername: process.env.PANEL_ADMIN_USERNAME || "",
  adminBootstrapPassword: process.env.PANEL_ADMIN_PASSWORD || "",
  metricsPollIntervalMs: parseInt(process.env.METRICS_POLL_INTERVAL_MS || "60000", 10),
  metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || "30", 10),
};

if (!CFG.adminBootstrapUsername || !CFG.adminBootstrapPassword) {
  console.error("[FATAL] PANEL_ADMIN_USERNAME / PANEL_ADMIN_PASSWORD are not set. Refusing to start without an initial admin account.");
  process.exit(1);
}

module.exports = CFG;
