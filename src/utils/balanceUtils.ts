import {
    ASI_DECIMALS,
    fromAtomicAmount,
    GasFee,
    NON_NEGATIVE_DECIMAL_REGEX,
    toAtomicAmount,
} from "@asichain/asi-wallet-sdk";
import { getTokenDisplayName } from "../constants/token";

export const BALANCE_PLACEHOLDER = "--";

const getFractionLength = (value: string): number =>
    (value.split(".")[1] ?? "").length;

const parseTokenAmount = (value: string): bigint | null => {
    const normalized = value.trim();

    if (
        !NON_NEGATIVE_DECIMAL_REGEX.test(normalized) ||
        getFractionLength(normalized) > ASI_DECIMALS
    ) {
        return null;
    }

    return toAtomicAmount(normalized, ASI_DECIMALS);
};

export const getMaxSendableAmount = (
    balance: string,
    gasFee: bigint = GasFee.MAX,
): string => {
    const balanceAtomic = parseTokenAmount(balance);

    if (balanceAtomic === null || balanceAtomic <= gasFee) {
        return fromAtomicAmount(0n, ASI_DECIMALS);
    }

    return fromAtomicAmount(balanceAtomic - gasFee, ASI_DECIMALS);
};

export const getTokenAmountWithFee = (
    amount: string,
    gasFee: bigint = GasFee.MAX,
): string | null => {
    const amountAtomic = parseTokenAmount(amount);

    if (amountAtomic === null) {
        return null;
    }

    return fromAtomicAmount(amountAtomic + gasFee, ASI_DECIMALS);
};

export const isPositiveTokenAmount = (amount: string): boolean => {
    const amountAtomic = parseTokenAmount(amount);

    return amountAtomic !== null && amountAtomic > 0n;
};

export const getAmountValidationError = (
    amount: string,
    balance: string,
    gasFee: bigint = GasFee.MAX,
    validateInput: boolean = false,
): string => {
    const normalizedAmount = amount.trim();

    if (!normalizedAmount) {
        return "";
    }

    if (!NON_NEGATIVE_DECIMAL_REGEX.test(normalizedAmount)) {
        return validateInput ? "Enter a valid amount" : "";
    }

    if (getFractionLength(normalizedAmount) > ASI_DECIMALS) {
        return validateInput
            ? `Amount supports up to ${ASI_DECIMALS} decimal places`
            : "";
    }

    const amountAtomic = parseTokenAmount(normalizedAmount);

    if (amountAtomic === null || amountAtomic <= 0n) {
        return validateInput ? "Amount must be greater than zero" : "";
    }

    const balanceAtomic = parseTokenAmount(balance);

    if (balanceAtomic === null) {
        return "";
    }

    if (amountAtomic > balanceAtomic) {
        return `Insufficient balance. You have ${fromAtomicAmount(
            balanceAtomic,
            ASI_DECIMALS,
        )} ${getTokenDisplayName()}`;
    }

    if (amountAtomic + gasFee > balanceAtomic) {
        const totalRequired = fromAtomicAmount(
            amountAtomic + gasFee,
            ASI_DECIMALS,
        );

        return `Amount + fee (${totalRequired}) exceeds balance. Max: ${getMaxSendableAmount(
            balance,
            gasFee,
        )} ${getTokenDisplayName()}`;
    }

    return "";
};

/**
 * Formats a balance value for display with appropriate precision
 * @param balance - The balance value as string or number
 * @param options - Formatting options
 * @returns Formatted balance string
 */
export const formatBalance = (
    balance: string | number,
    options: {
        showCurrency?: boolean;
        maxDecimals?: number;
        minDecimals?: number;
    } = {},
): string => {
    const { showCurrency = true, maxDecimals = 8, minDecimals = 0 } = options;

    const num = typeof balance === "string" ? parseFloat(balance) : balance;

    if (isNaN(num) || !isFinite(num)) {
        return showCurrency ? `0 ${getTokenDisplayName()}` : "0";
    }

    if (num === 0) {
        return showCurrency ? `0 ${getTokenDisplayName()}` : "0";
    }

    if (num < 0.000001) {
        return showCurrency
            ? `<0.000001 ${getTokenDisplayName()}`
            : "<0.000001";
    }

    let decimals = minDecimals;

    if (num >= 1) {
        decimals = Math.min(maxDecimals, 2);
    } else if (num >= 0.01) {
        decimals = Math.min(maxDecimals, 4);
    } else if (num >= 0.0001) {
        decimals = Math.min(maxDecimals, 6);
    } else {
        decimals = Math.min(maxDecimals, 8);
    }

    const formatted = num.toFixed(decimals);

    const trimmed = parseFloat(formatted).toString();

    return showCurrency ? `${trimmed} ${getTokenDisplayName()}` : trimmed;
};

/**
 * Formats balance for display in account switcher (compact format)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceCompact = (balance: string | number): string => {
    const num = typeof balance === "string" ? parseFloat(balance) : balance;

    if (isNaN(num) || !isFinite(num)) {
        return `0 ${getTokenDisplayName()}`;
    }

    if (num === 0) {
        return `0 ${getTokenDisplayName()}`;
    }

    if (num < 0.0001) {
        return `<0.0001 ${getTokenDisplayName()}`;
    }

    if (num >= 1) {
        const formatted = num.toFixed(4);
        const trimmed = parseFloat(formatted).toString();
        return `${trimmed} ${getTokenDisplayName()}`;
    } else if (num >= 0.01) {
        return `${num.toFixed(4)} ${getTokenDisplayName()}`;
    } else {
        return `${num.toFixed(6)} ${getTokenDisplayName()}`;
    }
};

/**
 * Formats balance for display in account cards (medium precision)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceCard = (
    balance: string | number,
): { amount: string; currency: string } => {
    const num = typeof balance === "string" ? parseFloat(balance) : balance;
    const currency = getTokenDisplayName();

    if (isNaN(num) || !isFinite(num)) {
        return { amount: "0", currency };
    }

    if (num === 0) {
        return { amount: "0", currency };
    }

    if (num < 0.000001) {
        return { amount: "<0.000001", currency };
    }

    let amount: string;

    if (num >= 1) {
        const truncated = Math.floor(num * 10000) / 10000;
        amount = truncated.toFixed(4);
    } else if (num >= 0.001) {
        const truncated = Math.floor(num * 1000000) / 1000000;
        amount = truncated.toFixed(6);
    } else {
        const truncated = Math.floor(num * 100000000) / 100000000;
        amount = truncated.toFixed(8);
    }

    return { amount, currency };
};

/**
 * Formats balance for display on dashboard (high precision)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceDashboard = (balance: string | number): string => {
    const num = typeof balance === "string" ? parseFloat(balance) : balance;

    if (isNaN(num) || !isFinite(num)) {
        return `0 ${getTokenDisplayName()}`;
    }

    if (num === 0) {
        return `0 ${getTokenDisplayName()}`;
    }

    if (num < 0.00000001) {
        return `<0.00000001 ${getTokenDisplayName()}`;
    }

    if (num >= 1) {
        const truncated = Math.floor(num * 10000) / 10000;
        return `${truncated.toFixed(4)} ${getTokenDisplayName()}`;
    } else if (num >= 0.01) {
        const truncated = Math.floor(num * 1000000) / 1000000;
        return `${truncated.toFixed(6)} ${getTokenDisplayName()}`;
    } else {
        const truncated = Math.floor(num * 100000000) / 100000000;
        return `${truncated.toFixed(8)} ${getTokenDisplayName()}`;
    }
};
