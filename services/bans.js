const db = require("../db");

/**
 * L'API REST Palworld ne permet pas de lister les bannissements actifs —
 * seules les actions ban/unban existent. On dérive donc la liste des bannis
 * "actuels" à partir du journal d'audit : pour chaque userid ciblé par un
 * ban ou débannissement sur ce serveur, on garde son dernier événement
 * (via l'id, pas le timestamp, pour rester correct même à la même seconde)
 * et on ne conserve que ceux dont le dernier événement est un ban.
 */
function listActiveBans(serverId) {
  return db
    .prepare(
      `SELECT a.target AS userid, a.username AS banned_by, a.detail, a.created_at
       FROM audit_log a
       JOIN (
         SELECT target, MAX(id) AS max_id
         FROM audit_log
         WHERE server_id = $serverId AND action IN ('ban','unban') AND target IS NOT NULL
         GROUP BY target
       ) latest ON latest.target = a.target AND latest.max_id = a.id
       WHERE a.action = 'ban'
       ORDER BY a.created_at DESC`
    )
    .all({ $serverId: serverId });
}

module.exports = { listActiveBans };
