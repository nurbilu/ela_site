import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch the cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/carts/my_cart/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch cart');
    }
  }
);

// Add item to cart
export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async ({ art_picture_id, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/carts/add_item/', {
        art_picture_id,
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add item to cart');
    }
  }
);

// Remove item from cart
export const removeItemFromCart = createAsyncThunk(
  'cart/removeItem',
  async (item_id, { rejectWithValue }) => {
    try {
      await api.post('/api/carts/remove_item/', { item_id });
      return item_id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove item from cart');
    }
  }
);

// Update item quantity
export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ item_id, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/carts/update_item_quantity/', {
        item_id,
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update item quantity');
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/carts/clear/');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to clear cart');
    }
  }
);

const initialState = {
  cart: null,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add item
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove item
      .addCase(removeItemFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = state.cart.items.filter(item => item.id !== action.payload);
        }
        state.error = null;
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update item quantity
      .addCase(updateItemQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        if (state.cart) {
          const index = state.cart.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.cart.items[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = [];
          state.cart.total_price = 0;
        }
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetCart } = cartSlice.actions;
export default cartSlice.reducer; 