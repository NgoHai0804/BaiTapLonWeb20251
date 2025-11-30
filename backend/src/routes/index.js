// index.js
// Gom tất cả route trên vào một router chính.
// Chức năng chính:
// Import từng file route.

const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/friend", require("./friend.routes"));
router.use("/rooms", require("./room.routes")); // Changed to /rooms for consistency
router.use("/bot", require("./bot.routes"));
router.use("/chat", require("./chat.routes"));

module.exports = router;
