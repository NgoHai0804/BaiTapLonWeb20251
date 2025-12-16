# 🚀 Quick Reference - Authentication System

## ⚡ TL;DR

**Complete authentication system with:**
- Login, Register, Forgot Password pages
- JWT token management
- Redux state management  
- Protected routes
- Beautiful UI with toast notifications

---

## 📦 Quick Start

```bash
cd frontend/
npm install
cp .env.example .env
npm run dev
# Open http://localhost:5173
```

---

## 🔑 useAuth Hook (Main Interface)

```jsx
import { useAuth } from './hooks/useAuth'

function MyComponent() {
    const { 
        user,              // Current user object
        isAuthenticated,   // true/false
        login,             // async (email, password)
        register,          // async (username, email, password)
        logout,            // async ()
        loading            // true during API calls
    } = useAuth()
    
    // That's it! Everything else is handled automatically.
}
```

---

## 📍 Routes

| Path | Component | Description | Protected |
|------|-----------|-------------|-----------|
| `/` | → `/auth/login` | Redirects to login | No |
| `/auth/login` | Login | Login page | No |
| `/auth/register` | Register | Registration | No |
| `/auth/forgot-password` | ForgotPassword | Password recovery | No |
| `/lobby` | LobbyPage | Game lobby | ✅ Yes |
| `/friends` | FriendsPage | Friends list | ✅ Yes |
| `/chat` | ChatPage | Chat room | ✅ Yes |
| `/profile` | ProfilePage | User profile | ✅ Yes |
| `/settings` | SettingsPage | App settings | ✅ Yes |

---

## 🎯 Common Patterns

### Pattern 1: Login Form

```jsx
import { useAuth } from '../hooks/useAuth'

function LoginForm() {
    const { login, loading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login({ email, password })
            // Auto-redirects to /lobby
            // Shows success toast
        } catch (error) {
            // Error toast shown automatically
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
            />
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
        </form>
    )
}
```

### Pattern 2: Protected Component

```jsx
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

function ProtectedPage() {
    const { isAuthenticated, loading, user } = useAuth()
    
    if (loading) {
        return <div>Loading...</div>
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />
    }
    
    return (
        <div>
            <h1>Welcome, {user.username}!</h1>
            {/* Your protected content */}
        </div>
    )
}
```

### Pattern 3: Conditional Rendering

```jsx
import { useAuth } from '../hooks/useAuth'

function Navbar() {
    const { isAuthenticated, user, logout } = useAuth()
    
    return (
        <nav>
            {isAuthenticated ? (
                <>
                    <span>Hello, {user.username}</span>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <a href="/auth/login">Login</a>
            )}
        </nav>
    )
}
```

### Pattern 4: Making Authenticated API Calls

```jsx
import axios from './services/api/axios'

// Token is automatically added by interceptor
async function fetchUserData() {
    try {
        const response = await axios.get('/api/users/me')
        return response.data
    } catch (error) {
        // 401 errors auto-logout
        // Other errors can be handled here
        console.error('API Error:', error)
    }
}
```

---

## 🔌 API Endpoints

```javascript
import authApi from './services/api/authApi'

// Register new user
await authApi.register({ 
    username: 'player1', 
    email: 'player@example.com', 
    password: '123456' 
})

// Login
await authApi.login({ 
    email: 'player@example.com', 
    password: '123456' 
})

// Get current user
const user = await authApi.getCurrentUser()

// Logout
await authApi.logout()

// Forgot password
await authApi.forgotPassword('player@example.com')

// Reset password
await authApi.resetPassword({ 
    token: 'reset_token', 
    newPassword: 'new_password' 
})
```

---

## 🎨 Toast Notifications

```javascript
import { toast } from 'react-toastify'

// Success
toast.success('Operation successful!')

// Error
toast.error('Something went wrong!')

// Info
toast.info('Please note...')

// Warning
toast.warning('Be careful!')

// Custom
toast('Custom message', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
})
```

---

## 🔐 Token Management (Automatic)

```javascript
// Token is managed automatically, but if you need direct access:

// Get token
const token = localStorage.getItem('token')

// Get user
const user = JSON.parse(localStorage.getItem('user'))

// Clear (use logout() instead)
localStorage.removeItem('token')
localStorage.removeItem('user')
```

---

## 🎭 Redux State Structure

```javascript
// authSlice state
{
    user: {
        id: '123',
        username: 'player1',
        email: 'player@example.com',
        // ... other user fields
    },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    isAuthenticated: true,
    loading: false,
    error: null
}
```

