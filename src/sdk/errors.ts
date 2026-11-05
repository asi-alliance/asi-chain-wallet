import { CustomErrorCode, getErrorMessage } from "@asichain/asi-wallet-sdk";
import { getErrorCode } from "utils/errors";

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;

export const getWalletActionErrorMessage = (error: unknown, fallback: string): string => {
    switch (getErrorCode(error)) {
        case "DEPLOY_ADMISSION_REFUSED":
            return "Not accepted by the node. Please try again later.";
        case "DEPLOY_SUBMISSION_UNKNOWN":
            return "Submission outcome is unknown. Check transaction history before trying again.";
        default:
            return getErrorMessage(error, fallback);
    }
};
