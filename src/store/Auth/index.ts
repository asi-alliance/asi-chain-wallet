import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "store";
import { clearActiveSession, setActiveSession } from "./helpers";
import {
    createHdWallet,
    deriveHdAccount,
    importHdWallet,
    importKeyfileWallet,
    importPrivateKeyWallet,
    loginWithPassword,
    logout,
} from "./thunks";

export interface AuthState {
    activeWalletId: string | null;
    activeSignerId: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const initialState: AuthState = {
    activeWalletId: null,
    activeSignerId: null,
    isAuthenticated: false,
    isLoading: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createHdWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createHdWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(createHdWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(importHdWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(importHdWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(importHdWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(importPrivateKeyWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(importPrivateKeyWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(importPrivateKeyWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(importKeyfileWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(importKeyfileWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(importKeyfileWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(deriveHdAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deriveHdAccount.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(deriveHdAccount.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(loginWithPassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loginWithPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(loginWithPassword.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(logout.fulfilled, (state) => {
                clearActiveSession(state);
            });
    },
});

export const selectAuth = (state: RootState): AuthState => state.auth;
export const selectActiveSignerId = (state: RootState): string | null =>
    state.auth.activeSignerId;
export const selectActiveWalletId = (state: RootState): string | null =>
    state.auth.activeWalletId;
export const selectIsAuthenticated = (state: RootState): boolean =>
    state.auth.isAuthenticated;

export default authSlice.reducer;
