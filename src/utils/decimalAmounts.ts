interface IDecimalAmount {
    negative: boolean;
    whole: string;
    fraction: string;
}

const DECIMAL_AMOUNT_REGEX = /^(-?)(\d+)(?:\.(\d+))?$/;
const LEADING_ZEROS_REGEX = /^0+(?=\d)/;
const TRAILING_ZEROS_REGEX = /0+$/;
const NONZERO_DIGIT_REGEX = /[1-9]/;

const parseDecimalAmount = (value: unknown): IDecimalAmount | null => {
    const text: unknown =
        typeof value === "number" && Number.isSafeInteger(value)
            ? String(value)
            : value;

    if (typeof text !== "string") {
        return null;
    }

    const match: RegExpExecArray | null = DECIMAL_AMOUNT_REGEX.exec(
        text.trim(),
    );

    if (!match) {
        return null;
    }

    const [, sign, integerDigits, fractionDigits = ""] = match;

    return {
        negative:
            sign === "-" &&
            NONZERO_DIGIT_REGEX.test(integerDigits + fractionDigits),
        whole: integerDigits.replace(LEADING_ZEROS_REGEX, ""),
        fraction: fractionDigits,
    };
};

export type TDecimalAmountOrder = -1 | 0 | 1;

const compareDecimalMagnitudes = (
    left: IDecimalAmount,
    right: IDecimalAmount,
): TDecimalAmountOrder => {
    if (left.whole.length !== right.whole.length) {
        return left.whole.length < right.whole.length ? -1 : 1;
    }

    if (left.whole !== right.whole) {
        return left.whole < right.whole ? -1 : 1;
    }

    const width: number = Math.max(left.fraction.length, right.fraction.length);
    const leftFraction: string = left.fraction.padEnd(width, "0");
    const rightFraction: string = right.fraction.padEnd(width, "0");

    if (leftFraction === rightFraction) {
        return 0;
    }

    return leftFraction < rightFraction ? -1 : 1;
};

export const compareDecimalAmounts = (
    left: unknown,
    right: unknown,
): TDecimalAmountOrder | null => {
    const leftAmount: IDecimalAmount | null = parseDecimalAmount(left);
    const rightAmount: IDecimalAmount | null = parseDecimalAmount(right);

    if (!leftAmount || !rightAmount) {
        return null;
    }

    if (leftAmount.negative !== rightAmount.negative) {
        return leftAmount.negative ? -1 : 1;
    }

    const order: TDecimalAmountOrder = compareDecimalMagnitudes(
        leftAmount,
        rightAmount,
    );

    if (!leftAmount.negative || order === 0) {
        return order;
    }

    return order === 1 ? -1 : 1;
};

export const formatDecimalAmount = (
    value: unknown,
    minDecimals = 0,
    maxDecimals?: number,
): string | null => {
    const isMinDecimalsValid: boolean =
        Number.isSafeInteger(minDecimals) && minDecimals >= 0;
    const isMaxDecimalsValid: boolean =
        maxDecimals === undefined ||
        (Number.isSafeInteger(maxDecimals) && maxDecimals >= minDecimals);

    if (!isMinDecimalsValid || !isMaxDecimalsValid) {
        throw new RangeError("Invalid display precision");
    }

    const amount: IDecimalAmount | null = parseDecimalAmount(value);

    if (!amount) {
        return null;
    }

    const fraction: string = amount.fraction
        .slice(0, maxDecimals)
        .replace(TRAILING_ZEROS_REGEX, "")
        .padEnd(minDecimals, "0");
    const isNegative: boolean =
        amount.negative &&
        (amount.whole !== "0" || NONZERO_DIGIT_REGEX.test(fraction));

    return `${isNegative ? "-" : ""}${amount.whole}${fraction ? `.${fraction}` : ""}`;
};

export const formatExactDecimalAmount = (
    amount: string,
    minFractionDigits: number,
): string | null => {
    const parsedAmount: IDecimalAmount | null = parseDecimalAmount(amount);

    if (!parsedAmount) {
        return null;
    }

    const { negative, whole } = parsedAmount;
    const fraction: string = parsedAmount.fraction.padEnd(
        minFractionDigits,
        "0",
    );

    return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
};
