export const parsePositivePrice = (value: unknown): string | null => {
    if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
    if (typeof value !== "string" && typeof value !== "number") return null;
    const price = String(value);
    return price.length <= 78 && /^[1-9]\d*$/.test(price) &&
        BigInt(price) < (1n << 256n) ? price : null;
};

export const deployPriceError = (price: string, minimum: string, maximum: bigint): string | undefined => {
    if (!parsePositivePrice(price) || BigInt(price) < BigInt(minimum)) {
        return `Enter a whole Phlo Price of at least ${minimum}.`;
    }
    if (BigInt(price) > maximum) return `The signing limit for this network is ${maximum}.`;
};
