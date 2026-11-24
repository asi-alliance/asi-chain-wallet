import type { Client } from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "../SdkWalletService";
import {
    getDeployVerdictMessage,
    getWalletActionErrorMessage,
    toWalletActionError,
} from "../errors";
import {
    DeployStatus,
    SdkDeployAdmissionRefusedError,
    SdkDeployQueueRefusedError,
    SdkDeploySubmissionUnknownError,
    SdkDeployVerdictError,
} from "../__fixtures__/sdkDeployErrors";

describe("deploy submission refusals", () => {
    it.each([
        [12_000, "Please try again in 12 s."],
        [1_500, "Please try again in 2 s."],
        [0, "Please try again in 1 s."],
        [undefined, "Please try again later."],
    ])(
        "keeps the deploy queue wait of %p s",
        (retryAfterMs, expectedWait) => {
            const error = new SdkDeployQueueRefusedError(
                "deploy_queue_full",
                "deploy-1",
                retryAfterMs,
            );

            expect(
                getWalletActionErrorMessage(error, "Failed to send transfer"),
            ).toBe(
                `Not accepted by the node: the network is busy. ${expectedWait}`,
            );
        },
    );

    it.each([
        ["validator", "within its validity window"],
        ["validator_idle", "choose another validator"],
        ["shard", "shard finalization"],
        ["storage", "storage is full"],
        ["deployer_share", "account has reached its queue limit"],
        ["future", "network is busy"],
    ])("preserves %s across Redux and displays its guidance", (cause, guidance) => {
        const error = new SdkDeployQueueRefusedError(
            "deploy_queue_full", "id", 9000, "busy", cause,
        );
        const payload = JSON.parse(JSON.stringify(toWalletActionError(error)));
        expect(payload).toMatchObject({ cause, deployId: "id", retryAfterMs: 9000 });
        expect(getWalletActionErrorMessage(payload, "failed")).toContain(guidance);
    });

    it("ignores the legacy congestion field", () => {
        const error = Object.assign(
            new SdkDeployQueueRefusedError(
                "deploy_queue_full",
                "deploy-1",
                9_000,
            ),
            { congestion: "deployer_share" },
        );
        const idleValidatorError = Object.assign(
            new SdkDeployQueueRefusedError(
                "deploy_queue_full",
                "deploy-1",
                9_000,
            ),
            { congestion: "validator_idle" },
        );
        const expected =
            "Not accepted by the node: the network is busy. Please try again in 9 s.";

        expect(getWalletActionErrorMessage(error, "failed")).toBe(expected);
        expect(
            getWalletActionErrorMessage(idleValidatorError, "failed"),
        ).toBe(expected);
    });

    it("keeps the deploy queue wait when the queue is unavailable", () => {
        const error = new SdkDeployQueueRefusedError(
            "deploy_queue_unavailable",
            "deploy-1",
            5_000,
        );

        expect(getWalletActionErrorMessage(error, "failed")).toBe(
            "Not accepted by the node: its deploy queue is temporarily unavailable. Please try again in 5 s.",
        );
    });

    it("shows an admission refusal as not accepted", () => {
        const error = new SdkDeployAdmissionRefusedError(
            "deploy_pool_busy",
            "deploy-1",
        );

        expect(getWalletActionErrorMessage(error, "failed")).toBe(
            "Not accepted by the node. Please try again later.",
        );
    });

    it("shows the signed deploy ID of an unknown submission", () => {
        const error = new SdkDeploySubmissionUnknownError(
            "deploy-7f3c",
            "the node connection dropped",
        );

        expect(getWalletActionErrorMessage(error, "failed")).toBe(
            "Submission outcome for deploy deploy-7f3c is unknown. Check its status in transaction history before trying again.",
        );
    });

    it("keeps an unknown submission without a deploy ID generic", () => {
        expect(
            getWalletActionErrorMessage(
                { code: "DEPLOY_SUBMISSION_UNKNOWN", message: "timeout" },
                "failed",
            ),
        ).toBe(
            "Submission outcome is unknown. Check transaction history before trying again.",
        );
    });

    it("never infers non-acceptance from HTTP 503 alone", () => {
        expect(
            getWalletActionErrorMessage(
                { status: 503, message: "proxy unavailable" },
                "failed",
            ),
        ).toBe("proxy unavailable");
    });
});

