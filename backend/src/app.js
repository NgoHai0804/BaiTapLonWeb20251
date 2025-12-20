// app.js - khởi tạo và cấu hình Express app

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiRouter = require("./routes/index");
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.send("🚀 Caro Online Backend đang hoạt động!");
});

module.exports = app;
