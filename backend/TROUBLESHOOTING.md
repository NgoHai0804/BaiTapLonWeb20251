# Troubleshooting Guide

## Lỗi: "Cannot fetch data from service: fetch failed"

Lỗi này xảy ra khi Prisma Client không kết nối được với MongoDB. Hãy kiểm tra các điểm sau:

### 1. Kiểm tra DATABASE_URL trong file `.env`

Đảm bảo file `.env` trong thư mục `backend/` có dòng:

```env
DATABASE_URL=mongodb://localhost:27017/caro-online
```

Hoặc nếu dùng MongoDB Atlas:
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/caro-online
```

### 2. Kiểm tra MongoDB đang chạy

**Windows:**
```powershell
# Kiểm tra service MongoDB
Get-Service MongoDB

# Hoặc kiểm tra process
Get-Process mongod
```

**Nếu MongoDB chưa chạy:**
```powershell
# Start MongoDB service
Start-Service MongoDB

# Hoặc nếu cài đặt local:
mongod
```

### 3. Kiểm tra format DATABASE_URL

Format đúng cho MongoDB:
- Local: `mongodb://localhost:27017/database-name`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/database-name`

### 4. Regenerate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### 5. Test kết nối MongoDB

```bash
# Test với mongosh (nếu đã cài)
mongosh mongodb://localhost:27017/caro-online
```

### 6. Kiểm tra log server

Khi start server, bạn sẽ thấy:
- ✅ `Connected to MongoDB via Prisma` - Kết nối thành công
- ❌ `Prisma connection error` - Có lỗi kết nối

### 7. Kiểm tra firewall và network

Nếu dùng MongoDB remote, đảm bảo:
- Firewall cho phép kết nối
- MongoDB Atlas có IP whitelist đúng
- Network connectivity ổn định

## Các lỗi thường gặp khác

### "Prisma schema validation error"
```bash
npm run prisma:validate
```

### "Module not found: @prisma/client"
```bash
npm install
npm run prisma:generate
```

### "Invalid DATABASE_URL"
Đảm bảo DATABASE_URL đúng format MongoDB connection string.

