import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { SecureStorage, SecureAccount } from "services/secureStorage";
import { Account, Network } from "types/wallet";
import {
    generateKeyPair,
    importPrivateKey,
    importEthAddress,
    importRevAddress,
} from "utils/crypto";
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

export interface AuthState {
    isAuthenticated: boolean;
    hasAccounts: boolean;
    unlockedAccounts: Account[];
    requirePasswordForTransaction: boolean;
    idleTimeout: number;
    lastActivity: number;
    isLoading: boolean;
    error: string | null;
}

const initUserId = SecureStorage.getCurrentUserId();
const initUnlockedAccounts = SecureStorage.getAllUnlockedAccounts();
const initHasUnlocked = initUnlockedAccounts.length > 0;
const initSessionToken = SecureStorage.getSessionToken();
const initIsAuthenticated =
    SecureStorage.isAuthenticated() &&
    initHasUnlocked &&
    !!initUserId &&
    !!initSessionToken;

if (!initIsAuthenticated && SecureStorage.isAuthenticated()) {
    SecureStorage.setAuthenticated(false);
}

const initialState: AuthState = {
    isAuthenticated: initIsAuthenticated,
    hasAccounts: SecureStorage.hasAccounts(initUserId ?? undefined),
    unlockedAccounts: initUnlockedAccounts,
    requirePasswordForTransaction:
        SecureStorage.getSettings().requirePasswordForTransaction,
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

export const createAccountWithPassword = createAsyncThunk(
    "auth/createAccountWithPassword",
    async (
        { name, password, networkId }: CreateAccountPayload,
        { getState },
    ) => {
        const state = getState() as { wallet: { selectedNetwork?: Network } };
        const selectedNetworkId =
            networkId || state.wallet?.selectedNetwork?.id;

        const userId = SecureStorage.generateUserIdFromPassword(password, name);
        const hadAccountsBefore = SecureStorage.hasAccounts(userId);

        const keyPair = generateKeyPair();
        const account: Account = {
            id: Date.now().toString(),
            name,
            address: keyPair.revAddress,
            revAddress: keyPair.revAddress,
            ethAddress: keyPair.ethAddress,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            balance: "0",
            ...(selectedNetworkId ? { networkId: selectedNetworkId } : {}),
            createdAt: new Date(),
        };

        await SecureStorage.saveAccount(account, password, userId, name);
        await SecureStorage.unlockAccount(account.id, password, userId);

        if (!hadAccountsBefore) {
            SecureStorage.setAuthenticated(true);
        }

        SecureStorage.setCurrentUserId(userId);
        const sessionToken = SecureStorage.generateSessionToken();
        SecureStorage.setSessionToken(sessionToken);
        broadcastSessionLogin(sessionToken);

        return { account, isFirstAccount: !hadAccountsBefore };
    },
);

const normalizeAddress = (address: string | undefined): string => {
    if (!address) return "";
    return address.toLowerCase().trim();
};
const checkAccountExists = (
    newAccount: Account,
    userId?: string | null,
): boolean => {
    const existingAccounts = userId
        ? SecureStorage.getEncryptedAccounts(userId)
        : SecureStorage.getEncryptedAccounts();
    const normalizedNewRev = normalizeAddress(newAccount.revAddress);
    const normalizedNewEth = normalizeAddress(newAccount.ethAddress);

    return existingAccounts.some((existing) => {
        const normalizedExistingRev = normalizeAddress(existing.revAddress);
        const normalizedExistingEth = normalizeAddress(existing.ethAddress);

        if (
            normalizedNewRev &&
            normalizedExistingRev &&
            normalizedNewRev === normalizedExistingRev
        ) {
            return true;
        }
        if (
            normalizedNewEth &&
            normalizedExistingEth &&
            normalizedNewEth === normalizedExistingEth
        ) {
            return true;
        }

        return false;
    });
};

type ImportAccountPayload = {
    name: string;
    value: string;
    type: "private" | "public" | "eth" | "rev";
    password: string;
    networkId?: string;
};

export const importAccountWithPassword = createAsyncThunk(
    "auth/importAccountWithPassword",
    async (
        { name, value, type, password, networkId }: ImportAccountPayload,
        { getState },
    ) => {
        const state = getState() as { wallet: { selectedNetwork?: Network } };
        const selectedNetworkId =
            networkId || state.wallet?.selectedNetwork?.id;

        const userId = SecureStorage.generateUserIdFromPassword(password, name);
        const hadAccountsBefore = SecureStorage.hasAccounts(userId);

        let accountData;

        switch (type) {
            case "private":
                accountData = importPrivateKey(value);
                break;
            case "eth":
                accountData = importEthAddress(value);
                break;
            case "rev":
                accountData = importRevAddress(value);
                break;
            default:
                throw new Error("Invalid import type");
        }

        const account: Account = {
            id: Date.now().toString(),
            name,
            address: accountData.revAddress!,
            revAddress: accountData.revAddress!,
            ethAddress: accountData.ethAddress!,
            publicKey: accountData.publicKey || "",
            privateKey: accountData.privateKey,
            balance: "0",
            ...(selectedNetworkId ? { networkId: selectedNetworkId } : {}),
            createdAt: new Date(),
        };

        if (checkAccountExists(account, userId)) {
            throw new Error("Account with this address already exists");
        }

        if (account.privateKey) {
            await SecureStorage.saveAccount(account, password, userId, name);
            await SecureStorage.unlockAccount(account.id, password, userId);
        }

        if (!hadAccountsBefore) {
            SecureStorage.setAuthenticated(true);
        }

        SecureStorage.setCurrentUserId(userId);
        const sessionToken = SecureStorage.generateSessionToken();
        SecureStorage.setSessionToken(sessionToken);
        broadcastSessionLogin(sessionToken);

        return { account, isFirstAccount: !hadAccountsBefore };
    },
);

type ImportKeyfilePayload = {
    keyfileContent: string;
    name: string;
    networkId?: string;
};

export const importFromKeyfile = createAsyncThunk(
    "auth/importFromKeyfile",
    async (
        { keyfileContent, name, networkId }: ImportKeyfilePayload,
        { getState },
    ) => {
        const state = getState() as { wallet: { selectedNetwork?: Network } };
        const selectedNetworkId =
            networkId || state.wallet?.selectedNetwork?.id;

        let userId = SecureStorage.getCurrentUserId();
        if (!userId) {
            throw new Error("Please login first before importing a keyfile");
        }

        const secureAccount = await SecureStorage.importFromKeyfile(
            keyfileContent,
            name,
            selectedNetworkId,
            userId,
        );
        return secureAccount;
    },
);

interface LoginAttemptResult {
    unlockedAccounts: Account[];
    foundUserId: string | null;
    accountsToMigrate: string[];
    noAccountFound: boolean;
}

const tryUnlockByName = async (
    accountName: string,
    password: string,
    allAccounts: SecureAccount[],
): Promise<LoginAttemptResult> => {
    const userId = SecureStorage.generateUserIdFromPassword(
        password,
        accountName,
    );
    const matchingAccounts = allAccounts.filter(
        (acc) => acc.name === accountName,
    );
    const unlockedAccounts: Account[] = [];
    const accountsToMigrate: string[] = [];

    if (matchingAccounts.length === 0) {
        return {
            unlockedAccounts: [],
            foundUserId: null,
            accountsToMigrate: [],
            noAccountFound: true,
        };
    }

    for (const account of matchingAccounts) {
        const userIdMatches = !account.userId || account.userId === userId;
        if (!userIdMatches) continue;

        const unlocked = await SecureStorage.unlockAccount(
            account.id,
            password,
            userId,
        );
        if (!unlocked) continue;

        unlockedAccounts.push(unlocked);
        if (!account.userId) accountsToMigrate.push(account.id);
    }

    return {
        unlockedAccounts,
        foundUserId: unlockedAccounts.length > 0 ? userId : null,
        accountsToMigrate,
        noAccountFound: false,
    };
};

const tryUnlockAllNames = async (
    password: string,
    allAccounts: SecureAccount[],
): Promise<LoginAttemptResult> => {
    const uniqueNames = Array.from(
        new Set(allAccounts.filter((acc) => acc.name).map((acc) => acc.name)),
    );

    for (const name of uniqueNames) {
        const result = await tryUnlockByName(name, password, allAccounts);
        if (result.foundUserId && result.unlockedAccounts.length > 0) {
            return result;
        }
    }

    return {
        unlockedAccounts: [],
        foundUserId: null,
        accountsToMigrate: [],
        noAccountFound: uniqueNames.length === 0,
    };
};

const migrateAccountUserIds = (accountIds: string[], userId: string): void => {
    if (accountIds.length === 0) return;

    const allAccounts = SecureStorage.getEncryptedAccounts();
    let needsUpdate = false;

    const updatedAccounts = allAccounts.map((acc) => {
        if (accountIds.includes(acc.id) && !acc.userId) {
            needsUpdate = true;
            return { ...acc, userId };
        }
        return acc;
    });

    if (needsUpdate) {
        SecureStorage.saveEncryptedAccounts(updatedAccounts);
    }
};

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

export const loginWithPassword = createAsyncThunk(
    "auth/loginWithPassword",
    async ({
        password,
        accountName,
    }: {
        password: string;
        accountName?: string;
    }) => {
        const loginType = accountName
            ? LoginType.ByName
            : LoginType.AllAccounts;
        const contextKey = buildContextKey(accountName);
        let failureReason: FailureReason | undefined;
        let succeeded = false;

        try {
            const rateLimitStatus = await checkRateLimit(contextKey);
            if (rateLimitStatus.locked) {
                failureReason = FailureReason.RateLimited;
                throw new Error(
                    formatLockoutMessage(rateLimitStatus.remainingMs),
                );
            }

            const lockWaitStart = Date.now();

            const accounts = await withLoginLock(async () => {
                // Double-check rate limit inside the lock (TOCTOU: another tab may have
                // triggered lockout between the outer check and acquiring this lock)
                const innerStatus = await checkRateLimit(contextKey);
                if (innerStatus.locked) {
                    failureReason = FailureReason.RateLimited;
                    throw new Error(
                        formatLockoutMessage(innerStatus.remainingMs),
                    );
                }

                const lockWaitMs = Date.now() - lockWaitStart;
                if (lockWaitMs > LOCK_WAIT_THRESHOLD_MS) {
                    failureReason = FailureReason.LockContention;
                }

                const allAccounts = SecureStorage.getEncryptedAccounts();

                if (allAccounts.length === 0) {
                    failureReason = FailureReason.NoAccount;
                    throw new Error("No accounts found");
                }

                const result = accountName
                    ? await tryUnlockByName(accountName, password, allAccounts)
                    : await tryUnlockAllNames(password, allAccounts);

                if (
                    !result.foundUserId ||
                    result.unlockedAccounts.length === 0
                ) {
                    failureReason = result.noAccountFound
                        ? FailureReason.NoAccount
                        : FailureReason.WrongPassword;
                    throw new Error(
                        result.noAccountFound
                            ? "Account not found"
                            : "Incorrect password",
                    );
                }

                migrateAccountUserIds(
                    result.accountsToMigrate,
                    result.foundUserId,
                );
                SecureStorage.setCurrentUserId(result.foundUserId);
                SecureStorage.setAuthenticated(true);

                const sessionToken = SecureStorage.generateSessionToken();
                SecureStorage.setSessionToken(sessionToken);
                broadcastSessionLogin(sessionToken);

                return result.unlockedAccounts;
            });

            succeeded = true;
            return accounts;
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
    },
);

export const unlockAccount = createAsyncThunk(
    "auth/unlockAccount",
    async ({
        accountId,
        password,
    }: {
        accountId: string;
        password: string;
    }) => {
        const userId = SecureStorage.getCurrentUserId();
        if (!userId) {
            throw new Error("Please login first");
        }

        const account = await SecureStorage.unlockAccount(
            accountId,
            password,
            userId,
        );
        if (!account) {
            throw new Error("Incorrect password or account not found");
        }
        return account;
    },
);

export const exportAccountKeyfile = createAsyncThunk(
    "auth/exportAccountKeyfile",
    async ({ accountId }: { accountId: string }) => {
        const keyfile = SecureStorage.exportAccount(accountId);
        if (!keyfile) {
            throw new Error("Account not found");
        }

        const blob = new Blob([keyfile], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asi-wallet-${accountId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { accountId, success: true };
    },
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.unlockedAccounts = [];
            state.error = null;
            SecureStorage.clearSession();
            SecureStorage.setAuthenticated(false);
            clearSessionBroadcast();
        },
        updateActivity: (state) => {
            state.lastActivity = Date.now();
            SecureStorage.updateLastActivity();
        },
        updateSettings: (
            state,
            action: PayloadAction<{
                requirePasswordForTransaction?: boolean;
                idleTimeout?: number;
            }>,
        ) => {
            if (action.payload.requirePasswordForTransaction !== undefined) {
                state.requirePasswordForTransaction =
                    action.payload.requirePasswordForTransaction;
            }
            if (action.payload.idleTimeout !== undefined) {
                state.idleTimeout = action.payload.idleTimeout;
            }
            SecureStorage.updateSettings(action.payload);
        },
        clearError: (state) => {
            state.error = null;
        },
        checkAuthentication: (state) => {
            const userId = SecureStorage.getCurrentUserId();
            const unlockedAccounts = SecureStorage.getAllUnlockedAccounts();
            const token = SecureStorage.getSessionToken();
            const hasUnlocked = unlockedAccounts.length > 0;
            const isAuthenticated =
                SecureStorage.isAuthenticated() &&
                hasUnlocked &&
                !!userId &&
                !!token;

            state.isAuthenticated = isAuthenticated;
            state.hasAccounts = SecureStorage.hasAccounts(userId ?? undefined);
            state.unlockedAccounts = unlockedAccounts;

            if (!isAuthenticated && SecureStorage.isAuthenticated()) {
                SecureStorage.setAuthenticated(false);
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
                state.hasAccounts = true;
                if (action.payload.isFirstAccount) {
                    state.isAuthenticated = true;
                }
                state.unlockedAccounts.push(action.payload.account);
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
                state.hasAccounts = true;
                if (action.payload.isFirstAccount) {
                    state.isAuthenticated = true;
                }
                state.unlockedAccounts.push(action.payload.account);
            })
            .addCase(importAccountWithPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to import account";
            })
            .addCase(importFromKeyfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(importFromKeyfile.fulfilled, (state) => {
                state.isLoading = false;
                state.hasAccounts = true;
            })
            .addCase(importFromKeyfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to import keyfile";
            })
            .addCase(loginWithPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginWithPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.unlockedAccounts = action.payload;
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
                const exists = state.unlockedAccounts.find(
                    (a) => a.id === action.payload.id,
                );
                if (!exists) {
                    state.unlockedAccounts.push(action.payload);
                }
            })
            .addCase(unlockAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to unlock account";
            })
            .addCase(exportAccountKeyfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(exportAccountKeyfile.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(exportAccountKeyfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error =
                    action.error.message || "Failed to export keyfile";
            });
    },
});

export const {
    logout,
    updateActivity,
    updateSettings,
    clearError,
    checkAuthentication,
} = authSlice.actions;

export default authSlice.reducer;
