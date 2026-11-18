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
    const amount: string | null = formatDecimalAmount(balance);

    if (amount === null || compareDecimalAmounts(amount, "0") === -1) {
        return null;
    }

    return amount;
};

const isBalanceBelow = (value: string, threshold: string): boolean =>
    compareDecimalAmounts(value, threshold) === -1;

const formatFixedBalance = (value: string, fractionDigits: number): string =>
    formatDecimalAmount(value, fractionDigits, fractionDigits)!;

const formatKnownBalance = (
    balance: string | number,
    formatPositiveBalance: (value: string) => string,
): string => {
    const value: string | null = parseBalance(balance);

    if (value === null) {
        return BALANCE_PLACEHOLDER;
    }

    if (value === "0") {
        return "0";
    }

    return formatPositiveBalance(value);
};

export const formatBalanceExact = (balance: string | number): string =>
    `${parseBalance(balance) ?? BALANCE_PLACEHOLDER} ${getTokenDisplayName()}`;

const getBalanceFractionDigits = (value: string): number => {
    if (!isBalanceBelow(value, "1")) {
        return 2;
    }

    if (!isBalanceBelow(value, "0.01")) {
        return 4;
    }

    if (!isBalanceBelow(value, "0.0001")) {
        return 6;
    }

    return 8;
};

export const formatBalance = (
    balance: string | number,
    options: {
        showCurrency?: boolean;
        maxDecimals?: number;
        minDecimals?: number;
    } = {},
): string => {
    const { showCurrency = true, maxDecimals = 8, minDecimals = 0 } = options;

    const amount: string = formatKnownBalance(balance, (value: string) => {
        if (isBalanceBelow(value, "0.000001")) {
            return "<0.000001";
        }

        const fractionDigits: number = Math.max(
            minDecimals,
            Math.min(maxDecimals, getBalanceFractionDigits(value)),
        );

        return formatDecimalAmount(value, minDecimals, fractionDigits)!;
    });

    return showCurrency ? `${amount} ${getTokenDisplayName()}` : amount;
};

const formatCompactPositiveBalance = (value: string): string => {
    if (isBalanceBelow(value, "0.0001")) {
        return "<0.0001";
    }

    if (!isBalanceBelow(value, "1")) {
        return formatDecimalAmount(value, 0, 4)!;
    }

    if (!isBalanceBelow(value, "0.01")) {
        return formatFixedBalance(value, 4);
    }

    return formatFixedBalance(value, 6);
};

export const formatBalanceCompact = (balance: string | number): string =>
    `${formatKnownBalance(balance, formatCompactPositiveBalance)} ${getTokenDisplayName()}`;

const formatCardPositiveBalance = (value: string): string => {
    if (isBalanceBelow(value, "0.000001")) {
        return "<0.000001";
    }

    if (!isBalanceBelow(value, "1")) {
        return formatFixedBalance(value, 4);
    }

    if (!isBalanceBelow(value, "0.001")) {
        return formatFixedBalance(value, 6);
    }

    return formatFixedBalance(value, 8);
};

export const formatBalanceCard = (
    balance: string | number,
): { amount: string; currency: string } => ({
    amount: formatKnownBalance(balance, formatCardPositiveBalance),
    currency: getTokenDisplayName(),
});

const formatDashboardPositiveBalance = (value: string): string => {
    if (isBalanceBelow(value, "0.00000001")) {
        return "<0.00000001";
    }

    if (!isBalanceBelow(value, "1")) {
        return formatFixedBalance(value, 4);
    }

    if (!isBalanceBelow(value, "0.01")) {
        return formatFixedBalance(value, 6);
    }

    return formatFixedBalance(value, 8);
};

export const formatBalanceDashboard = (balance: string | number): string =>
    `${formatKnownBalance(balance, formatDashboardPositiveBalance)} ${getTokenDisplayName()}`;
