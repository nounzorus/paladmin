PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','moderator','viewer')),
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS servers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  host           TEXT NOT NULL,
  api_port       INTEGER NOT NULL DEFAULT 8212,
  admin_password TEXT NOT NULL,
  rcon_enabled   INTEGER NOT NULL DEFAULT 0,
  rcon_port      INTEGER NOT NULL DEFAULT 25575,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT
);

CREATE TABLE IF NOT EXISTS user_servers (
  user_id   INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, server_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username    TEXT NOT NULL,
  server_id   INTEGER REFERENCES servers(id) ON DELETE SET NULL,
  server_name TEXT,
  action      TEXT NOT NULL,
  target      TEXT,
  detail      TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_log_server_created ON audit_log(server_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action          ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created          ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS player_notes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id           INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  player_userid       TEXT NOT NULL,
  note                TEXT NOT NULL,
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_username TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_player_notes_server_player ON player_notes(server_id, player_userid);

CREATE TABLE IF NOT EXISTS announce_presets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id  INTEGER REFERENCES servers(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_announce_presets_server ON announce_presets(server_id);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id        INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('auto_save','restart')),
  cron_expression  TEXT NOT NULL,
  restart_warnings TEXT,
  restart_message  TEXT,
  enabled          INTEGER NOT NULL DEFAULT 1,
  last_run_at      TEXT,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_server ON scheduled_tasks(server_id);

CREATE TABLE IF NOT EXISTS metrics_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id       INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  captured_at     TEXT NOT NULL DEFAULT (datetime('now')),
  online          INTEGER NOT NULL,
  player_count    INTEGER,
  fps             REAL,
  uptime_seconds  INTEGER,
  frametime_ms    REAL
);
CREATE INDEX IF NOT EXISTS idx_metrics_history_server_captured ON metrics_history(server_id, captured_at);

CREATE TABLE IF NOT EXISTS whitelist_settings (
  server_id  INTEGER PRIMARY KEY REFERENCES servers(id) ON DELETE CASCADE,
  enabled    INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS whitelist_entries (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id          INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  player_userid      TEXT NOT NULL,
  label              TEXT,
  added_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_by_username  TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(server_id, player_userid)
);
CREATE INDEX IF NOT EXISTS idx_whitelist_entries_server ON whitelist_entries(server_id);

CREATE TABLE IF NOT EXISTS whitelist_requests (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id             INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  player_userid         TEXT NOT NULL,
  player_name           TEXT,
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ip                    TEXT,
  reviewed_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_username  TEXT,
  reviewed_at           TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_whitelist_requests_server_status ON whitelist_requests(server_id, status);

CREATE TABLE IF NOT EXISTS webhooks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id      INTEGER REFERENCES servers(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  label          TEXT,
  events         TEXT NOT NULL,
  enabled        INTEGER NOT NULL DEFAULT 1,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,
  last_fired_at  TEXT,
  last_status    TEXT
);
CREATE INDEX IF NOT EXISTS idx_webhooks_server ON webhooks(server_id);
