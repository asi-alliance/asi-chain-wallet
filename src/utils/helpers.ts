export const normalizeUint8Array = (bytes: Uint8Array) => {
    return new Uint8Array(bytes);
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === "string" && error.trim()) {
        return error;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};
