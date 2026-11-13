const DECIMAL_AMOUNT_REGEX = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/;
const LEADING_ZEROS_REGEX = /^0+(?=\d)/;
const NONZERO_DIGIT_REGEX = /[1-9]/;

export const formatExactDecimalAmount = (
    amount: string,
    minFractionDigits: number,
): string | null => {
    const match: RegExpExecArray | null = DECIMAL_AMOUNT_REGEX.exec(amount);

    if (!match) {
        return null;
    }

    const [, sign, integerDigits, fractionDigits = "", exponent = "0"] = match;
    const digits: string = integerDigits + fractionDigits;
    const pointIndex: number = integerDigits.length + Number(exponent);

    const alignedDigits: string =
        pointIndex < 1
            ? "0".repeat(1 - pointIndex) + digits
            : digits.padEnd(pointIndex, "0");
    const integerLength: number = Math.max(pointIndex, 1);

    const integer: string = alignedDigits
        .slice(0, integerLength)
        .replace(LEADING_ZEROS_REGEX, "");
    const fraction: string = alignedDigits
        .slice(integerLength)
        .padEnd(minFractionDigits, "0");
    const amountSign: string =
        sign && NONZERO_DIGIT_REGEX.test(digits) ? sign : "";

    return `${amountSign}${integer}${fraction ? `.${fraction}` : ""}`;
};
