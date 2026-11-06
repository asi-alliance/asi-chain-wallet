import { getTokenDisplayName } from "constants/token";

export const formatTransactionAmount = (amount?: string): string => {
    if (!amount) {
        return "-";
    }

    if (!/^-?(0|[1-9]\d*)(?:\.\d+)?$/.test(amount)) {
        return `${amount} ${getTokenDisplayName()}`;
    }

    const [integer, fraction = ""] = amount.split(".");
    return `${integer}.${fraction.padEnd(8, "0")} ${getTokenDisplayName()}`;
};
