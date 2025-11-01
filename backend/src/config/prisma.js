// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

// Singleton pattern để tái sử dụng Prisma Client
// Giúp tránh tạo quá nhiều kết nối trong development
const globalForPrisma = global;

// Kiểm tra DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  console.error('Please set DATABASE_URL in your .env file');
  console.error('Example: DATABASE_URL=mongodb://localhost:27017/caro-online');
  process.exit(1);
}

// Khởi tạo Prisma Client với error handling tốt hơn
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Kết nối đến database (async, không block module loading)
let isConnected = false;
const connectWithRetry = async (retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      isConnected = true;
      console.log('✅ Connected to MongoDB via Prisma');
      return;
    } catch (error) {
      console.error(`❌ Prisma connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Failed to connect to MongoDB after', retries, 'attempts');
        console.error('Please check your DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          console.error('💡 Tip: Make sure MongoDB is running and accessible');
        }
      }
    }
  }
};

// Start connection
connectWithRetry();

// Graceful shutdown
process.on('beforeExit', async () => {
  if (isConnected) {
    await prisma.$disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
});

module.exports = prisma;
