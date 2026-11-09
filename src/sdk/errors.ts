import { CustomErrorCode, getErrorMessage } from "@asichain/asi-wallet-sdk";
import { getErrorCode } from "utils/errors";

const INSUFFICIENT_FUNDS_PATTERN = /insufficient/i;

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;

export const isInsufficientFundsError = (error: unknown): boolean =>
    INSUFFICIENT_FUNDS_PATTERN.test(getErrorMessage(error, ""));
