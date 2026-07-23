import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { SecureStorage } from "services/secureStorage";
import { SdkWalletService } from "sdk";
import { IWalletMeta } from "types/wallet";
import { withLoginLock } from "services/loginLock";
import {
    broadcastSessionLogin,
    clearSessionBroadcast,
} from "services/sessionChannel";
import {
    recordLoginAttempt,
    LoginAttemptStatus,
    LoginType,
    FailureReason,
    SuspiciousFlag,
    detectSuspiciousFlags,
} from "services/loginAuditLog";
import {
    buildContextKey,
    checkRateLimit,
    recordFailedAttempt,
    resetRateLimit,
    formatLockoutMessage,
} from "services/loginRateLimit";
import { loadWalletsFromStorage } from "store/WalletsStore/thunks";
import { getWalletAndAccountFromWalletsMeta } from "store/WalletsStore/helpers";
import { RootState } from "store";

export interface AuthState {
    isAuthenticated: boolean;
    idleTimeout: number;
    lastActivity: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    idleTimeout: SecureStorage.getSettings().idleTimeout,
    lastActivity: Date.now(),
    isLoading: false,
    error: null,
};

type CreateAccountPayload = {
    name: string;
    password: string;
    networkId?: string;
};

export interface ICreateAccountResponse {
    wallet: IWalletMeta;
    privateKeyHex: string;
}

export const createAccountWithPassword = createAsyncThunk<
    ICreateAccountResponse,
    CreateAccountPayload
>("auth/createAccountWithPassword", async ({ name, password }) => {
    const privateKeyHex = SdkWalletService.generatePrivateKeyHex();

    const wallet = await SdkWalletService.createPrivateKeyWallet({
        name,
        privateKeyHex,
        password,
    });

    broadcastSessionLogin(SecureStorage.generateSessionToken());

    return { wallet, privateKeyHex };
});

type ImportAccountPayload = {
    name: string;
    value: string;
    type: "private" | "public" | "eth" | "rev";
    password: string;
    networkId?: string;
};

export const importAccountWithPassword = createAsyncThunk<
    IWalletMeta,
    ImportAccountPayload
>("auth/importAccountWithPassword", async ({ name, value, type, password }) => {
    if (type !== "private") {
        throw new Error(
            "Only private key import is supported. Watch-only import was removed with the SDK migration.",
        );
    }

    const wallet = await SdkWalletService.createPrivateKeyWallet({
        name,
        privateKeyHex: value,
        password,
    });

    broadcastSessionLogin(SecureStorage.generateSessionToken());

    return wallet;
});

// type ImportKeyfilePayload = {
//     keyfileContent: string;
//     name: string;
//     networkId?: string;
// };

//TODO: Restore after the SDK ships keyfile export/import support
// export const importFromKeyfile = createAsyncThunk(
//     "auth/importFromKeyfile",
//     async (
//         { keyfileContent, name, networkId }: ImportKeyfilePayload,
//         { getState },
//     ) => {
//         const state = getState() as { wallet: { selectedNetwork?: Network } };
//         const selectedNetworkId =
//             networkId || state.wallet?.selectedNetwork?.id;

//         let userId = SecureStorage.getCurrentUserId();
//         if (!userId) {
//             throw new Error("Please login first before importing a keyfile");
//         }

//         const secureAccount = await SecureStorage.importFromKeyfile(
//             keyfileContent,
//             name,
//             selectedNetworkId,
//             userId,
//         );
//         return secureAccount;
//     },
// );

const LOCK_WAIT_THRESHOLD_MS = 500;

function classifyLoginError(err: unknown): FailureReason {
    if (err instanceof DOMException) {
        if (err.name === "AbortError") return FailureReason.Cancelled;
        if (err.name === "TimeoutError") return FailureReason.Timeout;
    }
    if (err instanceof TypeError) {
        const message = err.message.toLowerCase();
        if (
            message.includes("network") ||
            message.includes("failed to fetch")
        ) {
            return FailureReason.NetworkError;
        }
    }
    return FailureReason.Unknown;
}

function isCredentialFailure(reason: FailureReason): boolean {
    return (
        reason === FailureReason.WrongPassword ||
        reason === FailureReason.NoAccount
    );
}

async function handleLoginOutcome(
    succeeded: boolean,
    contextKey: string,
    failureReason: FailureReason | undefined,
    accountName: string | undefined,
    loginType: LoginType,
): Promise<void> {
    if (succeeded) {
        await resetRateLimit(contextKey);
        await recordLoginAttempt(
            LoginAttemptStatus.Success,
            accountName,
            loginType,
        );
        return;
    }

    const reason = failureReason ?? FailureReason.Unknown;

    // Detect suspicious patterns before writing the entry
    const flags = isCredentialFailure(reason)
        ? await detectSuspiciousFlags(accountName)
        : undefined;

    // Increment rate-limit counter for credential failures only
    let justLocked = false;
    if (isCredentialFailure(reason)) {
        const rateLimitResult = await recordFailedAttempt(contextKey);
        justLocked = rateLimitResult.locked;
    }

    // Record the failure with any suspicious flags attached
    await recordLoginAttempt(
        LoginAttemptStatus.Failure,
        accountName,
        loginType,
        reason,
        flags,
    );

    // If this failure triggered the lockout, record a separate AccountLocked event
    if (justLocked) {
        await recordLoginAttempt(
            LoginAttemptStatus.AccountLocked,
            accountName,
            loginType,
            FailureReason.RateLimited,
            [SuspiciousFlag.RateLimitTriggered],
        );
    }
}

