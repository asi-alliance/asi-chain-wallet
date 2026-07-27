import { createAsyncThunk } from "@reduxjs/toolkit";
import { SdkWalletService } from "sdk";
import { FailureReason, LoginType } from "services/loginAuditLog";
import { withLoginLock } from "services/loginLock";
import {
    buildContextKey,
    checkRateLimit,
    formatLockoutMessage,
} from "services/loginRateLimit";
import { RootState } from "store";
import { getWalletAndAccountFromWalletsMeta } from "store/WalletsStore/helpers";
import { IWalletMeta } from "types/wallet";
import { classifyLoginError, handleLoginOutcome } from "./helpers";

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

    return wallet;
});

const LOCK_WAIT_THRESHOLD_MS = 500;

export const loginWithPassword = createAsyncThunk<
    IWalletMeta,
    { signerId: string; password: string }
>("auth/loginWithPassword", async ({ signerId, password }) => {
    const loginType = LoginType.ByName;
    const contextKey = buildContextKey(signerId);
    let failureReason: FailureReason | undefined;
    let succeeded = false;

    try {
        const rateLimitStatus = await checkRateLimit(contextKey);
        if (rateLimitStatus.locked) {
            failureReason = FailureReason.RateLimited;
            throw new Error(formatLockoutMessage(rateLimitStatus.remainingMs));
        }

        const lockWaitStart = Date.now();

        const unlockedWallet = await withLoginLock(async () => {
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

            try {
                const wallet = await SdkWalletService.openSession(
                    signerId,
                    password,
                );

                return wallet;
            } catch (err) {
                failureReason = FailureReason.WrongPassword;
                throw err;
            }
        });

        succeeded = true;

        return unlockedWallet;
    } catch (err: unknown) {
        console.log("AuthSlice.loginWithPassword: ", err);

        if (!failureReason) {
            failureReason = classifyLoginError(err);
        }
        throw err;
    } finally {
        await handleLoginOutcome(
            succeeded,
            contextKey,
            failureReason,
            signerId,
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

    return SdkWalletService.openSession(
        walletAndAccountPath.wallet.signerId,
        password,
    );
});

export const logout = createAsyncThunk("auth/logout", async () => {
    SdkWalletService.closeSession();
});

// type ImportKeyfilePayload = {
//     keyfileContent: string;
//     name: string;
//     networkId?: string;
// };

//TODO: Feature for next Web Wallet updates. On updating Web Wallet on SDK this action not use in UI.
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
