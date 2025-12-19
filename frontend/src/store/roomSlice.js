import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as roomAPI from '../services/api/roomApi';

// Async thunks
export const fetchRooms = createAsyncThunk(
    'room/fetchRooms',
    async (params, { rejectWithValue }) => {
        try {
            const response = await roomAPI.getRooms(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
        }
    }
);

export const createRoom = createAsyncThunk(
    'room/createRoom',
    async (roomData, { rejectWithValue }) => {
        try {
            const response = await roomAPI.createRoom(roomData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create room');
        }
    }
);

export const joinRoom = createAsyncThunk(
    'room/joinRoom',
    async ({ roomId, password }, { rejectWithValue }) => {
        try {
            const response = await roomAPI.joinRoom(roomId, password);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to join room');
        }
    }
);

export const leaveRoom = createAsyncThunk(
    'room/leaveRoom',
    async (roomId, { rejectWithValue }) => {
        try {
            const response = await roomAPI.leaveRoom(roomId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to leave room');
        }
    }
);

const roomSlice = createSlice({
    name: 'room',
    initialState: {
        rooms: [],
        currentRoom: null,
        loading: false,
        error: null,
        actionSuccess: false
    },
    reducers: {
        // Set rooms list (from socket or API)
        setRooms: (state, action) => {
            state.rooms = action.payload;
        },

        // Add new room (from socket event)
        addRoom: (state, action) => {
            const exists = state.rooms.find(r => r._id === action.payload._id);
            if (!exists) {
                state.rooms.unshift(action.payload);
            }
        },

        // Remove room (from socket event)
        removeRoom: (state, action) => {
            state.rooms = state.rooms.filter(r => r._id !== action.payload);
        },

        // Update room (from socket event)
        updateRoom: (state, action) => {
            const index = state.rooms.findIndex(r => r._id === action.payload._id);
            if (index !== -1) {
                state.rooms[index] = { ...state.rooms[index], ...action.payload };
            }
        },

        // Set current room
        setCurrentRoom: (state, action) => {
            state.currentRoom = action.payload;
        },

        // Clear error
        clearError: (state) => {
            state.error = null;
        },

        // Clear action success
        clearActionSuccess: (state) => {
            state.actionSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Rooms
            .addCase(fetchRooms.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRooms.fulfilled, (state, action) => {
                state.loading = false;
                state.rooms = action.payload;
            })
            .addCase(fetchRooms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Room
            .addCase(createRoom.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(createRoom.fulfilled, (state, action) => {
                state.loading = false;
                state.actionSuccess = true;
                state.currentRoom = action.payload;
            })
            .addCase(createRoom.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Join Room
            .addCase(joinRoom.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(joinRoom.fulfilled, (state, action) => {
                state.loading = false;
                state.actionSuccess = true;
                state.currentRoom = action.payload;
            })
            .addCase(joinRoom.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Leave Room
            .addCase(leaveRoom.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(leaveRoom.fulfilled, (state) => {
                state.loading = false;
                state.currentRoom = null;
            })
            .addCase(leaveRoom.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    setRooms,
    addRoom,
    removeRoom,
    updateRoom,
    setCurrentRoom,
    clearError,
    clearActionSuccess
} = roomSlice.actions;

export default roomSlice.reducer;