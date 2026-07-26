# Palworld Admin Panel

A web admin panel for one or more dedicated Palworld servers, deployable with a single `docker compose up`.

It talks to the **official Palworld REST API** (Pocketpair deprecated RCON in favor of it; RCON is still available here as an optional fallback console). Accounts, servers, and history are persisted in a local SQLite database — no external database service required.

## Features

- **Multi-server** — manage as many Palworld servers as you need, each with its own connection settings (host, ports, admin password, RCON)
- **Accounts & roles** — `admin` (full access), `moderator` (kick/ban/unban/announce, no shutdown/restart/RCON), `viewer` (read-only); non-admins only see servers explicitly assigned to them
- **Audit log** — every action (kick, ban, announce, shutdown, user/server changes…) is recorded with who did it, on what, and when
- Real-time dashboard: server name/version, FPS, uptime, in-game day, connected players (auto-refreshes every 10s)
- Player list with level, ping, ID — kick, ban, and persistent per-player notes
- **Ban view** derived from the audit log (the Palworld API has no endpoint to list active bans)
- In-game announcements, with reusable message presets
- World save, scheduled shutdown with a warning message, immediate stop
- **Scheduled tasks** — recurring auto-saves and restarts (cron-based), with in-game warning announcements before a restart
- **Metrics history** — a background poller records player count/FPS over time (independent of any open browser tab), with a simple chart over 6h/24h/7d/30d
- **Discord webhooks** — notify on bans, server up/down transitions, and imminent restarts
- **Multi-language UI** — English, French, Spanish, and Chinese out of the box (English default, switchable anytime, including from the login screen)
- Read-only view of active server settings (the Palworld API doesn't support hot config writes)
- Optional per-server RCON console for free-form commands (`ShowPlayers`, `TeleportToPlayer`, etc.)
- 12h sessions, brute-force login lockout, non-root container

## Requirements on the Palworld server side

In `Pal/Saved/Config/.../PalWorldSettings.ini` (stop the server before editing, or it'll get overwritten):

```
RESTAPIEnabled=True
RESTAPIPort=8212
AdminPassword="SomeStrongPassword"
```

Then restart the server. If you also want the RCON console: `RCONEnabled=True` and `RCONPort=25575`.

## Deploying

```bash
cp .env.example .env
nano .env          # set PANEL_ADMIN_USERNAME + PANEL_ADMIN_PASSWORD
docker compose up -d --build
```

`PANEL_ADMIN_USERNAME`/`PANEL_ADMIN_PASSWORD` are **required** — the panel refuses to start without them (fails fast with a clear error in the logs). They're only used once: on first boot, if the database has no users yet, that admin account is created automatically. Setting them again later has no effect — manage accounts from the **Users** page instead.

The panel is available at `http://<your-machine>:8080`. Log in with the admin account from `.env`, then add your Palworld server(s) from the **Servers** page — host, ports, admin password, and RCON are configured there now, not in `.env`.

### Where does the Palworld server run?

Entered as the "host" when adding a server in the panel:

| Situation | Host to enter |
|---|---|
| On the host machine, outside Docker | `host.docker.internal` |
| In the same docker-compose (optional block provided) | `palworld-server` |
| On another machine | its IP |

`docker-compose.yml` includes a commented-out block to also run the Palworld dedicated server itself (the `jammsen/palworld-dedicated-server` image) on the same Docker network — in that setup port 8212 isn't even published externally, only the panel can reach it.

## Security — please read

- **Never expose port 8212 (REST API) or RCON to the internet.** Anyone who can reach them with the password fully controls the server. Keep them on your local network/Docker network; only the panel (port 8080) is meant to be publicly reachable.
- The panel itself speaks plain HTTP. For access from outside your network, put it behind an HTTPS reverse proxy (Caddy, Traefik, Nginx) or a VPN (WireGuard/Tailscale).
- Choose a strong `PANEL_ADMIN_PASSWORD`. Palworld admin passwords entered on the Servers page are stored in **cleartext** in the local SQLite database (same trust model as the original plaintext `.env`) — the `data/` directory is gitignored and should stay on a disk you don't share.
- Back up the `data/` directory (the SQLite file) if you want to keep accounts, servers, and history across container recreations — the `./data:/app/data` volume in `docker-compose.yml` already takes care of that for you.

## Internal API

The backend proxies the Palworld REST API (`/v1/api/...`) and only exposes its own authenticated, server-scoped routes to the browser: `/api/servers/:id/{info,metrics,players,settings,announce,save,shutdown,stop,rcon}`, plus top-level resources `/api/servers`, `/api/users`, `/api/audit-log`, `/api/webhooks`. Palworld admin passwords never leave the panel's backend — they're never sent to the browser.

## Local development (without Docker)

The backend (Express, CommonJS) and frontend (Vue 3 + Vite + Vue Router) are two independent npm projects, run in separate terminals during development. Vite provides hot-reload and proxies `/api` and `/auth` to the backend:

```bash
# Terminal 1 — backend on :8080
npm install
PANEL_ADMIN_USERNAME=admin PANEL_ADMIN_PASSWORD=test node server.js

# Terminal 2 — frontend on :5173 (proxies to :8080)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. In production (and in the Docker image), only the backend runs — it serves the static files built by `npm run build` into `frontend/dist`.

The backend uses Node's built-in `node:sqlite` module (no native dependency to compile) — requires Node ≥ 22.5.

### Architecture

```
config/       # environment variables
db/           # SQLite schema, initialization, initial admin bootstrap
middleware/   # panel sessions, brute-force lockout, requireAuth/requireRole, resolveServer
services/     # business logic: users, servers, palworldClient, rconClient, auditLog, bans,
              # playerNotes, announcePresets, scheduledTasks, metricsHistory, webhooks
routes/       # Express routes, one file per resource
server.js     # entry point: wires up middleware/routes, starts the scheduler and metrics
              # poller, serves frontend/dist
frontend/     # Vue 3 + Vite + Vue Router SPA (composables + components + views)
```

## Contributing

Issues and pull requests are welcome. The codebase deliberately favors plain, explicit code over abstractions: services paired one-to-one with routes, no ORM, no generic decorators where an explicit function call reads just as well.

## License

No license file is currently included — treat this repository as "all rights reserved" until one is added.
