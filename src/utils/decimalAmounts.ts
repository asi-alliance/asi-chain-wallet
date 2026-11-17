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

export const compareDecimalAmounts = (
    left: unknown,
    right: unknown,
): -1 | 0 | 1 | null => {
    const a = parseDecimalAmount(left);
    const b = parseDecimalAmount(right);
    if (!a || !b) return null;
    if (a.negative !== b.negative) return a.negative ? -1 : 1;

    let order: -1 | 0 | 1 = 0;
    if (a.whole.length !== b.whole.length) {
        order = a.whole.length < b.whole.length ? -1 : 1;
    } else if (a.whole !== b.whole) {
        order = a.whole < b.whole ? -1 : 1;
    } else {
        const width = Math.max(a.fraction.length, b.fraction.length);
        const af = a.fraction.padEnd(width, "0");
        const bf = b.fraction.padEnd(width, "0");
        if (af !== bf) order = af < bf ? -1 : 1;
    }
    return a.negative && order !== 0 ? (order === 1 ? -1 : 1) : order;
};

export const formatDecimalAmount = (
    value: unknown,
    minDecimals = 0,
    maxDecimals?: number,
): string | null => {
    if (
        !Number.isSafeInteger(minDecimals) || minDecimals < 0 ||
        (maxDecimals !== undefined &&
            (!Number.isSafeInteger(maxDecimals) || maxDecimals < minDecimals))
    ) {
        throw new RangeError("Invalid display precision");
    }
    const amount = parseDecimalAmount(value);
    if (!amount) return null;

    const fraction = (maxDecimals === undefined
        ? amount.fraction
        : amount.fraction.slice(0, maxDecimals)
    ).replace(TRAILING_ZEROS_REGEX, "").padEnd(minDecimals, "0");
    const sign = amount.negative &&
        (amount.whole !== "0" || NONZERO_DIGIT_REGEX.test(fraction))
        ? "-" : "";
    return `${sign}${amount.whole}${fraction ? `.${fraction}` : ""}`;
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
