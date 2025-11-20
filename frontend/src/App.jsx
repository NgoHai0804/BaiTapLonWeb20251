import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
// import AuthLayout from './layouts/AuthLayout'
// import MainLayout from './layouts/MainLayout'

// Pages (Lazy load is better but keeping it simple for base)
// import Login from './pages/Auth/Login'
// import Lobby from './pages/Lobby/Lobby'
// import GameRoom from './pages/Game/GameRoom'

function App() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<div>Auth Layout Placeholder</div>}>
                <Route path="login" element={<div>Login Page</div>} />
                <Route path="register" element={<div>Register Page</div>} />
            </Route>

            {/* Main App Routes */}
            <Route path="/" element={<div>Main Layout Placeholder</div>}>
                <Route index element={<Navigate to="/lobby" replace />} />
                <Route path="lobby" element={<div>Lobby Page</div>} />
                <Route path="game/:id" element={<div>Game Room</div>} />
                <Route path="profile" element={<div>Profile Page</div>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    )
}

export default App