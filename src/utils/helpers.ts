export const normalizeUint8Array = (bytes: Uint8Array) => {
    return new Uint8Array(bytes);
};

export const stringifyWithBigInt = (value: unknown): string =>
    JSON.stringify(
        value,
        (_key: string, item: unknown) =>
            typeof item === "bigint" ? item.toString() : item,
        2,
    );

export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === "string" && error.trim()) {
        return error;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};
