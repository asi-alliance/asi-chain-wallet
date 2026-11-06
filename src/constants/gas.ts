import {
    ASI_DECIMALS,
    fromAtomicAmount,
    GasFee,
} from "@asichain/asi-wallet-sdk";

export const GAS_FEE = {
    BASE_FEE: 0.0025,
    VARIATION_RANGE: 0.1,
} as const;

export const generateRandomGasFee = (): string => {
    const variation = (Math.random() - 0.5) * 2 * GAS_FEE.VARIATION_RANGE;
    const randomFee = GAS_FEE.BASE_FEE * (1 + variation);
    return randomFee.toFixed(4);
};

export const getGasFeeRangeLabel = (decimals = ASI_DECIMALS): string => {
    const min = fromAtomicAmount(GasFee.MIN, decimals);
    const max = fromAtomicAmount(GasFee.MAX, decimals);

    return `~${min}-${max}`;
};
