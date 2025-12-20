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

// Health check endpoint cho Docker
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files từ frontend build (production)
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const frontendPath = path.join(__dirname, "../../frontend/dist");
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Fallback: serve index.html cho tất cả routes không phải API
  app.get("*", (req, res) => {
    // Không serve index.html cho API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  // Development mode
  app.get("/", (req, res) => {
    res.send("Caro Online Backend đang hoạt động! (Development Mode)");
  });
}

module.exports = app;
