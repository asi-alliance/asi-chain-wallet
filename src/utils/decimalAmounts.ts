interface IDecimalAmount {
    negative: boolean;
    whole: string;
    fraction: string;
}

const parseDecimalAmount = (value: unknown): IDecimalAmount | null => {
    // A numeric input is usable only while its integer value is provably exact.
    if (typeof value === "number") {
        if (!Number.isSafeInteger(value)) return null;
        value = String(value);
    }
    if (typeof value !== "string") return null;

    const match = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value.trim());
    if (!match) return null;

    const whole = match[2];
    const fraction = (match[3] ?? "").replace(/0+$/, "");
    return {
        negative: match[1] === "-" && (whole !== "0" || fraction !== ""),
        whole,
        fraction,
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

// Optional shortening affects display only and never rounds a balance upward.
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
    ).replace(/0+$/, "").padEnd(minDecimals, "0");
    const sign = amount.negative && (amount.whole !== "0" || /[1-9]/.test(fraction))
        ? "-" : "";
    return `${sign}${amount.whole}${fraction ? `.${fraction}` : ""}`;
};
