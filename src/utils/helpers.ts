export const stringifyWithBigInt = (value: unknown): string =>
    JSON.stringify(
        value,
        (_key: string, item: unknown) =>
            typeof item === "bigint" ? item.toString() : item,
        2,
    );
