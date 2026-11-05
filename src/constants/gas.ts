import {
    ASI_DECIMALS,
    fromAtomicAmountToNumber,
    GasFee,
} from "@asichain/asi-wallet-sdk";

export const getGasFeeRangeLabel = (): string => {
    const min = fromAtomicAmountToNumber(GasFee.MIN, ASI_DECIMALS);
    const max = fromAtomicAmountToNumber(GasFee.MAX, ASI_DECIMALS);

    return `~${min}-${max}`;
};
