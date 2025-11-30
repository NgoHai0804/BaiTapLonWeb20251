// AuthLayout.jsx
// Layout cho các trang Login, Register, Forgot Password

import { Outlet, Link } from 'react-router-dom';
import '../styles/global.css';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2">🎮 Caro Online</h1>
            <p className="text-white/80 text-sm">Chơi cờ caro trực tuyến</p>
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>© 2024 Caro Online. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
