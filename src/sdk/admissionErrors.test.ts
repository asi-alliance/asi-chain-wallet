import { getDeployVerdictMessage, getWalletActionErrorMessage } from "./errors";

// Jest hoists this mock above the import.
jest.mock("@asichain/asi-wallet-sdk", () => ({
    CustomErrorCode: { WALLET_LOCKED: "WALLET_LOCKED", INVALID_PASSWORD: "INVALID_PASSWORD" },
    getErrorMessage: (error: { message?: string }, fallback: string) => error?.message || fallback,
}));

describe("deploy submission outcomes", () => {
    it("shows an explicit temporary refusal as not accepted", () => {
        expect(getWalletActionErrorMessage({ code: "DEPLOY_ADMISSION_REFUSED", status: 503, message: "busy" }, "failed"))
            .toBe("Not accepted by the node. Please try again later.");
    });
    it.each([
        ["DEPLOY_TOO_LARGE", 413, "Not accepted by the node: the transaction is too large."],
        ["DEPLOY_EXPIRED", 400, "Not accepted by the node: the transaction has expired. Create a new transaction."],
        ["DEPLOY_WINDOW_INVALID", 400, "Not accepted by the node yet. Please try again later."],
    ])("shows the node refusal %s as not accepted", (code, status, expected) => {
        expect(getWalletActionErrorMessage({ code, status, message: "node detail" }, "failed")).toBe(expected);
    });
    it("preserves an unknown outcome and signed deploy ID", () => {
        const message = "Submission outcome for deploy abc is unknown. Check its status before retrying.";
        expect(getWalletActionErrorMessage({ code: "DEPLOY_SUBMISSION_UNKNOWN", message }, "failed")).toBe("Submission outcome is unknown. Check transaction history before trying again.");
    });
    it("never infers non-acceptance from HTTP 503 alone", () => {
        expect(getWalletActionErrorMessage({ status: 503, message: "proxy unavailable" }, "failed")).toBe("proxy unavailable");
    });
    it.each([
        ["validator", 12_000, "Not accepted by the node: the network is busy. Please try again in 12 s."],
        ["shard", 1_500, "Not accepted by the node: the network is busy. Please try again in 2 s."],
        ["storage", undefined, "Not accepted by the node: the network is busy. Please try again later."],
        [undefined, 0, "Not accepted by the node: the network is busy. Please try again in 1 s."],
        ["deployer_share", 9_000, "Not accepted by the node: too many of your transactions are already waiting. Please try again in 9 s."],
        ["validator_idle", 60_000, "Not accepted by the node: its validator is not producing blocks. Try another node or try again later."],
    ])("shows a full deploy queue (%s) as not accepted", (congestion, retryAfterMs, expected) => {
        const error = { code: "DEPLOY_QUEUE_FULL", status: 503, message: "deploy queue is full", congestion, retryAfterMs };
        expect(getWalletActionErrorMessage(error, "failed")).toBe(expected);
    });
    it("shows an unavailable deploy queue as not accepted", () => {
        expect(getWalletActionErrorMessage({ code: "DEPLOY_QUEUE_UNAVAILABLE", status: 503, retryAfterMs: 5_000 }, "failed"))
            .toBe("Not accepted by the node: its deploy queue is temporarily unavailable. Please try again in 5 s.");
        expect(getWalletActionErrorMessage({ code: "DEPLOY_QUEUE_UNAVAILABLE", status: 503, retryAfterMs: "soon" }, "failed"))
            .toBe("Not accepted by the node: its deploy queue is temporarily unavailable. Please try again later.");
    });
    it("keeps permanent failures distinct from admission backpressure", () => {
        expect(getWalletActionErrorMessage({ code: "DEPLOY_SUBMISSION_REJECTED", message: "invalid window" }, "failed")).toBe("invalid window");
    });
});

describe("watched deploy verdicts", () => {
    it.each([
        ["DEPLOY_REJECTED", "rholang_bad_term: syntax error", "The node rejected the transaction when it left the deploy queue. It was not executed and no funds moved. Node detail: rholang_bad_term: syntax error"],
        ["DEPLOY_EXPIRED", undefined, "The transaction expired before it was included in a block. It was not executed and no funds moved. Create a new transaction."],
        ["DEPLOY_EXECUTION_FAILED", undefined, "The transaction was executed but failed, so its transfer did not happen."],
    ])("reports %s as a final failure", (code, detail, expected) => {
        expect(getDeployVerdictMessage({ code, detail, message: "sdk message" })).toBe(expected);
    });
    it.each([
        [{ code: "DEPLOY_TIMEOUT", message: "not finalized in time" }],
        [{ code: "API_REQUEST_FAILED", message: "observer down" }],
        [new Error("plain")],
    ])("keeps other watch errors unresolved: %p", (error) => {
        expect(getDeployVerdictMessage(error)).toBeUndefined();
    });
});
