import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as friendAPI from '../services/api/friend';

// Async thunks
export const fetchFriendsList = createAsyncThunk(
    'friend/fetchList',
    async (_, { rejectWithValue }) => {
        try {
            const response = await friendAPI.getFriendsList();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch friends');
        }
    }
);

export const fetchFriendRequests = createAsyncThunk(
    'friend/fetchRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await friendAPI.getFriendRequests();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
        }
    }
);

export const sendFriendRequest = createAsyncThunk(
    'friend/sendRequest',
    async (addresseeId, { rejectWithValue }) => {
        try {
            const response = await friendAPI.sendFriendRequest(addresseeId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send request');
        }
    }
);

export const acceptFriendRequest = createAsyncThunk(
    'friend/acceptRequest',
    async (requesterId, { rejectWithValue }) => {
        try {
            const response = await friendAPI.acceptFriendRequest(requesterId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to accept request');
        }
    }
);

export const cancelFriendRequest = createAsyncThunk(
    'friend/cancelRequest',
    async (requesterId, { rejectWithValue }) => {
        try {
            const response = await friendAPI.cancelFriendRequest(requesterId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to cancel request');
        }
    }
);

export const unfriend = createAsyncThunk(
    'friend/unfriend',
    async (friendId, { rejectWithValue }) => {
        try {
            const response = await friendAPI.unfriend(friendId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to unfriend');
        }
    }
);

export const searchUsers = createAsyncThunk(
    'friend/searchUsers',
    async (searchData, { rejectWithValue }) => {
        try {
            const response = await friendAPI.searchUsers(searchData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to search users');
        }
    }
);

const friendSlice = createSlice({
    name: 'friend',
    initialState: {
        friends: [],
        requests: [],
        searchResults: [],
        onlineStatuses: {}, // { userId: 'online' | 'offline' | 'in_game' }
        loading: false,
        error: null,
        actionSuccess: false
    },
    reducers: {
        clearFriendError: (state) => {
            state.error = null;
        },
        clearActionSuccess: (state) => {
            state.actionSuccess = false;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
        },
        updateOnlineStatus: (state, action) => {
            const { userId, status } = action.payload;
            state.onlineStatuses[userId] = status;
        },
        setOnlineStatuses: (state, action) => {
            state.onlineStatuses = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Friends List
            .addCase(fetchFriendsList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFriendsList.fulfilled, (state, action) => {
                state.loading = false;
                state.friends = action.payload;
            })
            .addCase(fetchFriendsList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Friend Requests
            .addCase(fetchFriendRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFriendRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload;
            })
            .addCase(fetchFriendRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Send Friend Request
            .addCase(sendFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(sendFriendRequest.fulfilled, (state) => {
                state.loading = false;
                state.actionSuccess = true;
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Accept Friend Request
            .addCase(acceptFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.actionSuccess = true;
                // Remove from requests
                state.requests = state.requests.filter(
                    req => req.requester._id !== action.meta.arg
                );
            })
            .addCase(acceptFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Cancel Friend Request
            .addCase(cancelFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(cancelFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.actionSuccess = true;
                state.requests = state.requests.filter(
                    req => req.requester._id !== action.meta.arg
                );
            })
            .addCase(cancelFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Unfriend
            .addCase(unfriend.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.actionSuccess = false;
            })
            .addCase(unfriend.fulfilled, (state, action) => {
                state.loading = false;
                state.actionSuccess = true;
                state.friends = state.friends.filter(
                    friend => friend._id !== action.meta.arg
                );
            })
            .addCase(unfriend.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Search Users
            .addCase(searchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    clearFriendError,
    clearActionSuccess,
    clearSearchResults,
    updateOnlineStatus,
    setOnlineStatuses
} = friendSlice.actions;

export default friendSlice.reducer;
