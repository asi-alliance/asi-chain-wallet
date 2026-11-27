import {
    CANONICAL_INTEGER_REGEX,
    fromAtomicAmount,
} from "@asichain/asi-wallet-sdk";
import { compareDecimalAmounts, TDecimalAmountOrder } from "./decimalAmounts";

const parsePhloValue = (value: string | number): bigint | null => {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
        return null;
    }

    const text: string = String(value).trim();

    if (!CANONICAL_INTEGER_REGEX.test(text)) {
        return null;
    }

    return BigInt(text);
};

export const getDeployCostAtomic = (
    phloLimit: string | number,
    phloPrice: string | number,
): bigint | null => {
    const limit: bigint | null = parsePhloValue(phloLimit);
    const price: bigint | null = parsePhloValue(phloPrice);

    if (limit === null || limit <= 0n || price === null) {
        return null;
    }

    return limit * price;
};

export const canCoverDeployCost = (
    balance: string,
    cost: bigint,
    decimals: number,
): boolean => {
    if (cost < 0n || compareDecimalAmounts(balance, "0") !== 1) {
        return false;
    }

    const order: TDecimalAmountOrder | null = compareDecimalAmounts(
        balance,
        fromAtomicAmount(cost, decimals),
    );

    return order === 0 || order === 1;
};
