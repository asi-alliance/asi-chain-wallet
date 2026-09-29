import { CustomErrorCode } from "@asichain/asi-wallet-sdk";

export const isWalletLockedError = (error: unknown): boolean =>
    (error as { code?: string } | null)?.code === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    (error as { code?: string } | null)?.code ===
    CustomErrorCode.INVALID_PASSWORD;
