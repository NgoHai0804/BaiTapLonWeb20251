# 🎮 Caro Online - Frontend

Modern real-time multiplayer Caro (Gomoku) game built with React + Vite, featuring beautiful UI and complete authentication system.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0.1-646cff?logo=vite)
![Redux](https://img.shields.io/badge/Redux-9.2.0-764abc?logo=redux)

---

## ✨ Features

### 🔐 Authentication System
- ✅ **User Registration** with email validation
- ✅ **Secure Login** with JWT token management
- ✅ **Forgot Password** with email recovery
- ✅ **Protected Routes** with automatic redirects
- ✅ **Auto Logout** on token expiration
- ✅ **LocalStorage** token persistence

### 🎨 UI/UX
- ✅ **Modern gradient design** (blue → purple → pink)
- ✅ **Responsive layout** (mobile, tablet, desktop)
- ✅ **Smooth animations** and transitions
- ✅ **Toast notifications** for user feedback
- ✅ **Loading states** with spinners
- ✅ **Form validation** with real-time feedback

### 🛠️ Technical Stack
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.1
- **Routing**: React Router DOM 7.1.1
- **State Management**: Redux Toolkit 2.5.0
- **HTTP Client**: Axios 1.7.9
- **Notifications**: React Toastify 11.0.2
- **Icons**: React Icons 5.4.0
- **Styling**: CSS3 with modern features

---

## 📦 Installation

### Prerequisites
- **Node.js**: >= 16.x
- **npm**: >= 8.x

### Setup Steps

1. **Clone the repository**
   ```bash
   cd frontend/
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:5173
   ```

---

## 🚀 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # App entry point
│   ├── index.css          # Global styles
│   │
│   ├── layouts/           # Page layouts
│   │   ├── AuthLayout.jsx     # Layout for auth pages
│   │   └── MainLayout.jsx     # Layout for main app
│   │
│   ├── pages/             # Page components
│   │   └── Auth/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       └── ForgotPassword.jsx
│   │
│   ├── components/        # Reusable components
│   │   └── AuthDebugPanel.jsx
│   │
│   ├── services/          # API services
│   │   └── api/
│   │       ├── axios.js       # Axios instance
│   │       └── authApi.js     # Auth API calls
│   │
│   ├── store/             # Redux store
│   │   ├── index.js           # Store configuration
│   │   └── authSlice.js       # Auth state management
│   │
│   └── hooks/             # Custom hooks
│       └── useAuth.js         # Auth hook
│
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
│
├── AUTH_README.md         # Authentication guide
├── API_INTEGRATION.md     # API documentation
├── CHECKLIST.md           # Features checklist
└── README.md              # This file
```

---

## 🔑 Authentication Flow

### Registration Flow
1. User visits `/auth/register`
2. Fills registration form (username, email, password)
3. Frontend validates input
4. `POST /api/auth/register` to backend
5. Receive JWT token + user data
6. Save to localStorage
7. Update Redux state
8. Redirect to `/lobby`

### Login Flow
1. User visits `/auth/login` (default route)
2. Enters credentials
3. `POST /api/auth/login`
4. Receive token + user data
5. Save to localStorage
6. Redirect to `/lobby`

### Protected Routes
1. User tries to access `/lobby`, `/friends`, etc.
2. Check `isAuthenticated` in Redux state
3. If not authenticated → Redirect to `/auth/login`
4. If authenticated → Allow access

### Logout Flow
1. User clicks logout button
2. `POST /api/auth/logout`
3. Clear localStorage
4. Reset Redux state
5. Redirect to `/auth/login`

---

## 🔧 API Configuration

### Axios Setup

**Base URL**: Configured via `VITE_API_URL` environment variable

**Request Interceptor**: Automatically adds JWT token
```javascript
config.headers.Authorization = `Bearer ${token}`
```

**Response Interceptor**: Handles errors globally
```javascript
// 401 → Auto logout
if (status === 401) {
    localStorage.clear()
    window.location.href = '/auth/login'
}
```

### Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/forgot-password` | Request password reset |

📖 **Detailed API documentation**: See [API_INTEGRATION.md](./API_INTEGRATION.md)

---

## 🎯 Usage Examples

### Using the `useAuth` Hook

```jsx
import { useAuth } from './hooks/useAuth'

function MyComponent() {
    const { 
        user, 
        isAuthenticated, 
        login, 
        logout, 
        loading 
    } = useAuth()

    const handleLogin = async () => {
        try {
            await login({ 
                email: 'user@example.com', 
                password: '123456' 
            })
            // Auto redirect to /lobby
        } catch (error) {
            console.error('Login failed:', error)
        }
    }

    return (
        <div>
            {isAuthenticated ? (
                <>
                    <h1>Welcome, {user.username}!</h1>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <button onClick={handleLogin} disabled={loading}>
                    {loading ? 'Loading...' : 'Login'}
                </button>
            )}
        </div>
    )
}
```

### Making Authenticated API Calls

```javascript
import axios from './services/api/axios'

// Token automatically added by interceptor
const fetchUserProfile = async () => {
    const response = await axios.get('/api/users/profile')
    return response.data
}
```

---

## 🧪 Testing

### Manual Testing Checklist

- [x] Registration with new email works
- [x] Login with correct credentials works
- [x] Login with wrong credentials shows error
- [x] Protected routes redirect to login when not authenticated
- [x] Token persists after page refresh
- [x] Logout clears token and redirects to login
- [x] Forgot password sends email
- [x] Form validation works (email format, password match, etc.)
- [x] Toast notifications appear correctly
- [x] Responsive design works on mobile/tablet/desktop

### Debug Tools

**AuthDebugPanel**: Located at `/lobby` (remove in production)

Shows:
- Authentication status
- User information
- JWT token preview
- LocalStorage state
- Refresh & logout buttons

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--primary-blue: #3b82f6
--primary-purple: #8b5cf6
--primary-pink: #ec4899

/* Gradients */
background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1), 
    rgba(139, 92, 246, 0.1), 
    rgba(236, 72, 153, 0.1))
