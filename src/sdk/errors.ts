import { CustomErrorCode } from "@asichain/asi-wallet-sdk";
import { getErrorCode } from "utils/errors";

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;
