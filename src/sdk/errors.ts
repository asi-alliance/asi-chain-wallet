import { CustomErrorCode, getErrorMessage } from "@asichain/asi-wallet-sdk";
import { getErrorCode } from "utils/errors";
import { isPlainObject } from "utils/guards";

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;

const getRetryAfterMs = (error: unknown): number | undefined => {
    const value: unknown = isPlainObject(error) ? error.retryAfterMs : undefined;
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
};

const tryAgain = (error: unknown): string => {
    const retryAfterMs = getRetryAfterMs(error);
    return retryAfterMs === undefined
        ? "Please try again later."
        : `Please try again in ${Math.max(1, Math.ceil(retryAfterMs / 1000))} s.`;
};

/**
 * A deploy queue (node-rust #990) refused the transaction and did not hold it.
 * Trying again from the wallet signs a new transaction, as a full queue
 * requires.
 */
const getDeployQueueFullMessage = (error: unknown): string => {
    const congestion: unknown = isPlainObject(error) ? error.congestion : undefined;
    switch (congestion) {
        case "deployer_share":
            return `Not accepted by the node: too many of your transactions are already waiting. ${tryAgain(error)}`;
        case "validator_idle":
            return "Not accepted by the node: its validator is not producing blocks. Try another node or try again later.";
        default:
            return `Not accepted by the node: the network is busy. ${tryAgain(error)}`;
    }
};

export const getWalletActionErrorMessage = (error: unknown, fallback: string): string => {
    switch (getErrorCode(error)) {
        case "DEPLOY_QUEUE_FULL":
            return getDeployQueueFullMessage(error);
        case "DEPLOY_QUEUE_UNAVAILABLE":
            return `Not accepted by the node: its deploy queue is temporarily unavailable. ${tryAgain(error)}`;
        case "DEPLOY_ADMISSION_REFUSED":
            return "Not accepted by the node. Please try again later.";
        case "DEPLOY_TOO_LARGE":
            return "Not accepted by the node: the transaction is too large.";
        case "DEPLOY_EXPIRED":
            return "Not accepted by the node: the transaction has expired. Create a new transaction.";
        case "DEPLOY_WINDOW_INVALID":
            return "Not accepted by the node yet. Please try again later.";
        case "DEPLOY_SUBMISSION_UNKNOWN":
            return "Submission outcome is unknown. Check transaction history before trying again.";
        default:
            return getErrorMessage(error, fallback);
    }
};