---

## ⚙️ Environment Variables

```env
# .env file
VITE_API_URL=http://localhost:5000

# Access in code:
const apiUrl = import.meta.env.VITE_API_URL
```

---

## 🐛 Debugging

### Use the Debug Panel (Development Only)

Located at `/lobby` page after login.

Shows:
- ✅ Authentication status
- 👤 User info
- 🔑 Token preview
- 💾 LocalStorage state
- 🔄 Refresh button
- 🚪 Logout button

### Check Redux State

Install Redux DevTools browser extension, then:
1. Open browser DevTools
2. Go to "Redux" tab
3. Inspect auth state

### Common Issues

**Issue**: `Cannot read property 'user' of undefined`
```javascript
// ❌ Wrong
const { user } = useAuth()
console.log(user.username)

// ✅ Correct
const { user } = useAuth()
console.log(user?.username)  // Use optional chaining
```

**Issue**: User not redirecting after login
```javascript
// Check if navigation is working
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
await login(credentials)
navigate('/lobby')  // Manual redirect if auto doesn't work
```

**Issue**: Token not persisting
```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('token'))
console.log('User:', localStorage.getItem('user'))

// If empty, check authSlice persistence
```

---

## 📋 Checklist for New Features

When adding a new protected feature:

- [ ] Import `useAuth` hook
- [ ] Check `isAuthenticated` before rendering
- [ ] Handle `loading` state
- [ ] Show user info if needed
- [ ] Add logout option
- [ ] Test without login (should redirect)
- [ ] Test with login (should work)
- [ ] Test token expiration (should auto-logout)

---

## 🔄 Common Workflows

### Adding a New Protected Route

```jsx
// In App.jsx
import NewProtectedPage from './pages/NewProtectedPage'

// Inside MainLayout routes:
<Route path="/new-feature" element={<NewProtectedPage />} />
```

### Adding a New API Endpoint

```javascript
// In authApi.js or create new API file
import axios from './axios'

export const newApi = {
    getData: () => axios.get('/api/new-endpoint'),
    postData: (data) => axios.post('/api/new-endpoint', data),
}
```

### Adding a New Redux Slice

```javascript
// src/store/newSlice.js
import { createSlice } from '@reduxjs/toolkit'

const newSlice = createSlice({
    name: 'newFeature',
    initialState: { /* ... */ },
    reducers: { /* ... */ }
})

export default newSlice.reducer

// In src/store/index.js
import newReducer from './newSlice'

const store = configureStore({
    reducer: {
        auth: authReducer,
        newFeature: newReducer  // Add here
    }
})
```

---

## 📚 Documentation Files

- **README.md** - Full project documentation
- **AUTH_README.md** - Authentication features guide
- **API_INTEGRATION.md** - API endpoints reference
- **CHECKLIST.md** - Implementation checklist
- **IMPLEMENTATION_SUMMARY.md** - Complete summary
- **QUICK_REFERENCE.md** - This file

---

## 🚨 Production Deployment

Before deploying:

```bash
# 1. Remove debug panel from App.jsx
# Delete or comment out AuthDebugPanel import and usage

# 2. Update .env for production
VITE_API_URL=https://api.yourproductiondomain.com

# 3. Build
npm run build

# 4. Test build locally
npm run preview

# 5. Deploy dist/ folder to hosting service
```

---

## 💡 Pro Tips

1. **Always use `useAuth()` hook** - Don't directly access Redux
2. **Handle loading states** - Better UX
3. **Use optional chaining** - `user?.username` to avoid errors
4. **Let interceptors handle tokens** - Don't manually add to requests
5. **Trust the auto-redirect** - Built into useAuth hook
6. **Check DevTools** - Use Redux DevTools for debugging
7. **Toast for feedback** - Already configured, use it!
8. **Logout on 401** - Automatic, don't worry about it

---

## 🆘 Getting Help

1. **Check documentation** - Most answers are there
2. **Use AuthDebugPanel** - See exact auth state
3. **Check browser console** - Errors appear here
4. **Check Network tab** - See API requests/responses
5. **Check Redux DevTools** - Inspect state changes
6. **Read error messages** - They're helpful!

---

## ⚡ Performance Tips

- Token checks are instant (localStorage)
- Redux state is in memory (very fast)
- API calls are cached where appropriate
- Interceptors run once per request
- Components re-render only when auth state changes

---

**That's it! You're ready to build with the authentication system. 🚀**

*Made with ❤️ by Antigravity AI Assistant*
