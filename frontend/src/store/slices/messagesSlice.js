import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch user messages
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/messages/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch messages');
    }
  }
);

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/messages/${messageId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to mark message as read');
    }
  }
);

// Send a public message (admin only)
export const sendPublicMessage = createAsyncThunk(
  'messages/sendPublicMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/messages/send_public_message/', messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send public message');
    }
  }
);

// Send a message to a specific user (admin only)
export const sendUserMessage = createAsyncThunk(
  'messages/sendUserMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/messages/send_user_message/', messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send user message');
    }
  }
);

const initialState = {
  messages: [],
  loading: false,
  sendingMessage: false,
  error: null,
  sendError: null,
  messageSent: false,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.sendError = null;
    },
    resetMessageSent: (state) => {
      state.messageSent = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markMessageAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.messages.findIndex(msg => msg.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send public message
      .addCase(sendPublicMessage.pending, (state) => {
        state.sendingMessage = true;
        state.messageSent = false;
      })
      .addCase(sendPublicMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        state.messages.unshift(action.payload); // Add to the beginning of the array
        state.sendError = null;
        state.messageSent = true;
      })
      .addCase(sendPublicMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendError = action.payload;
        state.messageSent = false;
      })
      
      // Send user message
      .addCase(sendUserMessage.pending, (state) => {
        state.sendingMessage = true;
        state.messageSent = false;
      })
      .addCase(sendUserMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        state.messages.unshift(action.payload); // Add to the beginning of the array
        state.sendError = null;
        state.messageSent = true;
      })
      .addCase(sendUserMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendError = action.payload;
        state.messageSent = false;
      });
  },
});

export const { clearError, resetMessageSent } = messagesSlice.actions;
export default messagesSlice.reducer; 