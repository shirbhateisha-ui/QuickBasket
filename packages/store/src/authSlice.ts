import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PublicUser } from '@quickbasket/types';

export interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  // The refresh token is persisted via secure storage by the app layer.
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: PublicUser; accessToken: string; refreshToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { setCredentials, setTokens, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectIsLoggedIn = (state: { auth: AuthState }) => Boolean(state.auth.accessToken);
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
