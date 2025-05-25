import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunk for fetching orders grouped by user
export const fetchOrdersGroupedByUser = createAsyncThunk(
  'orderUserView/fetchOrdersGroupedByUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/order-user-view/grouped_by_user/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders grouped by user');
    }
  }
);

// Async thunk for fetching all order user view data
export const fetchOrderUserView = createAsyncThunk(
  'orderUserView/fetchOrderUserView',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/order-user-view/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order user view');
    }
  }
);

const orderUserViewSlice = createSlice({
  name: 'orderUserView',
  initialState: {
    groupedOrders: [],
    allOrders: [],
    loading: false,
    error: null,
    lastFetch: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOrderUserView: (state) => {
      state.groupedOrders = [];
      state.allOrders = [];
      state.loading = false;
      state.error = null;
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders grouped by user
      .addCase(fetchOrdersGroupedByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersGroupedByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.groupedOrders = action.payload;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchOrdersGroupedByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all order user view data
      .addCase(fetchOrderUserView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderUserView.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = action.payload;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchOrderUserView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetOrderUserView } = orderUserViewSlice.actions;
export default orderUserViewSlice.reducer; 