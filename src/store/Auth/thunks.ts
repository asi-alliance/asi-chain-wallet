import { FailureReason, LoginType } from "services/loginAuditLog";
import { withLoginLock } from "services/loginLock";
import {
    buildContextKey,
    checkRateLimit,
    formatLockoutMessage,
} from "services/loginRateLimit";
import { createAppAsyncThunk } from "store/appThunk";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { toActiveWalletSession } from "store/WalletsStore/helpers";
import { IActiveWalletSession } from "types/wallet";
import { classifyLoginError, handleLoginOutcome } from "./helpers";

type CreateHdWalletPayload = {
    name: string;
    mnemonic: string;
    password: string;
};

export const createHdWallet = createAppAsyncThunk<
    IActiveWalletSession,
    CreateHdWalletPayload
>(
    "auth/createHdWallet",
    async ({ name, mnemonic, password }, { extra: { walletService } }) => {
        return toActiveWalletSession(
            await walletService.createHdWallet({ name, mnemonic, password }),
        );
    },
);

type ImportHdWalletPayload = {
    name: string;
    mnemonic: string;
    password: string;
};

export const importHdWallet = createAppAsyncThunk<
    IActiveWalletSession,
    ImportHdWalletPayload
>(
    "auth/importHdWallet",
    async ({ name, mnemonic, password }, { extra: { walletService } }) => {
        return toActiveWalletSession(
            await walletService.createHdWallet({ name, mnemonic, password }),
        );
    },
);

type ImportPrivateKeyWalletPayload = {
    name: string;
    privateKeyHex: string;
    password: string;
};

export const importPrivateKeyWallet = createAppAsyncThunk<
    IActiveWalletSession,
    ImportPrivateKeyWalletPayload
>(
    "auth/importPrivateKeyWallet",
    async (
        { name, privateKeyHex, password },
        { extra: { walletService } },
    ) => {
        return toActiveWalletSession(
            await walletService.createPrivateKeyWallet({
                name,
                privateKeyHex,
                password,
            }),
        );
    },
);

export const deriveHdAccount = createAppAsyncThunk<
    IActiveWalletSession,
    { name: string; password: string }
>(
    "auth/deriveHdAccount",
    async ({ name, password }, { getState, extra: { walletService } }) => {
        const { wallets } = getState().walletsStore;
        const { activeSignerId } = getState().auth;

        const activeWallet = wallets.find(
            (walletMeta) =>
                walletMeta.isUnlocked && walletMeta.signerId === activeSignerId,
        );

        if (!activeWallet?.id) {
            throw new Error("No active HD wallet to derive an account from");
        }

        const { wallet, accountId } = await walletService.deriveAccount({
            walletId: activeWallet.id,
            name,
            password,
        });

        WalletPreferencesStorage.setSelectedAccountId(
            wallet.signerId,
            accountId,
        );

        return { wallet, selectedAccountId: accountId };
    },
);

const LOCK_WAIT_THRESHOLD_MS = 500;

export const loginWithPassword = createAppAsyncThunk<
    IActiveWalletSession,
    { signerId: string; password: string }
>(
    "auth/loginWithPassword",
    async ({ signerId, password }, { extra: { walletService } }) => {
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
                const wallet = await walletService.openWallet(
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

        return toActiveWalletSession(unlockedWallet);
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
    },
);

export const logout = createAppAsyncThunk(
    "auth/logout",
    async (_, { extra: { walletService } }) => {
        walletService.closeSession();
    },
);

export interface IImportKeyfileWalletPayload {
    keyfile: string;
    password: string;
    accountIndexes?: number[];
}

export const importKeyfileWallet = createAppAsyncThunk<
    IActiveWalletSession,
    IImportKeyfileWalletPayload
>(
    "auth/importKeyfileWallet",
    async (
        { keyfile, password, accountIndexes }: IImportKeyfileWalletPayload,
        { extra: { walletService } },
    ) =>
        toActiveWalletSession(
            await walletService.importWalletKeyfile(
                keyfile,
                password,
                accountIndexes ? { accountIndexes } : undefined,
            ),
        ),
);
