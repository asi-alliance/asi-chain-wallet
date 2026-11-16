import {
    CANONICAL_INTEGER_REGEX,
    fromAtomicAmount,
} from "@asichain/asi-wallet-sdk";
import { compareDecimalAmounts } from "./decimalAmounts";

export const getDeployCostAtomic = (
    phloLimit: string | number,
    phloPrice: string | number,
): bigint | null => {
    const parse = (value: string | number): bigint | null => {
        if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
        const text = String(value).trim();
        return CANONICAL_INTEGER_REGEX.test(text) ? BigInt(text) : null;
    };
    const limit = parse(phloLimit);
    const price = parse(phloPrice);
    return limit !== null && limit > 0n && price !== null ? limit * price : null;
};

export const canCoverDeployCost = (
    balance: string,
    cost: bigint,
    decimals: number,
): boolean => {
    const positive = compareDecimalAmounts(balance, "0");
    const order = compareDecimalAmounts(balance, fromAtomicAmount(cost, decimals));
    return cost >= 0n && positive === 1 && (order === 0 || order === 1);
};
