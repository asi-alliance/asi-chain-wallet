import {
    ApiRequestError,
    CustomErrorCode,
    DeployQueueCause,
    DeployQueueRefusedError,
    DeployRefusalError,
    DeployStatus,
    DeploySubmissionUnknownError,
    DeployVerdictError,
    DeployVerdictStatus,
    getErrorMessage,
} from "@asichain/asi-wallet-sdk";
import { getErrorCode, getErrorName } from "utils/errors";
import { isPlainObject } from "utils/guards";

export const isWalletLockedError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.WALLET_LOCKED;

export const isInvalidPasswordError = (error: unknown): boolean =>
    getErrorCode(error) === CustomErrorCode.INVALID_PASSWORD;

export interface IWalletActionError {
    message: string;
    name?: string;
    code?: string;
    reason?: string;
    retryAfterMs?: number;
    queueCause?: DeployQueueCause;
    unknownOutcomeDeployId?: string;
}

const isWalletActionError = (error: unknown): error is IWalletActionError =>
    isPlainObject(error) && typeof error.message === "string";

export const toWalletActionError = (error: unknown): IWalletActionError => ({
    message: getErrorMessage(error, ""),
    name: getErrorName(error),
    code: getErrorCode(error),
    ...(error instanceof ApiRequestError && { reason: error.reason }),
    ...(error instanceof DeployRefusalError && {
        retryAfterMs: error.retryAfterMs,
    }),
    ...(error instanceof DeployQueueRefusedError && {
        queueCause: error.queueCause,
    }),
    ...(error instanceof DeploySubmissionUnknownError && {
        unknownOutcomeDeployId: error.deployId,
    }),
});

const DEPLOY_QUEUE_CAUSE_MESSAGES: Readonly<
    Record<DeployQueueCause, string>
> = {
    validator:
        "the validator cannot process this transaction within its validity window.",
    validator_idle:
        "the validator is not producing blocks. You can choose another validator.",
    shard: "shard finalization is delayed.",
    storage: "the validator's deploy queue storage is full.",
    deployer_share: "this account already has too many transactions waiting.",
};

const DEPLOY_VERDICT_MESSAGES: Readonly<
    Record<DeployVerdictStatus, string>
> = {
    [DeployStatus.REJECTED]:
        "The node rejected the transaction when it left the deploy queue. It was not executed and no funds moved.",
    [DeployStatus.EXPIRED]:
        "The transaction expired and its effects did not reach finalized state. Create a new transaction.",
    [DeployStatus.FAILED]:
        "The transaction was executed but its effects did not apply.",
};

const getRetryHint = (retryAfterMs: number | undefined): string => {
    if (retryAfterMs === undefined) {
        return "Please try again later.";
    }

    const retryAfterSeconds: number = Math.max(
        1,
        Math.ceil(retryAfterMs / 1000),
    );

    return `Please try again in ${retryAfterSeconds} s.`;
};

const getQueueFullMessage = ({
    queueCause,
    retryAfterMs,
}: IWalletActionError): string => {
    const cause: string = queueCause
        ? DEPLOY_QUEUE_CAUSE_MESSAGES[queueCause]
        : "the network is busy.";

    return `Not accepted by the node: ${cause} ${getRetryHint(retryAfterMs)}`;
};

const getRefusalReasonMessage = (
    error: IWalletActionError,
    fallback: string,
): string =>
    error.reason
        ? `Not accepted by the node: ${error.reason}`
        : getErrorMessage(error, fallback);

export const getDeployVerdictMessage = (
    error: unknown,
): string | undefined => {
    if (!(error instanceof DeployVerdictError)) {
        return undefined;
    }

    const message: string = DEPLOY_VERDICT_MESSAGES[error.state];

    return error.detail ? `${message} Node detail: ${error.detail}` : message;
};

export const getWalletActionErrorMessage = (
    error: unknown,
    fallback: string,
): string => {
    if (!isWalletActionError(error)) {
        return getErrorMessage(error, fallback);
    }

    if (error.unknownOutcomeDeployId) {
        return `Submission outcome for deploy ${error.unknownOutcomeDeployId} is unknown. Check its status in transaction history before trying again.`;
    }

    switch (error.code) {
        case CustomErrorCode.DEPLOY_QUEUE_FULL:
            return getQueueFullMessage(error);
        case CustomErrorCode.DEPLOY_QUEUE_UNAVAILABLE:
            return `Not accepted by the node: its deploy queue is temporarily unavailable. ${getRetryHint(error.retryAfterMs)}`;
        case CustomErrorCode.DEPLOY_ADMISSION_REFUSED:
            return "Not accepted by the node. Please try again later.";
        case CustomErrorCode.DEPLOY_TOO_LARGE:
            return "Not accepted by the node: the transaction is too large.";
        case CustomErrorCode.DEPLOY_EXPIRED:
            return "Not accepted by the node: the transaction has expired. Create a new transaction.";
        case CustomErrorCode.DEPLOY_WINDOW_INVALID:
            return "Not accepted by the node yet. Please try again later.";
        case CustomErrorCode.VALIDATOR_NOT_BONDED:
        case CustomErrorCode.DEPLOY_SUBMISSION_REJECTED:
            return getRefusalReasonMessage(error, fallback);
        default:
            return getErrorMessage(error, fallback);
    }
};
