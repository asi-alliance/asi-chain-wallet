import { normalizeUint8Array, stringifyWithBigInt } from "./helpers";

describe("wallet data helpers", () => {
  it("serializes nested atomic amounts without losing integer precision", () => {
    const value = {
      amount: 9007199254740993123456789n,
      entries: [{ fee: 1n }, { adjustment: -2n }],
      count: 2,
    };

    expect(JSON.parse(stringifyWithBigInt(value))).toEqual({
      amount: "9007199254740993123456789",
      entries: [{ fee: "1" }, { adjustment: "-2" }],
      count: 2,
    });
  });

  it("copies bytes so later edits cannot mutate the original array", () => {
    const original = new Uint8Array([0, 128, 255]);
    const normalized = normalizeUint8Array(original);

    expect(Array.from(normalized)).toEqual([0, 128, 255]);
    normalized[0] = 42;
    expect(original[0]).toBe(0);
  });
});
