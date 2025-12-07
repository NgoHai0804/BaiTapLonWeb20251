import React, { useState } from "react";
import { motion } from "framer-motion";

// LoginPage.jsx
// Yêu cầu: Tailwind CSS đã được cấu hình trong project.
// (Framer Motion là tuỳ chọn — nếu không cần animation, có thể bỏ import và <motion.div> -> <div> )

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const validate = () => {
    const e = {};
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) e.email = "Email là bắt buộc";
    else if (!emailRegex.test(email)) e.email = "Email không hợp lệ";
    if (!password) e.password = "Mật khẩu là bắt buộc";
    else if (password.length < 6) e.password = "Mật khẩu phải >= 6 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);
    try {
      // Giả lập request. Thay bằng fetch/axios gọi API thực tế của bạn.
      await new Promise((r) => setTimeout(r, 900));
      // Ví dụ: kiểm tra tạm
      if (email === "user@example.com" && password === "password123") {
        setMessage({ type: "success", text: "Đăng nhập thành công" });
        // TODO: redirect hoặc lưu token...
      } else {
        setMessage({ type: "error", text: "Email hoặc mật khẩu không đúng" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Có lỗi xảy ra. Thử lại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Đăng nhập</h1>
        <p className="text-sm text-gray-500 mb-6">Đăng nhập để tiếp tục vào ứng dụng của bạn</p>

        {message && (
          <div
            className={`text-sm mb-4 px-4 py-2 rounded-md ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                errors.email ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="you@domain.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-600 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  errors.password ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Mật khẩu của bạn"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-red-600 mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <a href="#" className="text-indigo-600 hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="text-xs text-gray-400">Hoặc tiếp tục với</div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="py-2 rounded-lg border hover:shadow-sm">
              Google
            </button>
            <button type="button" className="py-2 rounded-lg border hover:shadow-sm">
              Facebook
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Chưa có tài khoản? <a href="#" className="text-indigo-600 hover:underline">Đăng ký</a>
          </p>
        </form>

        <footer className="mt-6 text-xs text-gray-400 text-center">© {new Date().getFullYear()} Ứng dụng của bạn</footer>
      </motion.div>
    </div>
  );
}
