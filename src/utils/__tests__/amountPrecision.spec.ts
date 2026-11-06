import { describe, expect, it } from "@jest/globals";
import { Transaction } from "types/transactions";
import { compareDecimalAmounts, formatDecimalAmount } from "../decimalAmounts";
import {
    formatBalance, formatBalanceCard, formatBalanceCompact, formatBalanceDashboard,
    formatBalanceExact, getAmountValidationError, getMaxSendableAmount,
    getTokenAmountWithFee,
} from "../balanceUtils";
import { formatTransactionAmount } from "../transactionUtils";
import { createEmptyPanelFilters, filterTransactions, getAmountFieldErrors } from "../historyFilters";
import { canCoverDeployCost, getDeployCostAtomic } from "../deployFees";
import { getGasFeeRangeLabel } from "../../constants/gas";

const row = (amount: string): Transaction => ({
    id: amount, deployId: "deploy", amount, from: "", to: "",
    timestamp: "2026-11-06T12:00:00Z", type: "transfer", status: "finalized",
} as Transaction);

describe("exact wallet decimal amounts", () => {
    it.each([
        ["9007199254740993", "9007199254740992", 1],
        ["10.000000000000000001", "10", 1],
        ["0.000000000000000001", "0", 1],
        ["-0.000000000000000001", "0", -1],
        ["-9007199254740993", "-9007199254740992", -1],
        ["1.000000000000000000", "1", 0],
        ["-0.0", "0", 0],
        ["99.9", "100", -1],
    ])("compares %s and %s without floating point", (left, right, order) => {
        expect(compareDecimalAmounts(left, right)).toBe(order);
    });

    it.each(["1e19", "1.2.3", "01", "NaN", "Infinity", "", true, null,
        Number.MAX_SAFE_INTEGER + 1, 1.25])("rejects inexact or malformed input %s", (value) => {
        expect(formatDecimalAmount(value)).toBeNull();
        expect(compareDecimalAmounts(value, "0")).toBeNull();
    });

    it.each([
        ["10.000000000000000001", "10.000000000000000001 ASI"],
        ["0.000000000000000001", "0.000000000000000001 ASI"],
        ["9007199254740993", "9007199254740993.00000000 ASI"],
        ["-1.000000000000000001", "-1.000000000000000001 ASI"],
        ["1", "1.00000000 ASI"], ["0", "0.00000000 ASI"],
        ["unknown", "unknown ASI"], ["", "-"],
    ])("retains exact history amount %s", (value, expected) => {
        expect(formatTransactionAmount(value)).toBe(expected);
    });

    it("preserves a uint256-scale token amount in history", () => {
        const amount = "115792089237316195423570985008687907853269984665640564039457.584007913129639935";
        expect(formatTransactionAmount(amount)).toBe(`${amount} ASI`);
    });
});

describe("balance display and existing native send arithmetic", () => {
    it("keeps wide whole digits and exposes full precision for shortened balances", () => {
        const value = "9007199254740993.000000000000000001";
        expect(formatBalanceCompact(value)).toBe("9007199254740993 ASI");
        expect(formatBalanceCard(value).amount).toBe("9007199254740993.0000");
        expect(formatBalanceDashboard(value)).toBe("9007199254740993.0000 ASI");
        expect(formatBalanceExact(value)).toBe(`${value} ASI`);
    });

    it("never rounds a shortened balance upward", () => {
        expect(formatBalanceCompact("1.234599999999999999")).toBe("1.2345 ASI");
        expect(formatBalanceCard("1.234599999999999999").amount).toBe("1.2345");
        expect(formatBalance("1.999999999999999999")).toBe("1.99 ASI");
    });

    it("keeps tiny positive balances distinct from zero", () => {
        expect(formatBalanceCard("0.000000000000000001").amount).toBe("<0.000001");
        expect(formatBalanceCard("0").amount).toBe("0");
        expect(formatBalanceExact("0.000000000000000001")).toBe("0.000000000000000001 ASI");
    });

    it.each(["unavailable", "1e19", "-1", Number.MAX_SAFE_INTEGER + 1])(
        "does not substitute zero for invalid balance %s", (value) => {
            expect(formatBalanceCard(value).amount).toBe("--");
            expect(formatBalanceCompact(value)).toBe("-- ASI");
            expect(formatBalanceExact(value)).toBe("-- ASI");
        },
    );

    it("preserves dust when computing Max and totals on the current 8-decimal SDK", () => {
        expect(getMaxSendableAmount("9007199254740993.00000001", 1n)).toBe("9007199254740993");
        expect(getTokenAmountWithFee("9007199254740993.00000001", 1n)).toBe("9007199254740993.00000002");
        expect(getAmountValidationError("1.00000001", "1.00000001", 1n, true)).toContain("exceeds balance");
        expect(getAmountValidationError("1.00000001", "1.00000002", 1n, true)).toBe("");
    });

    it("rejects unsupported sends and unknown balances", () => {
        expect(getAmountValidationError((1n << 256n).toString(), "1", 0n, true))
            .toBe("Amount exceeds the supported transfer limit");
        expect(getAmountValidationError("1", "unknown", 0n, true)).toBe("Balance is unavailable");
    });

    it("formats fee bounds as exact decimal strings", () => {
        expect(getGasFeeRangeLabel()).toBe("~0.0017-0.0025");
    });
});

