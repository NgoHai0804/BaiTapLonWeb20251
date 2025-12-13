// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

// Singleton pattern để tái sử dụng Prisma Client
// Giúp tránh tạo quá nhiều kết nối trong development
const globalForPrisma = global;

// Kiểm tra DATABASE_URL có được cấu hình chưa
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL chưa được định nghĩa trong biến môi trường');
  console.error('Vui lòng thiết lập DATABASE_URL trong file .env');
  console.error('Ví dụ: DATABASE_URL=mongodb://localhost:27017/caro-online');
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
      console.log('Đã kết nối đến MongoDB qua Prisma');
      return;
    } catch (error) {
      console.error(`Lần thử kết nối Prisma thứ ${i + 1}/${retries} thất bại:`, error.message);
      if (i < retries - 1) {
        console.log(`Đang thử lại sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Không thể kết nối đến MongoDB sau', retries, 'lần thử');
        console.error('Vui lòng kiểm tra DATABASE_URL:', process.env.DATABASE_URL ? 'Đã thiết lập' : 'Chưa thiết lập');
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          console.error('Gợi ý: Đảm bảo MongoDB đang chạy và có thể truy cập được');
        }
      }
    }
  }
};

// Start connection
connectWithRetry();

// Ngắt kết nối database khi server tắt
process.on('beforeExit', async () => {
  if (isConnected) {
    await prisma.$disconnect();
    console.log('Đã ngắt kết nối khỏi MongoDB');
  }
});

module.exports = prisma;
