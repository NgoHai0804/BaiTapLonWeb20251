import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiArrowLeft } from 'react-icons/fi'
import authApi from '../../services/api/authApi'
import { toast } from 'react-toastify'

/**
 * Trang quên mật khẩu
 */
const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const validateEmail = () => {
        if (!email) {
            setError('Email không được để trống')
            return false
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email không hợp lệ')
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateEmail()) {
            return
        }

        setLoading(true)

        try {
            await authApi.forgotPassword(email)
            setSubmitted(true)
            toast.success('Đã gửi email khôi phục mật khẩu!')
        } catch (error) {
            setError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
            toast.error(error.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
        if (error) {
            setError('')
        }
    }

    if (submitted) {
        return (
            <div className="forgot-password-page text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Kiểm tra email của bạn</h2>
                    <p className="text-gray-600">
                        Chúng tôi đã gửi link khôi phục mật khẩu đến email:
                    </p>
                    <p className="text-blue-600 font-medium mt-2">{email}</p>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Không nhận được email? Kiểm tra trong thư mục spam hoặc
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false)
                            setEmail('')
                        }}
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                    >
                        Gửi lại
                    </button>
                </div>

                <div className="mt-8">
                    <Link
                        to="/auth/login"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <FiArrowLeft />
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="forgot-password-page">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-600 mb-6">
                Nhập email của bạn và chúng tôi sẽ gửi link để khôi phục mật khẩu
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMail className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="your@email.com"
                        />
                    </div>
                    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Đang gửi...
                        </span>
                    ) : (
                        'Gửi link khôi phục'
                    )}
                </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
                <Link
                    to="/auth/login"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <FiArrowLeft />
                    Quay lại đăng nhập
                </Link>
            </div>
        </div>
    )
}

export default ForgotPassword