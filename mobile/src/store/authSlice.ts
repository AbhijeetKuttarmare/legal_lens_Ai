import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '../api/types';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = { user: null, status: 'idle' };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    setUnauthenticated(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setAuthenticated, setUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
