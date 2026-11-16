import {
    fromAtomicAmount,
    isUint256,
    MAX_UINT256,
    NON_NEGATIVE_DECIMAL_REGEX,
    toExactAtomicAmount,
} from "@asichain/asi-wallet-sdk";
import { getTokenDisplayName } from "../constants/token";
import { compareDecimalAmounts, formatDecimalAmount } from "./decimalAmounts";

export const BALANCE_PLACEHOLDER = "--";

const parseTokenAmount = (value: string, decimals: number): bigint | null => {
    const normalized = value.trim();

    if (!NON_NEGATIVE_DECIMAL_REGEX.test(normalized)) {
        return null;
    }

    try {
        return toExactAtomicAmount(normalized, decimals);
    } catch {
        return null;
    }
};

export const getMaxSendableAmount = (
    balance: string,
    gasFee: bigint,
    decimals: number,
): string => {
    const balanceAtomic = parseTokenAmount(balance, decimals);

    if (balanceAtomic === null || balanceAtomic <= gasFee) {
        return fromAtomicAmount(0n, decimals);
    }

    const available = balanceAtomic - gasFee;

    return fromAtomicAmount(
        isUint256(available) ? available : MAX_UINT256,
        decimals,
    );
};

export const getTokenAmountWithFee = (
    amount: string,
    gasFee: bigint,
    decimals: number,
): string | null => {
    const amountAtomic = parseTokenAmount(amount, decimals);

    if (amountAtomic === null) {
        return null;
    }

    return fromAtomicAmount(amountAtomic + gasFee, decimals);
};

export const isPositiveTokenAmount = (
    amount: string,
    decimals: number,
): boolean => {
    const amountAtomic = parseTokenAmount(amount, decimals);

    return amountAtomic !== null && amountAtomic > 0n;
};

export const getAmountValidationError = (
    amount: string,
    balance: string,
    gasFee: bigint,
    validateInput: boolean,
    decimals: number,
): string => {
    const normalizedAmount = amount.trim();

    if (!normalizedAmount) {
        return "";
    }

    if (!NON_NEGATIVE_DECIMAL_REGEX.test(normalizedAmount)) {
        return validateInput ? "Enter a valid amount" : "";
    }

    const amountAtomic = parseTokenAmount(normalizedAmount, decimals);

    if (amountAtomic === null) {
        return validateInput
            ? `Amount supports up to ${decimals} decimal places`
            : "";
    }

    if (amountAtomic <= 0n) {
        return validateInput ? "Amount must be greater than zero" : "";
    }

    if (!isUint256(amountAtomic)) {
        return "Amount exceeds the supported transfer limit";
    }

    const balanceAtomic = parseTokenAmount(balance, decimals);

    if (balanceAtomic === null) {
        return "Balance is unavailable";
    }

    if (amountAtomic > balanceAtomic) {
        return `Insufficient balance. You have ${fromAtomicAmount(
            balanceAtomic,
            decimals,
        )} ${getTokenDisplayName()}`;
    }

    if (amountAtomic + gasFee > balanceAtomic) {
        const totalRequired = fromAtomicAmount(
            amountAtomic + gasFee,
            decimals,
        );

        return `Amount + fee (${totalRequired}) exceeds balance. Max: ${getMaxSendableAmount(
            balance,
            gasFee,
            decimals,
        )} ${getTokenDisplayName()}`;
    }

    return "";
};

const parseBalance = (balance: unknown): string | null => {
    const amount = formatDecimalAmount(balance);
    return amount !== null && compareDecimalAmounts(amount, "0") !== -1
        ? amount : null;
};

export const formatBalanceExact = (balance: string | number): string =>
    `${parseBalance(balance) ?? BALANCE_PLACEHOLDER} ${getTokenDisplayName()}`;

export const formatBalance = (
    balance: string | number,
    options: {
        showCurrency?: boolean;
        maxDecimals?: number;
        minDecimals?: number;
    } = {},
): string => {
    const { showCurrency = true, maxDecimals = 8, minDecimals = 0 } = options;
    const value = parseBalance(balance);
    let amount = BALANCE_PLACEHOLDER;
    if (value === "0") {
        amount = "0";
    } else if (value !== null) {
        if (compareDecimalAmounts(value, "0.000001") === -1) {
            amount = "<0.000001";
        } else {
            const digits = compareDecimalAmounts(value, "1") !== -1 ? 2
                : compareDecimalAmounts(value, "0.01") !== -1 ? 4
                : compareDecimalAmounts(value, "0.0001") !== -1 ? 6 : 8;
            amount = formatDecimalAmount(
                value, minDecimals, Math.max(minDecimals, Math.min(maxDecimals, digits)),
            )!;
        }
    }
    return showCurrency ? `${amount} ${getTokenDisplayName()}` : amount;
};

export const formatBalanceCompact = (balance: string | number): string => {
    const value = parseBalance(balance);
    let amount = BALANCE_PLACEHOLDER;
    if (value === "0") {
        amount = "0";
    } else if (value !== null) {
        if (compareDecimalAmounts(value, "0.0001") === -1) {
            amount = "<0.0001";
        } else if (compareDecimalAmounts(value, "1") !== -1) {
            amount = formatDecimalAmount(value, 0, 4)!;
        } else {
            const digits = compareDecimalAmounts(value, "0.01") !== -1 ? 4 : 6;
            amount = formatDecimalAmount(value, digits, digits)!;
        }
    }
    return `${amount} ${getTokenDisplayName()}`;
};

export const formatBalanceCard = (
    balance: string | number,
): { amount: string; currency: string } => {
    const value = parseBalance(balance);
    let amount = BALANCE_PLACEHOLDER;
    if (value === "0") {
        amount = "0";
    } else if (value !== null) {
        if (compareDecimalAmounts(value, "0.000001") === -1) {
            amount = "<0.000001";
        } else {
            const digits = compareDecimalAmounts(value, "1") !== -1 ? 4
                : compareDecimalAmounts(value, "0.001") !== -1 ? 6 : 8;
            amount = formatDecimalAmount(value, digits, digits)!;
        }
    }
    return { amount, currency: getTokenDisplayName() };
};

export const formatBalanceDashboard = (balance: string | number): string => {
    const value = parseBalance(balance);
    let amount = BALANCE_PLACEHOLDER;
    if (value === "0") {
        amount = "0";
    } else if (value !== null) {
        if (compareDecimalAmounts(value, "0.00000001") === -1) {
            amount = "<0.00000001";
        } else {
            const digits = compareDecimalAmounts(value, "1") !== -1 ? 4
                : compareDecimalAmounts(value, "0.01") !== -1 ? 6 : 8;
            amount = formatDecimalAmount(value, digits, digits)!;
        }
    }
    return `${amount} ${getTokenDisplayName()}`;
};
