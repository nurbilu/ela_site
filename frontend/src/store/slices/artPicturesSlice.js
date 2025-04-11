import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch all art pictures
export const fetchArtPictures = createAsyncThunk(
  'artPictures/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/art-pictures/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch art pictures');
    }
  }
);

// Fetch a single art picture by ID
export const fetchArtPictureById = createAsyncThunk(
  'artPictures/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/art-pictures/${id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch art picture');
    }
  }
);

// Create a new art picture (admin only)
export const createArtPicture = createAsyncThunk(
  'artPictures/create',
  async (artPictureData, { rejectWithValue }) => {
    try {
      // Use FormData to handle file uploads
      const formData = new FormData();
      Object.keys(artPictureData).forEach(key => {
        formData.append(key, artPictureData[key]);
      });
      
      const response = await api.post('/api/art-pictures/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create art picture');
    }
  }
);

// Update an existing art picture (admin only)
export const updateArtPicture = createAsyncThunk(
  'artPictures/update',
  async ({ id, artPictureData }, { rejectWithValue }) => {
    try {
      // Use FormData to handle file uploads
      const formData = new FormData();
      Object.keys(artPictureData).forEach(key => {
        if (artPictureData[key] !== null && artPictureData[key] !== undefined) {
          formData.append(key, artPictureData[key]);
        }
      });
      
      const response = await api.patch(`/api/art-pictures/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update art picture');
    }
  }
);

// Delete an art picture (admin only)
export const deleteArtPicture = createAsyncThunk(
  'artPictures/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/art-pictures/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete art picture');
    }
  }
);

const initialState = {
  artPictures: [],
  currentArtPicture: null,
  loading: false,
  error: null,
};

const artPicturesSlice = createSlice({
  name: 'artPictures',
  initialState,
  reducers: {
    clearCurrentArtPicture: (state) => {
      state.currentArtPicture = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchArtPictures.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchArtPictures.fulfilled, (state, action) => {
        state.loading = false;
        state.artPictures = action.payload;
        state.error = null;
      })
      .addCase(fetchArtPictures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by ID
      .addCase(fetchArtPictureById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchArtPictureById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentArtPicture = action.payload;
        state.error = null;
      })
      .addCase(fetchArtPictureById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create
      .addCase(createArtPicture.pending, (state) => {
        state.loading = true;
      })
      .addCase(createArtPicture.fulfilled, (state, action) => {
        state.loading = false;
        state.artPictures.push(action.payload);
        state.error = null;
      })
      .addCase(createArtPicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update
      .addCase(updateArtPicture.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateArtPicture.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.artPictures.findIndex(pic => pic.id === action.payload.id);
        if (index !== -1) {
          state.artPictures[index] = action.payload;
        }
        if (state.currentArtPicture?.id === action.payload.id) {
          state.currentArtPicture = action.payload;
        }
        state.error = null;
      })
      .addCase(updateArtPicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete
      .addCase(deleteArtPicture.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteArtPicture.fulfilled, (state, action) => {
        state.loading = false;
        state.artPictures = state.artPictures.filter(pic => pic.id !== action.payload);
        if (state.currentArtPicture?.id === action.payload) {
          state.currentArtPicture = null;
        }
        state.error = null;
      })
      .addCase(deleteArtPicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentArtPicture, clearError } = artPicturesSlice.actions;
export default artPicturesSlice.reducer; 