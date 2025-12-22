import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        // Global chat messages (lobby, room chat)
        globalMessages: [],

        // Private messages organized by userId
        // { userId: [messages] }
        privateChats: {},

        // Active chat (null = global, userId = private)
        activeChat: null,

        // Unread counts
        // { userId: count }
        unreadCounts: {},

        // Typing indicators
        // { userId: boolean }
        typingUsers: {},

        // Online users
        onlineUsers: [],
    },
    reducers: {
        // Add message to global chat
        addGlobalMessage: (state, action) => {
            state.globalMessages.push({
                ...action.payload,
                timestamp: action.payload.timestamp || new Date().toISOString()
            });

            // Keep only last 100 messages
            if (state.globalMessages.length > 100) {
                state.globalMessages = state.globalMessages.slice(-100);
            }
        },

        // Add private message
        addPrivateMessage: (state, action) => {
            const { userId, message } = action.payload;

            if (!state.privateChats[userId]) {
                state.privateChats[userId] = [];
            }

            state.privateChats[userId].push({
                ...message,
                timestamp: message.timestamp || new Date().toISOString()
            });

            // Keep only last 50 messages per user
            if (state.privateChats[userId].length > 50) {
                state.privateChats[userId] = state.privateChats[userId].slice(-50);
            }

            // Increment unread count if not active chat
            if (state.activeChat !== userId) {
                state.unreadCounts[userId] = (state.unreadCounts[userId] || 0) + 1;
            }
        },

        // Set active chat
        setActiveChat: (state, action) => {
            state.activeChat = action.payload;

            // Reset unread count for this chat
            if (action.payload) {
                state.unreadCounts[action.payload] = 0;
            }
        },

        // Clear messages
        clearGlobalMessages: (state) => {
            state.globalMessages = [];
        },

        clearPrivateChat: (state, action) => {
            const userId = action.payload;
            delete state.privateChats[userId];
            delete state.unreadCounts[userId];
        },

        // Mark messages as read
        markAsRead: (state, action) => {
            const userId = action.payload;
            state.unreadCounts[userId] = 0;
        },

        // Set typing indicator
        setTyping: (state, action) => {
            const { userId, isTyping } = action.payload;
            if (isTyping) {
                state.typingUsers[userId] = true;
            } else {
                delete state.typingUsers[userId];
            }
        },

        // Set online users
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },

        // Add online user
        addOnlineUser: (state, action) => {
            const userId = action.payload;
            if (!state.onlineUsers.includes(userId)) {
                state.onlineUsers.push(userId);
            }
        },

        // Remove online user
        removeOnlineUser: (state, action) => {
            const userId = action.payload;
            state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
        },

        // Reset chat state
        resetChat: (state) => {
            state.globalMessages = [];
            state.privateChats = {};
            state.activeChat = null;
            state.unreadCounts = {};
            state.typingUsers = {};
            state.onlineUsers = [];
        }
    }
});

export const {
    addGlobalMessage,
    addPrivateMessage,
    setActiveChat,
    clearGlobalMessages,
    clearPrivateChat,
    markAsRead,
    setTyping,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    resetChat
} = chatSlice.actions;

export default chatSlice.reducer;