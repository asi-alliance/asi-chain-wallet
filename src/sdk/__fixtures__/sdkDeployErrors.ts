/**
 * Runtime copies of the deploy errors introduced by asi-chain-wallet-sdk #217
 * at e3d456085531b00ac65e913525ac95fdfdb45eb4.
 *
 * The wallet still resolves the published SDK 2.1.0, which has neither the
 * codes nor the classes. The tests recreate the instances the SDK throws so
 * the wallet contract is exercised against the real fields, including the
 * deploy queue wait and the signed deploy ID, until the SDK release lands.
 */

export const DeployStatus = {
    REJECTED: "Rejected",
    EXPIRED: "Expired",
    FAILED: "Failed",
} as const;

export type TDeployVerdictStatus =
    (typeof DeployStatus)[keyof typeof DeployStatus];

export class SdkDeployRefusalError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly deployId: string;
    public readonly retryable: boolean;
    public readonly retryAfterMs: number | undefined;

    constructor(
        code: string,
        message: string,
        deployId: string,
        retryable: boolean,
        retryAfterMs?: number,
    ) {
        super(message);

        this.name = new.target.name;
        this.code = code;
        this.status = 503;
        this.deployId = deployId;
        this.retryable = retryable;
        this.retryAfterMs = retryAfterMs;
    }
}

export class SdkDeployQueueRefusedError extends SdkDeployRefusalError {
    public readonly queueCode: string;

    constructor(
        queueCode: string,
        deployId: string,
        retryAfterMs: number | undefined,
        reason: string = "the deploy queue refused the deploy",
    ) {
        super(
            queueCode === "deploy_queue_full"
                ? "DEPLOY_QUEUE_FULL"
                : "DEPLOY_QUEUE_UNAVAILABLE",
            `Submission of deploy ${deployId} was refused: ${reason}`,
            deployId,
            queueCode !== "deploy_queue_full",
            retryAfterMs,
        );

        this.queueCode = queueCode;
    }
}

export class SdkDeployAdmissionRefusedError extends SdkDeployRefusalError {
    public readonly admissionCode: string;

    constructor(
        admissionCode: string,
        deployId: string,
        reason: string = "the node was busy",
    ) {
        super(
            "DEPLOY_ADMISSION_REFUSED",
            `Submission of deploy ${deployId} was refused: ${reason}`,
            deployId,
            true,
        );

        this.admissionCode = admissionCode;
    }
}

export class SdkDeploySubmissionUnknownError extends Error {
    public readonly code: string = "DEPLOY_SUBMISSION_UNKNOWN";
    public readonly status: number = 502;
    public readonly deployId: string;

    constructor(deployId: string, reason: string) {
        super(
            `Submission outcome for deploy ${deployId} is unknown: ${reason}. Check its status before retrying.`,
        );

        this.name = new.target.name;
        this.deployId = deployId;
    }
}

const DEPLOY_VERDICT_ERROR_CODES: Readonly<Record<TDeployVerdictStatus, string>> =
    {
        [DeployStatus.REJECTED]: "DEPLOY_VERDICT_REJECTED",
        [DeployStatus.EXPIRED]: "DEPLOY_VERDICT_EXPIRED",
        [DeployStatus.FAILED]: "DEPLOY_VERDICT_FAILED",
    };

const DEPLOY_VERDICT_MESSAGES: Readonly<Record<TDeployVerdictStatus, string>> = {
    [DeployStatus.REJECTED]:
        "was rejected by the node when its deploy queue released it, and never executed",
    [DeployStatus.EXPIRED]:
        "expired without landing in a block, and never executed",
    [DeployStatus.FAILED]: "executed and failed, so its effects did not apply",
};

export class SdkDeployVerdictError extends Error {
    public readonly code: string;
    public readonly status: number = 422;
    public readonly deployId: string;
    public readonly state: TDeployVerdictStatus;
    public readonly detail: string | undefined;

    constructor(
        deployId: string,
        state: TDeployVerdictStatus,
        detail?: string,
    ) {
        super(
            `Deploy ${deployId} ${DEPLOY_VERDICT_MESSAGES[state]}${detail ? `: ${detail}` : ""}`,
        );

        this.name = new.target.name;
        this.code = DEPLOY_VERDICT_ERROR_CODES[state];
        this.deployId = deployId;
        this.state = state;
        this.detail = detail;
    }
}
