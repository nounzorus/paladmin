const express = require("express");
const { palRequest, palProxy } = require("../services/palworldClient");

const router = express.Router({ mergeParams: true });

router.get("/", palProxy((req) => palRequest(req.server, "GET", "settings")));

module.exports = router;
