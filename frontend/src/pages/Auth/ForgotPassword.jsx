// ForgotPassword.jsx
// Trang quên mật khẩu.
// Nhập email → gửi yêu cầu khôi phục qua API /auth/forgot-password.
// Hiển thị thông báo “Kiểm tra email để đặt lại mật khẩu”.

// ForgotPassword.jsx
// Trang quên mật khẩu

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    
    // TODO: Implement forgot password API
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Email khôi phục đã được gửi!');
    }, 1000);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Email đã được gửi!
          </h2>
          <p className="text-gray-600">
            Vui lòng kiểm tra email để đặt lại mật khẩu.
          </p>
        </div>
        <Link
          to="/auth/login"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Quên Mật Khẩu
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Nhập email để nhận link khôi phục mật khẩu
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập email của bạn"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Đang gửi...' : 'Gửi Email Khôi Phục'}
        </button>

        <div className="text-center text-sm text-gray-600">
          <Link to="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