```

### Typography

- **Font Family**: System fonts (SF Pro, Segoe UI, etc.)
- **Headings**: Bold, large size
- **Body**: Regular weight, comfortable reading size
- **Links**: Blue with hover underline

### Components

- **Buttons**: Solid background, rounded corners, hover effects
- **Cards**: White background, shadow, rounded corners
- **Forms**: Border inputs, focus states, validation colors
- **Toasts**: Colored based on type (success/error/info)

---

## 🔒 Security Best Practices

### Implemented
- ✅ JWT tokens stored in `localStorage`
- ✅ Tokens sent via `Authorization` header
- ✅ Auto logout on 401 response
- ✅ Client-side form validation
- ✅ Password visibility toggle
- ✅ HTTPS (in production)

### Recommendations
- 🔲 Implement refresh token rotation
- 🔲 Add rate limiting on login attempts
- 🔲 Implement CSRF protection
- 🔲 Add Content Security Policy headers
- 🔲 Enable 2FA for sensitive accounts

---

## 🚀 Deployment

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output: dist/ directory
```

### Environment Variables (Production)

```env
VITE_API_URL=https://api.caro-online.com
```

### Deploy to Vercel (Example)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify (Example)

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variables: Set `VITE_API_URL`

---

## 📚 Documentation

- 📖 **[AUTH_README.md](./AUTH_README.md)** - Authentication features overview
- 📖 **[API_INTEGRATION.md](./API_INTEGRATION.md)** - API endpoints and usage
- 📖 **[CHECKLIST.md](./CHECKLIST.md)** - Features checklist

---

## 🐛 Troubleshooting

### Issue: "Network Error" when calling API

**Solution**: Check if backend server is running and `VITE_API_URL` is correct

```bash
# Check .env file
cat .env

# Verify backend is running
curl http://localhost:5000/api/auth/me
```

### Issue: Token not persisting after refresh

**Solution**: Check browser console for localStorage errors

```javascript
// In browser console
localStorage.getItem('token')  // Should return JWT token
localStorage.getItem('user')   // Should return user JSON
```

### Issue: Protected routes not redirecting

**Solution**: Verify Redux state and router configuration

```javascript
// Check Redux state in browser console
window.__REDUX_DEVTOOLS_EXTENSION__
```

### Issue: CORS errors

**Solution**: Configure CORS in backend to allow frontend origin

```javascript
// Backend CORS config
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **Frontend Team** - Initial work

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for blazing fast dev experience
- Redux Toolkit for simplified state management
- All contributors and testers

---

## 📞 Support

For issues and questions:
- 📧 Email: support@caro-online.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Join our community](https://discord.gg/your-server)

---

**⭐ Star this repo if you find it helpful!**

---

*Last updated: December 16, 2024*
