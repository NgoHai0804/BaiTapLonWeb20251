// app.js

// Tạo và cấu hình ứng dụng Express

// Nhiệm vụ:

// Khởi tạo Express app

// Gắn middleware (CORS, JSON parser, logger, error handler)

// Gắn tất cả route (/api/auth, /api/room, …)

// Trả về app để server.js dùng

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

// Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối DB
connectDB();

// Routes
const apiRouter = require("./routes/index");
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.send("🚀 Caro Online Backend đang hoạt động!");
});

module.exports = app;
