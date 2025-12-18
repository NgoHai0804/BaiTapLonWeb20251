import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userAPI from '../services/api/user';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
    'user/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await userAPI.getUserProfile();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'user/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await userAPI.updateUserProfile(profileData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    }
);

export const fetchUserStats = createAsyncThunk(
    'user/fetchStats',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await userAPI.getUserStats(userId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        profile: null,
        stats: null,
        loading: false,
        error: null,
        updateSuccess: false
    },
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        },
        clearUpdateSuccess: (state) => {
            state.updateSuccess = false;
        },
        setProfile: (state, action) => {
            state.profile = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Profile
            .addCase(updateUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
                state.updateSuccess = true;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Stats
            .addCase(fetchUserStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchUserStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearUserError, clearUpdateSuccess, setProfile } = userSlice.actions;
export default userSlice.reducer;