import { ASI_DECIMALS } from "@asichain/asi-wallet-sdk";

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
    decimals = ASI_DECIMALS,
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

export const formatTokenAmount = (
    value: string | number | bigint,
    decimals = ASI_DECIMALS,
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
