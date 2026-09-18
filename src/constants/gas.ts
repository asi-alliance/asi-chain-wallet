import {
    ASI_DECIMALS,
    fromAtomicAmountToNumber,
    GasFee,
} from "@asichain/asi-wallet-sdk";
import { BRIDGE_LOCK_MAX_GAS_COST } from "services/rchain";

export const GAS_FEE = {
    BASE_FEE: 0.0025,
    VARIATION_RANGE: 0.1,
} as const;

export const generateRandomGasFee = (): string => {
    const variation = (Math.random() - 0.5) * 2 * GAS_FEE.VARIATION_RANGE;
    const randomFee = GAS_FEE.BASE_FEE * (1 + variation);
    return randomFee.toFixed(4);
};

export const getGasFeeAsNumber = (): number => {
    return fromAtomicAmountToNumber(GasFee.MAX, ASI_DECIMALS);
};

export const getGasFeeRangeLabel = (): string => {
    const min = fromAtomicAmountToNumber(GasFee.MIN, ASI_DECIMALS);
    const max = fromAtomicAmountToNumber(GasFee.MAX, ASI_DECIMALS);

    return `~${min}-${max}`;
};

export const getGasFeeForBridgeAsNumber = (): number => {
    return fromAtomicAmountToNumber(BRIDGE_LOCK_MAX_GAS_COST, ASI_DECIMALS);
};
