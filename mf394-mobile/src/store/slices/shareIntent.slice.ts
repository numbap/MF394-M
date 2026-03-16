import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './auth.slice';

interface ShareIntentState {
  pendingImageUri: string | null;
}

const initialState: ShareIntentState = {
  pendingImageUri: null,
};

const shareIntentSlice = createSlice({
  name: 'shareIntent',
  initialState,
  reducers: {
    setSharedImage(state, action: PayloadAction<string>) {
      state.pendingImageUri = action.payload;
    },
    clearSharedImage(state) {
      state.pendingImageUri = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.pendingImageUri = null;
    });
  },
});

export const { setSharedImage, clearSharedImage } = shareIntentSlice.actions;
export default shareIntentSlice.reducer;
