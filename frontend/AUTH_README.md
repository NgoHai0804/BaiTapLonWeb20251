# 🎮 Caro Online - Frontend

Frontend application cho game Caro Online được xây dựng với React, Vite, TailwindCSS và Redux Toolkit.

## 📋 Tính năng Authentication

### ✅ Đã hoàn thành

- **Layouts**:
  - ✅ `AuthLayout` - Layout cho trang đăng nhập/đăng ký
  - ✅ `MainLayout` - Layout chính với Navbar và Sidebar

- **Pages**:
  - ✅ Login - Trang đăng nhập
  - ✅ Register - Trang đăng ký
  - ✅ ForgotPassword - Trang quên mật khẩu

- **API Integration**:
  - ✅ POST `/api/auth/register` - Đăng ký tài khoản
  - ✅ POST `/api/auth/login` - Đăng nhập
  - ✅ POST `/api/auth/logout` - Đăng xuất
  - ✅ POST `/api/auth/forgot-password` - Quên mật khẩu

- **Authentication**:
  - ✅ Lưu JWT token vào `localStorage`
  - ✅ Custom hook `useAuth()` để quản lý auth state
  - ✅ Redux slice cho auth state management
  - ✅ Auto redirect khi chưa đăng nhập
  - ✅ Auto redirect khi đã đăng nhập (từ auth pages)

## 🚀 Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sau đó cập nhật `VITE_API_URL` trong file `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Chạy development server

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173`

## 📁 Cấu trúc thư mục

```
src/
├── layouts/
│   ├── AuthLayout.jsx      # Layout cho auth pages
│   └── MainLayout.jsx      # Layout chính với sidebar/navbar
│
├── pages/
│   └── Auth/
│       ├── Login.jsx       # Trang đăng nhập
│       ├── Register.jsx    # Trang đăng ký
│       └── ForgotPassword.jsx # Trang quên mật khẩu
│
├── services/
│   └── api/
│       ├── axios.js        # Axios instance với interceptors
│       └── authApi.js      # Auth API calls
│
├── store/
│   ├── index.js           # Redux store
│   └── authSlice.js       # Auth state management
│
├── hooks/
│   └── useAuth.js         # Custom hook cho authentication
│
└── App.jsx                # Main app với routing
```

## 🔐 Sử dụng useAuth Hook

```jsx
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
    const { 
        user,           // Thông tin user hiện tại
        isAuthenticated, // User đã đăng nhập chưa
        loading,        // Loading state
        login,          // Function đăng nhập
        logout,         // Function đăng xuất
        register        // Function đăng ký
    } = useAuth()

    // Đăng nhập
    const handleLogin = async () => {
        await login({ email: 'user@example.com', password: '123456' })
    }

    // Đăng xuất
    const handleLogout = async () => {
        await logout()
    }

    return (
        <div>
            {isAuthenticated ? (
                <p>Xin chào, {user.username}</p>
            ) : (
                <p>Vui lòng đăng nhập</p>
            )}
        </div>
    )
}
```

## 🎨 Styling

Dự án sử dụng **TailwindCSS** cho styling với:
- Gradient backgrounds
- Smooth transitions
- Responsive design
- Modern UI components

## 📝 API Response Format

### Login/Register Success Response
```json
{
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email@example.com"
    },
    "token": "jwt_token_here"
}
```

### Error Response
```json
{
    "message": "Error message here"
}
```

## 🔧 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint
- `npm run format` - Format code với Prettier

## 🌐 Routes

### Public Routes (AuthLayout)
- `/auth/login` - Trang đăng nhập
- `/auth/register` - Trang đăng ký
- `/auth/forgot-password` - Trang quên mật khẩu

### Protected Routes (MainLayout)
- `/lobby` - Lobby (trang chủ)
- `/friends` - Danh sách bạn bè
- `/chat` - Tin nhắn
- `/profile` - Hồ sơ cá nhân
- `/settings` - Cài đặt

## 🔒 Protected Routes

Các route trong `MainLayout` tự động được bảo vệ:
- Nếu chưa đăng nhập → redirect về `/auth/login`
- Nếu đã đăng nhập và vào auth pages → redirect về `/lobby`

## 📦 Dependencies chính

- **React** 18.2.0 - UI Library
- **React Router DOM** 6.20.0 - Routing
- **Redux Toolkit** 2.0.0 - State Management
- **Axios** 1.6.0 - HTTP Client
- **React Toastify** 9.1.3 - Notifications
- **TailwindCSS** 3.3.5 - Styling
- **React Icons** 4.11.0 - Icons

## 🎯 Next Steps

- [ ] Implement full lobby functionality
- [ ] Add real-time game room with Socket.IO
- [ ] Create friend management system
- [ ] Build chat system
- [ ] Add user profile with avatar upload
- [ ] Implement game history and leaderboard

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ developer.
