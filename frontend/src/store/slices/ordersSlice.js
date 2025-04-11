import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch user orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/orders/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch orders');
    }
  }
);

// Fetch single order
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/orders/${id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch order');
    }
  }
);

// Create order (checkout)
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/orders/checkout/', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create order');
    }
  }
);

// Process payment
export const processPayment = createAsyncThunk(
  'orders/processPayment',
  async ({ orderId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/process_payment/`, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to process payment');
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  paymentLoading: false,
  error: null,
  paymentError: null,
  paymentSuccess: false
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentStatus: (state) => {
      state.paymentLoading = false;
      state.paymentError = null;
      state.paymentSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Process payment
      .addCase(processPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentSuccess = false;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentSuccess = true;
        state.paymentError = null;
        
        // Update order status in orders list
        const index = state.orders.findIndex(order => order.id === state.currentOrder.id);
        if (index !== -1) {
          state.orders[index].status = 'paid';
          state.orders[index].paid_at = new Date().toISOString();
        }
        
        // Update current order
        if (state.currentOrder) {
          state.currentOrder.status = 'paid';
          state.currentOrder.paid_at = new Date().toISOString();
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentSuccess = false;
        state.paymentError = action.payload;
      });
  },
});

export const { clearCurrentOrder, clearError, clearPaymentStatus } = ordersSlice.actions;
export default ordersSlice.reducer; 