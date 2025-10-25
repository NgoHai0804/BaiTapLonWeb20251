// src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`Connected MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error("Connection MongoDB Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
