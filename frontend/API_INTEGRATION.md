# 📡 API Integration Guide

Hướng dẫn tích hợp API cho Caro Online frontend.

## 🔗 Base URL

```
http://localhost:5000
```

Cấu hình trong file `.env`:
```env
VITE_API_URL=http://localhost:5000
```

## 🔐 Authentication APIs

### 1. Đăng ký (Register)

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
    "username": "player123",
    "email": "player@example.com",
    "password": "password123"
}
```

**Success Response** (200 OK):
```json
{
    "user": {
        "id": "user_id_here",
        "username": "player123",
        "email": "player@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (400 Bad Request):
```json
{
    "message": "Email đã được sử dụng"
}
```

**Cách sử dụng trong code**:
```javascript
import { useAuth } from '../hooks/useAuth'

function RegisterForm() {
    const { register, loading } = useAuth()
    
    const handleSubmit = async (formData) => {
        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            })
            // Tự động redirect về /lobby sau khi đăng ký thành công
        } catch (error) {
            console.error('Registration failed:', error)
        }
    }
}
```

---

### 2. Đăng nhập (Login)

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
    "email": "player@example.com",
    "password": "password123"
}
```

**Success Response** (200 OK):
```json
{
    "user": {
        "id": "user_id_here",
        "username": "player123",
        "email": "player@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (401 Unauthorized):
```json
{
    "message": "Email hoặc mật khẩu không đúng"
}
```

**Cách sử dụng trong code**:
```javascript
import { useAuth } from '../hooks/useAuth'

function LoginForm() {
    const { login, loading } = useAuth()
    
    const handleSubmit = async (formData) => {
        try {
            await login({
                email: formData.email,
                password: formData.password
            })
            // Tự động redirect về /lobby sau khi đăng nhập thành công
        } catch (error) {
            console.error('Login failed:', error)
        }
    }
}
```

---

### 3. Đăng xuất (Logout)

**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response** (200 OK):
```json
{
    "message": "Đăng xuất thành công"
}
```

**Cách sử dụng trong code**:
```javascript
import { useAuth } from '../hooks/useAuth'

function LogoutButton() {
    const { logout } = useAuth()
    
    const handleLogout = async () => {
        await logout()
        // Tự động xóa token và redirect về /auth/login
    }
    
    return (
        <button onClick={handleLogout}>
            Đăng xuất
        </button>
    )
}
```

---

### 4. Quên mật khẩu (Forgot Password)

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
    "email": "player@example.com"
}
```

**Success Response** (200 OK):
```json
{
    "message": "Email khôi phục mật khẩu đã được gửi"
}
```

**Error Response** (404 Not Found):
```json
{
    "message": "Email không tồn tại trong hệ thống"
}
```

**Cách sử dụng trong code**:
```javascript
import authApi from '../services/api/authApi'
import { toast } from 'react-toastify'

async function handleForgotPassword(email) {
    try {
        await authApi.forgotPassword(email)
        toast.success('Đã gửi email khôi phục mật khẩu!')
    } catch (error) {
        toast.error(error.message || 'Có lỗi xảy ra')
    }
}
```

---

### 5. Lấy thông tin user hiện tại (Get Current User)

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response** (200 OK):
```json
{
    "user": {
        "id": "user_id_here",
        "username": "player123",
        "email": "player@example.com",
        "avatar": "https://example.com/avatar.jpg",
        "stats": {
            "wins": 10,
            "losses": 5,
            "draws": 2
        }
    }
}
```

**Error Response** (401 Unauthorized):
```json
{
    "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

**Cách sử dụng trong code**:
```javascript
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

function Profile() {
    const { user, refreshUser } = useAuth()
    
    useEffect(() => {
        // Refresh user data khi component mount
        refreshUser()
    }, [])
    
    return (
        <div>
            <h1>{user?.username}</h1>
            <p>{user?.email}</p>
        </div>
    )
}
```

---

## 🔒 Token Management

### Cách token được quản lý:

1. **Lưu token**: Sau khi login/register thành công, token được lưu vào `localStorage`
   ```javascript
   localStorage.setItem('token', token)
   localStorage.setItem('user', JSON.stringify(user))
   ```

2. **Tự động thêm token vào request**: Axios interceptor tự động thêm token vào header
   ```javascript
   // Trong axios.js
   config.headers.Authorization = `Bearer ${token}`
   ```

3. **Xử lý token hết hạn**: Khi server trả về 401, tự động xóa token và redirect về login
   ```javascript
   if (status === 401) {
       localStorage.removeItem('token')
       localStorage.removeItem('user')
       window.location.href = '/auth/login'
   }
   ```

---

## 📋 Error Handling

Tất cả API errors được xử lý tự động:

```javascript
// Trong authSlice.js
.addCase(loginUser.rejected, (state, action) => {
    state.loading = false
    state.error = action.payload?.message || 'Đăng nhập thất bại'
    toast.error(state.error)  // Hiển thị toast notification
})
```

User sẽ thấy toast notification khi có lỗi:
- ✅ Thành công: Toast màu xanh
- ❌ Lỗi: Toast màu đỏ
- ℹ️ Thông báo: Toast màu xanh dương

---

## 🧪 Testing với Postman

### 1. Test Register
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123456"
}
```

### 2. Test Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "123456"
}
```

Copy token từ response để sử dụng cho các request khác.

### 3. Test Protected Route
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer {your_token_here}
```

---

## 🚀 Quick Start

```javascript
// 1. Đăng ký user mới
const { register } = useAuth()
await register({
    username: 'player123',
    email: 'player@example.com',
    password: 'password123'
})

// 2. Đăng nhập
const { login } = useAuth()
await login({
    email: 'player@example.com',
    password: 'password123'
})

// 3. Kiểm tra authentication state
const { user, isAuthenticated } = useAuth()
if (isAuthenticated) {
    console.log('Logged in as:', user.username)
}

// 4. Đăng xuất
const { logout } = useAuth()
await logout()
```

---

## 📝 Notes

- Token được lưu trong `localStorage` với key `token`
- User data được lưu trong `localStorage` với key `user`
- Tất cả protected routes tự động kiểm tra authentication
- Token tự động được thêm vào mọi API request qua axios interceptor
- Khi token hết hạn (401), user tự động được redirect về login page

---

## 🔧 Customization

Để thay đổi API base URL, cập nhật file `.env`:

```env
# Development
VITE_API_URL=http://localhost:5000

# Production
VITE_API_URL=https://api.caro-online.com
```

Sau đó restart dev server:
```bash
npm run dev
```
