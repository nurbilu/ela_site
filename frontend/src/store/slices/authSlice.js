import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Check if user is authenticated
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/users/me/');
      return response.data;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return rejectWithValue(error.response?.data || 'Authentication failed');
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/token/', credentials);
      const { access, refresh } = response.data;
      
      // Save tokens to local storage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Get user info
      const userResponse = await api.get('/api/users/me/');
      return userResponse.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

// Register user
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/api/users/', userData);
      
      // Login after successful registration
      await dispatch(loginUser({
        username: userData.username,
        password: userData.password
      }));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Registration failed');
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Clear tokens from local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.is_staff;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.is_staff;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 