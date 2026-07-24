export const ASI_CHAIN_DECIMALS = 8;
export const CARDANO_TOKEN_DECIMALS = 8;
export const DISPLAY_DECIMALS = 8;

const scaleFor = (decimals: number): bigint => {
    if (!Number.isInteger(decimals) || decimals < 0) {
        throw new Error(`Invalid token decimals: ${decimals}`);
    }
    return BigInt("1" + "0".repeat(decimals));
};

export const formatToken = (
    raw: bigint,
    decimals = ASI_CHAIN_DECIMALS,
    displayDecimals = DISPLAY_DECIMALS,
): string => {
    const scale = scaleFor(decimals);
    const abs = raw < BigInt(0) ? -raw : raw;
    const whole = abs / scale;
    const sign = raw < BigInt(0) ? "-" : "";

    if (displayDecimals <= 0) return `${sign}${whole}`;

    const shownDigits = Math.min(decimals, displayDecimals);
    const frac = abs % scale;
    const shownFrac =
        shownDigits > 0
            ? frac.toString().padStart(decimals, "0").slice(0, shownDigits)
            : "";

    return `${sign}${whole}.${shownFrac.padEnd(displayDecimals, "0")}`;
};

export const parseTokenInput = (
    str: string,
    decimals = ASI_CHAIN_DECIMALS,
    displayDecimals = DISPLAY_DECIMALS,
): bigint => {
    if (!str || str.trim() === "") return BigInt(0);

    const scale = scaleFor(decimals);
    const clean = str.replace(/[^\d.]/g, "");
    const [whole = "0", frac = ""] = clean.split(".");
    const fracDigits = Math.min(decimals, displayDecimals);
    const fracBaseUnits =
        fracDigits > 0
            ? BigInt(frac.slice(0, fracDigits).padEnd(decimals, "0") || "0")
            : BigInt(0);

    return BigInt(whole || "0") * scale + fracBaseUnits;
};

export const formatTokenAmount = (
    value: string | number | bigint,
    decimals = ASI_CHAIN_DECIMALS,
): string => {
    try {
        return formatToken(
            BigInt(typeof value === "string" ? value.trim() : value),
            decimals,
        );
    } catch {
        return String(value);
    }
};