export const loginWithPassword = createAsyncThunk<
    IWalletMeta[],
    { password: string; accountName?: string },
    { state: RootState }
>("auth/loginWithPassword", async ({ password, accountName }, { getState }) => {
    const loginType = accountName ? LoginType.ByName : LoginType.AllAccounts;
    const contextKey = buildContextKey(accountName);
    let failureReason: FailureReason | undefined;
    let succeeded = false;

    try {
        const rateLimitStatus = await checkRateLimit(contextKey);
        if (rateLimitStatus.locked) {
            failureReason = FailureReason.RateLimited;
            throw new Error(formatLockoutMessage(rateLimitStatus.remainingMs));
        }

        const lockWaitStart = Date.now();

        const unlockedWallets = await withLoginLock(async () => {
            // Double-check rate limit inside the lock (TOCTOU: another tab may have
            // triggered lockout between the outer check and acquiring this lock)
            const innerStatus = await checkRateLimit(contextKey);
            if (innerStatus.locked) {
                failureReason = FailureReason.RateLimited;
                throw new Error(formatLockoutMessage(innerStatus.remainingMs));
            }

            const lockWaitMs = Date.now() - lockWaitStart;
            if (lockWaitMs > LOCK_WAIT_THRESHOLD_MS) {
                failureReason = FailureReason.LockContention;
            }

            const walletsMeta = await SdkWalletService.loadWallets();

            if (walletsMeta.length === 0) {
                failureReason = FailureReason.NoAccount;
                throw new Error("No accounts found");
            }

            const candidates = accountName
                ? walletsMeta.filter((wallet) =>
                      wallet.accounts.some(
                          (account) => account.name === accountName,
                      ),
                  )
                : walletsMeta;

            if (candidates.length === 0) {
                failureReason = FailureReason.NoAccount;
                throw new Error("Account not found");
            }

            const unlocked: IWalletMeta[] = [];

            for (const wallet of candidates) {
                try {
                    unlocked.push(
                        await SdkWalletService.unlockWallet(
                            wallet.signerId,
                            password,
                        ),
                    );
                } catch {
                    failureReason = FailureReason.WrongPassword;
                }
            }

            if (unlocked.length === 0) {
                failureReason = FailureReason.WrongPassword;
                throw new Error("Incorrect password");
            }

            broadcastSessionLogin(SecureStorage.generateSessionToken());

            return unlocked;
        });

        succeeded = true;

        return unlockedWallets;
    } catch (err: unknown) {
        if (!failureReason) {
            failureReason = classifyLoginError(err);
        }
        throw err;
    } finally {
        await handleLoginOutcome(
            succeeded,
            contextKey,
            failureReason,
            accountName,
            loginType,
        );
    }
});

export const unlockAccount = createAsyncThunk<
    IWalletMeta,
    { accountId: string; password: string },
    { state: RootState }
>("auth/unlockAccount", async ({ accountId, password }, { getState }) => {
    const walletAndAccountPath = getWalletAndAccountFromWalletsMeta(
        getState().walletsStore.wallets,
        accountId,
    );

    if (!walletAndAccountPath) {
        throw new Error("Account not found");
    }

    return SdkWalletService.unlockWallet(
        walletAndAccountPath.wallet.signerId,
        password,
    );
});

export const logout = createAsyncThunk("auth/logout", async () => {
    SdkWalletService.lockAll();
    clearSessionBroadcast();
});

//TODO: Restore after the SDK ships keyfile export/import support
// export const exportAccountKeyfile = createAsyncThunk(
//     "auth/exportAccountKeyfile",
//     async ({ accountId }: { accountId: string }) => {
//         const keyfile = SecureStorage.exportAccount(accountId);
//         if (!keyfile) {
//             throw new Error("Account not found");
//         }

//         const blob = new Blob([keyfile], { type: "application/json" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `asi-wallet-${accountId}-${Date.now()}.json`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);

//         return { accountId, success: true };
//     },
// );

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
            state.isAuthenticated =
                SdkWalletService.getUnlockedWallets().length > 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createAccountWithPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAccountWithPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthenticated = true;
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
            .addCase(importAccountWithPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthenticated = true;
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
            .addCase(loginWithPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthenticated = true;
            })
            .addCase(loginWithPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || "Login failed";
            })
            .addCase(unlockAccount.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(unlockAccount.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthenticated = true;
            })
            .addCase(unlockAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to unlock account";
            })
            .addCase(logout.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(loadWalletsFromStorage.fulfilled, (state, action) => {
                state.isAuthenticated = action.payload.some(
                    (wallet) => wallet.isUnlocked,
                );
            });
    },
});

export const {
    updateActivity,
    updateSettings,
    clearError,
    checkAuthentication,
} = authSlice.actions;

export default authSlice.reducer;
