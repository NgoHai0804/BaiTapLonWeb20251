// bot.routes.js
// Routes cho AI Bot

const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const botController = require("../controllers/bot.controller");

router.post("/move", verifyToken, botController.getBotMove);

module.exports = router;

