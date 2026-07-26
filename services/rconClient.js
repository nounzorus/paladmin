/**
 * Client RCON (protocole Source RCON) — secours pour commandes console libres
 * RCON est déprécié par Pocketpair ; désactivé par défaut.
 * Paramétré par serveur : serverCfg = { host, rconPort, adminPassword }
 */
const net = require("net");

function rconPacket(id, type, body) {
  const bodyBuf = Buffer.from(body, "utf8");
  const buf = Buffer.alloc(14 + bodyBuf.length);
  buf.writeInt32LE(10 + bodyBuf.length, 0); // size
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  bodyBuf.copy(buf, 12);
  // deux octets nuls de fin déjà à 0 via alloc
  return buf;
}

function rconCommand(serverCfg, command) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: serverCfg.host, port: serverCfg.rconPort, timeout: 8000 });
    let stage = "auth";
    let response = "";
    let buffer = Buffer.alloc(0);

    const fail = (code, params) => { sock.destroy(); reject(Object.assign(new Error(code), { params })); };

    sock.on("connect", () => sock.write(rconPacket(1, 3, serverCfg.adminPassword))); // SERVERDATA_AUTH
    sock.on("timeout", () => fail("RCON_TIMEOUT"));
    sock.on("error", (e) => reject(Object.assign(new Error("RCON_ERROR"), { params: { message: e.message } })));

    sock.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4) {
        const size = buffer.readInt32LE(0);
        if (buffer.length < 4 + size) break;
        const id = buffer.readInt32LE(4);
        const type = buffer.readInt32LE(8);
        const body = buffer.subarray(12, 4 + size - 2).toString("utf8");
        buffer = buffer.subarray(4 + size);

        if (stage === "auth" && type === 2) { // SERVERDATA_AUTH_RESPONSE
          if (id === -1) return fail("RCON_AUTH_FAILED");
          stage = "exec";
          sock.write(rconPacket(2, 2, command)); // SERVERDATA_EXECCOMMAND
        } else if (stage === "exec" && type === 0) {
          response += body;
          // Palworld répond en un seul paquet ; on clôt après un court délai
          clearTimeout(sock._flushTimer);
          sock._flushTimer = setTimeout(() => {
            sock.destroy();
            resolve(response.trim() || "(aucune sortie)");
          }, 250);
        }
      }
    });
  });
}

module.exports = { rconCommand };
