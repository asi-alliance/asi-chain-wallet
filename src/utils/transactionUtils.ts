import { getTokenDisplayName } from "constants/token";

export const formatTransactionAmount = (amount?: string): string => {
    if (!amount) {
        return "-";
    }

    const amountNumber = Number.parseFloat(amount);

    return Number.isNaN(amountNumber)
        ? `${amount} ${getTokenDisplayName()}`
        : `${amountNumber.toFixed(8)} ${getTokenDisplayName()}`;
};
