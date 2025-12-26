import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchRandomImageFromApi, UnsplashImage } from './imageAPI';

interface ImageState {
    images: UnsplashImage[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ImageState = {
    images: [],
    status: 'idle',
    error: null,
};

export const fetchRandomImage = createAsyncThunk(
    'image/fetchRandom',
    async (count: number = 30) => {
        const response = await fetchRandomImageFromApi(count);
        return response;
    }
);

export const imageSlice = createSlice({
    name: 'image',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRandomImage.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchRandomImage.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.images = action.payload;
            })
            .addCase(fetchRandomImage.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch image';
            });
    },
});

export default imageSlice.reducer;
