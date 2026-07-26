const servers = require("../services/servers");

function resolveServer(req, res, next) {
  const row = servers.getById(req.params.serverId);
  if (!row) return res.status(404).json({ error: "SERVER_NOT_FOUND" });
  req.serverRow = row;
  req.server = servers.toClientConfig(row);
  next();
}

function requireServerAccess() {
  return (req, res, next) => {
    if (!servers.userHasAccess(req.user, req.params.serverId)) {
      return res.status(403).json({ error: "SERVER_ACCESS_DENIED" });
    }
    next();
  };
}

module.exports = { resolveServer, requireServerAccess };
