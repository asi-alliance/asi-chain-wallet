import { getTokenDisplayName } from "constants/token";
import { formatExactDecimalAmount } from "./decimalAmounts";

const MIN_TRANSACTION_AMOUNT_FRACTION_DIGITS = 8;

export const formatTransactionAmount = (
    amount: string,
    nativeTokenDecimals: number,
): string => {
    if (!amount) {
        return "-";
    }

    const formattedAmount: string | null = formatExactDecimalAmount(
        amount,
        Math.min(MIN_TRANSACTION_AMOUNT_FRACTION_DIGITS, nativeTokenDecimals),
    );

    return `${formattedAmount ?? amount} ${getTokenDisplayName()}`;
};
