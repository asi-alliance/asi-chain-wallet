import { getTokenDisplayName } from "../constants/token";
import { getGasFeeAsNumber } from "../constants/gas";

export const BALANCE_PLACEHOLDER = "--";
export const TOKEN_DECIMAL_PLACES = 8;

const DECIMAL_AMOUNT_PATTERN = /^\d+(?:\.\d+)?$/;

const toAtomicAmount = (
    value: string,
    decimalPlaces: number = TOKEN_DECIMAL_PLACES,
): bigint | null => {
    const normalized = value.trim();

    if (!DECIMAL_AMOUNT_PATTERN.test(normalized)) {
        return null;
    }

    const [integerPart, fractionPart = ""] = normalized.split(".");

    if (fractionPart.length > decimalPlaces) {
        return null;
    }

    return BigInt(
        `${integerPart}${fractionPart.padEnd(decimalPlaces, "0")}`,
    );
};

const fromAtomicAmount = (
    value: bigint,
    decimalPlaces: number = TOKEN_DECIMAL_PLACES,
): string => {
    const divisor = 10n ** BigInt(decimalPlaces);
    const integerPart = value / divisor;
    const fractionPart = (value % divisor)
        .toString()
        .padStart(decimalPlaces, "0");

    return `${integerPart}.${fractionPart}`;
};

export const getMaxSendableAmount = (
    balance: string,
    gasFee: number = getGasFeeAsNumber(),
): string => {
    const balanceAtomic = toAtomicAmount(balance);
    const gasAtomic = toAtomicAmount(
        gasFee.toFixed(TOKEN_DECIMAL_PLACES),
    );

    if (balanceAtomic === null || gasAtomic === null) {
        return fromAtomicAmount(0n);
    }

    const maxSendableAtomic = balanceAtomic - gasAtomic;

    if (maxSendableAtomic <= 0n) {
        return fromAtomicAmount(0n);
    }

    return fromAtomicAmount(maxSendableAtomic);
};

export const getTokenAmountWithFee = (
    amount: string,
    gasFee: number = getGasFeeAsNumber(),
): string | null => {
    const amountAtomic = toAtomicAmount(amount);
    const gasAtomic = toAtomicAmount(
        gasFee.toFixed(TOKEN_DECIMAL_PLACES),
    );

    if (amountAtomic === null || gasAtomic === null) {
        return null;
    }

    return fromAtomicAmount(amountAtomic + gasAtomic);
};

export const isPositiveTokenAmount = (amount: string): boolean => {
    const amountAtomic = toAtomicAmount(amount);

    return amountAtomic !== null && amountAtomic > 0n;
};

export const getAmountValidationError = (
    amount: string,
    balance: string,
    gasFee: number = getGasFeeAsNumber(),
    validateInput: boolean = false,
): string => {
    const normalizedAmount = amount.trim();

    if (!normalizedAmount) {
        return "";
    }

    if (!DECIMAL_AMOUNT_PATTERN.test(normalizedAmount)) {
        return validateInput ? "Enter a valid amount" : "";
    }

    const fractionPart = normalizedAmount.split(".")[1] ?? "";

    if (fractionPart.length > TOKEN_DECIMAL_PLACES) {
        return validateInput
            ? `Amount supports up to ${TOKEN_DECIMAL_PLACES} decimal places`
            : "";
    }

    const amountAtomic = toAtomicAmount(normalizedAmount);

    if (amountAtomic === null || amountAtomic <= 0n) {
        return validateInput ? "Amount must be greater than zero" : "";
    }

    const balanceAtomic = toAtomicAmount(balance);

    if (balanceAtomic === null) {
        return "";
    }

    if (amountAtomic > balanceAtomic) {
        return `Insufficient balance. You have ${fromAtomicAmount(
            balanceAtomic,
        )} ${getTokenDisplayName()}`;
    }

    const gasAtomic = toAtomicAmount(gasFee.toFixed(TOKEN_DECIMAL_PLACES));

    if (gasAtomic !== null && amountAtomic + gasAtomic > balanceAtomic) {
        const totalRequired = fromAtomicAmount(amountAtomic + gasAtomic);

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
