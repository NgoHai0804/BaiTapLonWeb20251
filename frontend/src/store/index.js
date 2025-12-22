import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import userReducer from './userSlice'
import friendReducer from './friendSlice'
import roomReducer from './roomSlice'
import chatReducer from './chatSlice'
import notificationReducer from './notificationSlice'

// Import slices here (create empty ones if needed or just a dummy reducer for now)
// import gameReducer from './gameSlice'

const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        friend: friendReducer,
        room: roomReducer,
        chat: chatReducer,
        notification: notificationReducer,
        // game: gameReducer,
    },
})

export default store