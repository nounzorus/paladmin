/**
 * Proxy vers l'API REST Palworld (HTTP Basic : admin / AdminPassword)
 * Paramétré par serveur : serverCfg = { host, apiPort, adminPassword }
 */
const PAL_BASE = (serverCfg) => `http://${serverCfg.host}:${serverCfg.apiPort}/v1/api`;
const BASIC = (serverCfg) => "Basic " + Buffer.from(`admin:${serverCfg.adminPassword}`).toString("base64");

async function palRequest(serverCfg, method, endpoint, body) {
  const url = `${PAL_BASE(serverCfg)}/${endpoint}`;
  const opts = {
    method,
    headers: { Authorization: BASIC(serverCfg) },
    signal: AbortSignal.timeout(10_000),
  };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const text = await r.text();
  if (!r.ok) {
    const err = new Error("PALWORLD_API_ERROR");
    err.status = r.status;
    err.detail = text || r.statusText;
    throw err;
  }
  try { return text ? JSON.parse(text) : { ok: true }; }
  catch { return { raw: text }; }
}

function palProxy(handler) {
  return async (req, res) => {
    try {
      res.json(await handler(req));
    } catch (e) {
      const status = e.status === 401 ? 502 : (e.status || 502);
      if (e.status === 401) {
        res.status(status).json({ error: "PALWORLD_AUTH_FAILED" });
      } else if (e.name === "TimeoutError" || e.code === "ECONNREFUSED" || /fetch failed/i.test(e.message)) {
        res.status(status).json({ error: "PALWORLD_UNREACHABLE" });
      } else if (e.detail !== undefined) {
        // Provient de palRequest() ci-dessus : erreur HTTP renvoyée par l'API Palworld elle-même.
        res.status(status).json({ error: "PALWORLD_API_ERROR", params: { status: e.status, detail: e.detail } });
      } else {
        // Erreur de validation levée par le handler (ex. USERID_REQUIRED) — pas de params Palworld.
        res.status(status).json({ error: e.message, params: e.params });
      }
    }
  };
}

module.exports = { palRequest, palProxy };
