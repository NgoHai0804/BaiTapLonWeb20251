import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

// Import slices here (create empty ones if needed or just a dummy reducer for now)
// import userReducer from './userSlice'
// import gameReducer from './gameSlice'

const store = configureStore({
    reducer: {
        auth: authReducer,
        // user: userReducer,
        // game: gameReducer,
    },
})

export default store