import * as walletSdk from "@asichain/asi-wallet-sdk";
import { getErrorCode } from "utils/errors";
import { isPlainObject } from "utils/guards";

const { CustomErrorCode, getErrorMessage } = walletSdk;
const sdkUnknownSubmissionError: unknown = Reflect.get(walletSdk, "DeploySubmissionUnknownError");

const getWalletActionErrorCode = (error: unknown): string | undefined =>
    typeof sdkUnknownSubmissionError === "function" && error instanceof sdkUnknownSubmissionError
        ? "DEPLOY_SUBMISSION_UNKNOWN"
        : getErrorCode(error);

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;

const getStringField = (
    error: unknown,
    field: string,
): string | undefined => {
    const value: unknown = isPlainObject(error) ? error[field] : undefined;

    return typeof value === "string" && value ? value : undefined;
};

const getRetryAfterMs = (error: unknown): number | undefined => {
    const value: unknown = isPlainObject(error) ? error.retryAfterMs : undefined;

    return typeof value === "number" && Number.isFinite(value) && value >= 0
        ? value
        : undefined;
};

/**
 * A serializable rejection payload for wallet actions.
 *
 * Redux Toolkit's default error serializer keeps only the string `name`,
 * `message`, `stack` and `code` fields, so a raw SDK error loses the deploy
 * queue's wait and the signed deploy ID on its way through `.unwrap()`. The
 * thunks pass this plain object to `rejectWithValue` to keep the fields that
 * the messages need.
 */
export interface IWalletActionError {
    message: string;
    name?: string;
    code?: string;
    retryAfterMs?: number;
    cause?: string;
    deployId?: string;
}

export const toWalletActionError = (error: unknown): IWalletActionError => {
    const code: string | undefined = getWalletActionErrorCode(error);
    const cause = code === "DEPLOY_QUEUE_FULL" ? getStringField(error, "cause") : undefined;
    const name: string | undefined = getStringField(error, "name");
    const retryAfterMs: number | undefined = getRetryAfterMs(error);
    const deployId: string | undefined = getStringField(error, "deployId");

    return {
        message: getStringField(error, "message") ?? "",
        ...(name && { name }),
        ...(cause && { cause }),
        ...(code && { code }),
        ...(retryAfterMs !== undefined && { retryAfterMs }),
        ...(deployId && { deployId }),
    };
};

const tryAgain = (error: unknown): string => {
    const retryAfterMs = getRetryAfterMs(error);

    return retryAfterMs === undefined
        ? "Please try again later."
        : `Please try again in ${Math.max(1, Math.ceil(retryAfterMs / 1000))} s.`;
};

const queueFullReason = (error: unknown): string => {
    switch (getStringField(error, "cause")) {
        case "validator":
            return "the validator cannot process this transaction within its validity window.";
        case "validator_idle":
            return "the validator is not producing blocks. You can choose another validator.";
        case "shard":
            return "shard finalization is delayed.";
        case "storage":
            return "the validator's deploy queue storage is full.";
        default:
            return "the network is busy.";
    }
};

export const getDeployVerdictMessage = (error: unknown): string | undefined => {
    const detail: unknown = isPlainObject(error) ? error.detail : undefined;
    const suffix = typeof detail === "string" && detail ? ` Node detail: ${detail}` : "";

    switch (getErrorCode(error)) {
        case "DEPLOY_VERDICT_REJECTED":
            return `The node rejected the transaction when it left the deploy queue. It was not executed and no funds moved.${suffix}`;
        case "DEPLOY_VERDICT_EXPIRED":
            return "The transaction expired and its effects did not reach finalized state. Create a new transaction.";
        case "DEPLOY_VERDICT_FAILED":
            return `The transaction was executed but its effects did not apply.${suffix}`;
        default:
            return undefined;
    }
};

export const getWalletActionErrorMessage = (
    error: unknown,
    fallback: string,
): string => {
    switch (getWalletActionErrorCode(error)) {
        case "DEPLOY_QUEUE_FULL":
            if (getStringField(error, "cause") === "deployer_share") {
                return "This account has reached its queue limit. The signed transaction was refused.";
            }
            return `Not accepted by the node: ${queueFullReason(error)} ${tryAgain(error)}`;
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
        case "DEPLOY_SUBMISSION_UNKNOWN": {
            const deployId: string | undefined = getStringField(
                error,
                "deployId",
            );

            return deployId
                ? `Submission outcome for deploy ${deployId} is unknown. Check its status in transaction history before trying again.`
                : "Submission outcome is unknown. Check transaction history before trying again.";
        }
        default:
            return getErrorMessage(error, fallback);
    }
};
