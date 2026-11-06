import { formatTransactionAmount } from "./transactionUtils";

describe("exact transaction amounts", () => {
    test.each([
        ["1", "1.00000000 ASI"],
        ["0", "0.00000000 ASI"],
        ["1.25", "1.25000000 ASI"],
        ["9007199254740993", "9007199254740993.00000000 ASI"],
        ["10.000000000000000001", "10.000000000000000001 ASI"],
        ["0.000000000000000001", "0.000000000000000001 ASI"],
        ["-1.000000000000000001", "-1.000000000000000001 ASI"],
        [
            "115792089237316195423570985008687907853269984665640564039457.584007913129639935",
            "115792089237316195423570985008687907853269984665640564039457.584007913129639935 ASI",
        ],
    ])("preserves %s", (value, expected) => {
        expect(formatTransactionAmount(value)).toBe(expected);
    });

    test("retains missing and nonnumeric values", () => {
        expect(formatTransactionAmount()).toBe("-");
        expect(formatTransactionAmount("")).toBe("-");
        expect(formatTransactionAmount("unknown")).toBe("unknown ASI");
        expect(formatTransactionAmount("1e19")).toBe("1e19 ASI");
    });
});
