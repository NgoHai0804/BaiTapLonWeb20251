import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        // Array of notifications
        notifications: [],

        // Unread count
        unreadCount: 0,

        // Sound enabled
        soundEnabled: true,
    },
    reducers: {
        // Add notification
        addNotification: (state, action) => {
            const notification = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                read: false,
                ...action.payload
            };

            state.notifications.unshift(notification);
            state.unreadCount += 1;

            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
                state.notifications = state.notifications.slice(0, 50);
            }
        },

        // Mark notification as read
        markAsRead: (state, action) => {
            const notificationId = action.payload;
            const notification = state.notifications.find(n => n.id === notificationId);

            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },

        // Mark all as read
        markAllAsRead: (state) => {
            state.notifications.forEach(n => {
                n.read = true;
            });
            state.unreadCount = 0;
        },

        // Remove notification
        removeNotification: (state, action) => {
            const notificationId = action.payload;
            const index = state.notifications.findIndex(n => n.id === notificationId);

            if (index !== -1) {
                if (!state.notifications[index].read) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications.splice(index, 1);
            }
        },

        // Clear all notifications
        clearAllNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        },

        // Toggle sound
        toggleSound: (state) => {
            state.soundEnabled = !state.soundEnabled;
        },

        // Set sound
        setSound: (state, action) => {
            state.soundEnabled = action.payload;
        }
    }
});

export const {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    toggleSound,
    setSound
} = notificationSlice.actions;

export default notificationSlice.reducer;

/**
 * Notification Types:
 * - 'friend_online': Friend came online
 * - 'friend_offline': Friend went offline
 * - 'friend_request': New friend request
 * - 'friend_accepted': Friend request accepted
 * - 'invite_room': Room invitation
 * - 'game_started': Game started
 * - 'game_ended': Game ended
 * - 'message': New message
 * - 'system': System notification
 */
