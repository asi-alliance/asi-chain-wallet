import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SecureStorage } from "services/secureStorage";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import { clearActiveSession, setActiveSession } from "./helpers";
import {
    createAccountWithPassword,
    importAccountWithPassword,
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
    error: string | null;
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
    error: null,
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
        clearError: (state) => {
            state.error = null;
        },
        checkAuthentication: (state) => {
            const activeSession = SdkWalletService.getActiveSession();

            if (activeSession) {
                setActiveSession(state, activeSession);
            } else {
                clearActiveSession(state);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createAccountWithPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAccountWithPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload.wallet);
            })
            .addCase(createAccountWithPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to create account";
            })
            .addCase(importAccountWithPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(importAccountWithPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(importAccountWithPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to import account";
            })
            .addCase(loginWithPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginWithPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(loginWithPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || "Login failed";
            })
            .addCase(unlockAccount.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(unlockAccount.fulfilled, (state, action) => {
                state.isLoading = false;
                setActiveSession(state, action.payload);
            })
            .addCase(unlockAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to unlock account";
            })
            .addCase(logout.fulfilled, (state) => {
                clearActiveSession(state);
                state.error = null;
            });
    },
});

export const {
    updateActivity,
    updateSettings,
    clearError,
    checkAuthentication,
} = authSlice.actions;

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
