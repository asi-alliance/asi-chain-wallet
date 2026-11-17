const DECIMAL_AMOUNT_REGEX = /^(-?)(\d+)(?:\.(\d+))?$/;
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

    const [, sign, integerDigits, fractionDigits = ""] = match;

    const integer: string = integerDigits.replace(LEADING_ZEROS_REGEX, "");
    const fraction: string = fractionDigits.padEnd(minFractionDigits, "0");
    const amountSign: string =
        sign && NONZERO_DIGIT_REGEX.test(integerDigits + fractionDigits)
            ? sign
            : "";

    return `${amountSign}${integer}${fraction ? `.${fraction}` : ""}`;
};
