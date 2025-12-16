import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authApi from '../services/api/authApi'
import { toast } from 'react-toastify'

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authApi.login(credentials)
            return response
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await authApi.register(userData)
            return response
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await authApi.logout()
    } catch (error) {
        // Vẫn logout ở client dù server lỗi
        console.error('Logout error:', error)
    } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
})

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.getCurrentUser()
            return response
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

// Initial state
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
}

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        setCredentials: (state, action) => {
            const { user, token } = action.payload
            state.user = user
            state.token = token
            state.isAuthenticated = true

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.isAuthenticated = true

                // Lưu vào localStorage
                localStorage.setItem('token', action.payload.token)
                localStorage.setItem('user', JSON.stringify(action.payload.user))

                toast.success('Đăng nhập thành công!')
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message || 'Đăng nhập thất bại'
                toast.error(state.error)
            })

            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false
                // Có thể tự động login sau khi đăng ký
                if (action.payload.token) {
                    state.user = action.payload.user
                    state.token = action.payload.token
                    state.isAuthenticated = true

                    localStorage.setItem('token', action.payload.token)
                    localStorage.setItem('user', JSON.stringify(action.payload.user))
                }
                toast.success('Đăng ký thành công!')
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message || 'Đăng ký thất bại'
                toast.error(state.error)
            })

            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.loading = false
                toast.info('Đã đăng xuất')
            })

            // Get current user
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                localStorage.setItem('user', JSON.stringify(action.payload.user))
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false
                state.user = null
                state.token = null
                state.isAuthenticated = false
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            })
    },
})

export const { clearError, setCredentials, logout } = authSlice.actions
export default authSlice.reducer
