// index.js
// Gom tất cả route trên vào một router chính.
// Chức năng chính:
// Import từng file route.

const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/user", require("./user.routes"));
router.use("/friend", require("./friend.routes"));
router.use("/room", require("./room.routes"));

module.exports = router;
