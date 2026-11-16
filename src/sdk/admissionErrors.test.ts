jest.mock("@asichain/asi-wallet-sdk", () => ({
    CustomErrorCode: { WALLET_LOCKED: "WALLET_LOCKED", INVALID_PASSWORD: "INVALID_PASSWORD" },
    getErrorMessage: (error: { message?: string }, fallback: string) => error?.message || fallback,
}));

import { getWalletActionErrorMessage } from "./errors";

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
    it("keeps permanent failures distinct from admission backpressure", () => {
        expect(getWalletActionErrorMessage({ code: "DEPLOY_SUBMISSION_REJECTED", message: "invalid window" }, "failed")).toBe("invalid window");
    });
});
