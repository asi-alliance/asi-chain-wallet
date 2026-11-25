import { deployPriceError, parsePositivePrice } from "../deployPrice";

const minimum = "100000000000";
const maximum = (1n << 256n) - 1n;

describe("validator Phlo Price", () => {
    it("accepts an exact decimal minimum from the status response", () => {
        expect(parsePositivePrice(minimum)).toBe(minimum);
        expect(parsePositivePrice(100000000000)).toBe(minimum);
        expect(parsePositivePrice("9007199254740993")).toBe("9007199254740993");
    });

    it.each([undefined, null, 0, "01", "-1", "1e11", "0.5", Number.MAX_SAFE_INTEGER + 1, String(maximum + 1n)])(
        "rejects an invalid or lossy price %s", (value) => {
            expect(parsePositivePrice(value)).toBeNull();
        },
    );

    it("allows the minimum and exact higher prices within the signing profile", () => {
        expect(deployPriceError(minimum, minimum, maximum)).toBeUndefined();
        expect(deployPriceError("9007199254740993", minimum, maximum)).toBeUndefined();
        expect(deployPriceError("99999999999", minimum, maximum)).toBeDefined();
        expect(deployPriceError("9007199254740993", minimum, BigInt(Number.MAX_SAFE_INTEGER))).toBeDefined();
    });
});
