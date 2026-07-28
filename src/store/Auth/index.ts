import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SecureStorage } from "services/secureStorage";
import { RootState } from "store";
import { clearActiveSession, setActiveSession } from "./helpers";
import {
    createHdWallet,
    deriveHdAccount,
    importHdWallet,
    importPrivateKeyWallet,
    loginWithPassword,
    logout,
    unlockAccount,
} from "./thunks";

export type SessionStatus = "locked" | "unlocked";

export interface AuthState {
    activeWalletId: string | null;
    activeSignerId: string | null;
    status: SessionStatus;
    unlockedAt: number | null;
    isAuthenticated: boolean;
    idleTimeout: number;
    lastActivity: number;
    isLoading: boolean;
}

const initialState: AuthState = {
    activeWalletId: null,
    activeSignerId: null,
    status: "locked",
    unlockedAt: null,
    isAuthenticated: false,
    idleTimeout: SecureStorage.getSettings().idleTimeout,
    lastActivity: Date.now(),
    isLoading: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        updateActivity: (state) => {
            state.lastActivity = Date.now();
            SecureStorage.updateLastActivity();
        },
        updateSettings: (
            state,
            action: PayloadAction<{
                idleTimeout?: number;
            }>,
        ) => {
            if (action.payload.idleTimeout !== undefined) {
                state.idleTimeout = action.payload.idleTimeout;
            }
            SecureStorage.updateSettings(action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createHdWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createHdWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(createHdWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(importHdWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(importHdWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(importHdWallet.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(importPrivateKeyWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(importPrivateKeyWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(importPrivateKeyWallet.rejected, (state) => {
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
                setActiveSession(state, action.payload);
            })
            .addCase(loginWithPassword.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(unlockAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(unlockAccount.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(unlockAccount.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(logout.fulfilled, (state) => {
                clearActiveSession(state);
            });
    },
});

export const { updateActivity, updateSettings } = authSlice.actions;

export const selectAuth = (state: RootState): AuthState => state.auth;
export const selectActiveSignerId = (state: RootState): string | null =>
    state.auth.activeSignerId;
export const selectActiveWalletId = (state: RootState): string | null =>
    state.auth.activeWalletId;
export const selectSessionStatus = (state: RootState): SessionStatus =>
    state.auth.status;
export const selectIsAuthenticated = (state: RootState): boolean =>
    state.auth.isAuthenticated;

export default authSlice.reducer;
