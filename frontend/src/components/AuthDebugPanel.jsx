import { useAuth } from '../hooks/useAuth'
import { FiUser, FiMail, FiShield, FiLogOut, FiRefreshCw } from 'react-icons/fi'

/**
 * Component hiển thị thông tin user và auth state
 * Sử dụng để test/debug authentication
 */
const AuthDebugPanel = () => {
    const { user, token, isAuthenticated, loading, refreshUser, logout } = useAuth()

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🔐 Auth Debug Panel</h2>
                <div className="flex gap-2">
                    <button
                        onClick={refreshUser}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Refresh user data"
                    >
                        <FiRefreshCw className="w-5 h-5" />
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Authentication Status */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    ></div>
                    <span className="font-semibold">
                        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    </span>
                </div>
                {loading && (
                    <div className="text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                            <svg
                                className="animate-spin h-4 w-4"
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
                            Loading...
                        </span>
                    </div>
                )}
            </div>

            {/* User Info */}
            {isAuthenticated && user && (
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        User Information
                    </h3>

                    <div className="grid gap-3">
                        <InfoRow icon={<FiUser />} label="Username" value={user.username} />
                        <InfoRow icon={<FiMail />} label="Email" value={user.email} />
                        {user.id && <InfoRow icon={<FiShield />} label="User ID" value={user.id} />}
                        {user.createdAt && (
                            <InfoRow
                                icon={<FiShield />}
                                label="Created At"
                                value={new Date(user.createdAt).toLocaleString('vi-VN')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Token Info */}
            {token && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        JWT Token
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500">TOKEN:</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(token)
                                    alert('Token copied to clipboard!')
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="font-mono text-xs text-gray-600 break-all">
                            {token.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Length: {token.length} characters
                        </div>
                    </div>
                </div>
            )}

            {/* Not Authenticated */}
            {!isAuthenticated && (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Bạn chưa đăng nhập</p>
                    <a
                        href="/auth/login"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đăng nhập ngay
                    </a>
                </div>
            )}

            {/* LocalStorage Preview */}
            <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    LocalStorage Preview
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded">
                        <div className="font-semibold text-gray-600 mb-1">Has Token</div>
                        <div className={localStorage.getItem('token') ? 'text-green-600' : 'text-red-600'}>
                            {localStorage.getItem('token') ? '✓ Yes' : '✗ No'}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <div className="font-semibold text-gray-600 mb-1">Has User</div>
                        <div className={localStorage.getItem('user') ? 'text-green-600' : 'text-red-600'}>
                            {localStorage.getItem('user') ? '✓ Yes' : '✗ No'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper component for info rows
const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="text-gray-500">{icon}</div>
        <div className="flex-1">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm font-medium text-gray-800">{value || 'N/A'}</div>
        </div>
    </div>
)

export default AuthDebugPanel
