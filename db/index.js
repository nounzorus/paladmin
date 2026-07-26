const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const CFG = require("../config");

fs.mkdirSync(path.dirname(CFG.dbPath), { recursive: true });

const db = new DatabaseSync(CFG.dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

module.exports = db;