describe("wallet confirmation for the SDK's same-signature retry", () => {
    it.each([true, false])("passes the user's decision (%p) for send and deploy", async (answer) => {
        const prompt = jest.spyOn(window, "confirm").mockReturnValue(answer);
        try {
            const service = new SdkWalletService();
            const call = jest.fn();
            service.attachClient({ transfer: call, deploy: call } as unknown as Client);
            const account = { walletId: "wallet", accountId: "account" };
            await service.transfer({ ...account, to: "recipient", amount: "1" });
            await service.deploy({ ...account, term: "Nil" });
            expect(prompt).not.toHaveBeenCalled();
            for (const [request] of call.mock.calls) {
                expect(request.confirmDeployerShareRetry({
                    deployId: "signed-id", retryAfterMs: 1500,
                })).toBe(answer);
            }
            expect(prompt).toHaveBeenCalledTimes(2);
            expect(prompt).toHaveBeenCalledWith(expect.stringContaining("signed-id once after 2 s"));
        } finally {
            prompt.mockRestore();
        }
    });
});

describe("watched deploy verdicts", () => {
    it("reports a rejection on release from the queue", () => {
        const error = new SdkDeployVerdictError(
            "deploy-1",
            DeployStatus.REJECTED,
            "rholang_bad_term: syntax error",
        );

        expect(getDeployVerdictMessage(error)).toBe(
            "The node rejected the transaction when it left the deploy queue. It was not executed and no funds moved. Node detail: rholang_bad_term: syntax error",
        );
    });

    it("describes an expired deploy in terms of its effects", () => {
        const message = getDeployVerdictMessage(
            new SdkDeployVerdictError("deploy-1", DeployStatus.EXPIRED),
        );

        expect(message).toBe(
            "The transaction expired and its effects did not reach finalized state. Create a new transaction.",
        );
        expect(message).not.toContain("included in a block");
        expect(message).not.toContain("never executed");
    });

    it("reports an executed deploy whose effects did not apply", () => {
        const error = new SdkDeployVerdictError(
            "deploy-1",
            DeployStatus.FAILED,
            "out of phlo",
        );

        expect(getDeployVerdictMessage(error)).toBe(
            "The transaction was executed but its effects did not apply. Node detail: out of phlo",
        );
    });

    it.each([
        [{ code: "DEPLOY_TIMEOUT", message: "not finalized in time" }],
        [{ code: "API_REQUEST_FAILED", message: "observer down" }],
        [{ code: "DEPLOY_REJECTED", message: "the old wallet code" }],
        [new Error("plain")],
    ])("keeps other watch errors unresolved: %p", (error) => {
        expect(getDeployVerdictMessage(error)).toBeUndefined();
    });
});

describe("serializable wallet action errors", () => {
    it("keeps the fields that Redux's default serializer drops", () => {
        const error = new SdkDeployQueueRefusedError(
            "deploy_queue_full",
            "deploy-abc",
            12_000,
        );
        const serialized = toWalletActionError(error);

        expect(serialized).toMatchObject({
            code: "DEPLOY_QUEUE_FULL",
            deployId: "deploy-abc",
            retryAfterMs: 12_000,
        });
        expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
    });

    it("keeps a non-string wait out of the serialized error", () => {
        expect(
            toWalletActionError({
                code: "DEPLOY_QUEUE_FULL",
                message: "busy",
                retryAfterMs: "soon",
            }),
        ).not.toHaveProperty("retryAfterMs");
    });
});
