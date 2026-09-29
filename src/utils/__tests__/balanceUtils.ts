import {
    getAmountValidationError,
    getMaxSendableAmount,
    getTokenAmountWithFee,
    isPositiveTokenAmount,
} from "utils/balanceUtils";

describe("send amount validation", () => {
    it("rejects zero and unsupported precision", () => {
        expect(getAmountValidationError("0", "10", 0.25, true)).toBe(
            "Amount must be greater than zero",
        );
        expect(
            getAmountValidationError("1.000000001", "10", 0.25, true),
        ).toBe("Amount supports up to 8 decimal places");
        expect(getAmountValidationError("1.", "10", 0.25, true)).toBe(
            "Enter a valid amount",
        );
    });

    it("rejects amounts that exceed the balance or leave no fee", () => {
        expect(getAmountValidationError("10.1", "10", 0.25)).toContain(
            "Insufficient balance",
        );
        expect(getAmountValidationError("9.8", "10", 0.25)).toContain(
            "Amount + fee",
        );
        expect(
            getAmountValidationError(
                "90000000.00000003",
                "90000000.00000002",
                0.0025,
            ),
        ).toContain("You have 90000000.00000002");
    });

    it("calculates max after reserving the fee", () => {
        expect(getMaxSendableAmount("10", 0.25)).toBe("9.75000000");
        expect(getAmountValidationError("9.75", "10", 0.25)).toBe("");
        expect(getMaxSendableAmount("0.00250001", 0.0025)).toBe(
            "0.00000001",
        );
        expect(
            getAmountValidationError("0.00000001", "0.00250001", 0.0025),
        ).toBe("");
        expect(getMaxSendableAmount("90000000.00000001", 0.0025)).toBe(
            "89999999.99750001",
        );
        expect(
            getAmountValidationError(
                "89999999.99750001",
                "90000000.00000001",
                0.0025,
            ),
        ).toBe("");
    });

    it("adds amount and fee without losing atomic precision", () => {
        expect(
            getTokenAmountWithFee("33557508.54740991", 0.0025),
        ).toBe("33557508.54990991");
    });

    it("detects semantic zero independently of decimal formatting", () => {
        expect(isPositiveTokenAmount("0")).toBe(false);
        expect(isPositiveTokenAmount("0.00000000")).toBe(false);
        expect(isPositiveTokenAmount("0.00000001")).toBe(true);
    });
});
