const express = require("express");
const metricsHistory = require("../services/metricsHistory");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json(metricsHistory.history(req.params.serverId, { hours: req.query.hours }));
});

module.exports = router;