describe("exact history amount filters", () => {
    it("selects adjacent wide integers independently", () => {
        const filters = createEmptyPanelFilters();
        filters.amount = { preset: "", from: "9007199254740993", to: "9007199254740993" };
        expect(filterTransactions([row("9007199254740992"), row("9007199254740993")], filters, Date.now())
            .map((tx) => tx.amount)).toEqual(["9007199254740993"]);
    });

    it("retains a one-unit difference at 18 decimals", () => {
        const filters = createEmptyPanelFilters();
        filters.amount = { preset: "", from: "10.000000000000000001", to: "10.000000000000000001" };
        expect(filterTransactions([row("10"), row("10.000000000000000001")], filters, Date.now())
            .map((tx) => tx.amount)).toEqual(["10.000000000000000001"]);
    });

    it("validates inverted ranges differing only in the eighteenth decimal", () => {
        expect(getAmountFieldErrors({ preset: "", from: "1.000000000000000001", to: "1" }).to)
            .toContain("maximum must be greater");
    });

    it("enforces exact exclusive and inclusive preset boundaries", () => {
        const filters = createEmptyPanelFilters();
        filters.amount.preset = "gt-min";
        expect(filterTransactions([row("0.00001"), row("0.000010000000000001")], filters, Date.now())
            .map((tx) => tx.amount)).toEqual(["0.000010000000000001"]);
        filters.amount.preset = "1-10";
        expect(filterTransactions([row("1"), row("10"), row("10.000000000000000001")], filters, Date.now())
            .map((tx) => tx.amount)).toEqual(["1", "10"]);
    });

    it.each(["1e19", "-0.000000000000000001", "0x10", "Infinity"])(
        "rejects a malformed or negative custom bound %s", (value) => {
            expect(getAmountFieldErrors({ preset: "", from: value, to: "" }).from)
                .toBe("Enter a valid amount.");
        },
    );
});

describe("deploy fee arithmetic", () => {
    it("multiplies integer prices exactly above the JS safe integer range", () => {
        expect(getDeployCostAtomic("9007199254740991", "3")).toBe(27021597764222973n);
        expect(getDeployCostAtomic("1", "9223372036854775807")).toBe(9223372036854775807n);
    });

    it.each(["NaN", "Infinity", "1e3", "-1", "1.5", "01", ""])(
        "rejects an invalid phlo price %s", (value) => {
            expect(getDeployCostAtomic("100", value)).toBeNull();
        },
    );

    it("does not approve a balance one atomic unit below the required fee", () => {
        expect(canCoverDeployCost("90071992.54740992", 9007199254740993n, 8)).toBe(false);
        expect(canCoverDeployCost("90071992.54740993", 9007199254740993n, 8)).toBe(true);
        expect(canCoverDeployCost("1", 1000000000000000001n, 18)).toBe(false);
        expect(canCoverDeployCost("1.000000000000000001", 1000000000000000001n, 18)).toBe(true);
        expect(canCoverDeployCost("unknown", 1n)).toBe(false);
    });
});
