export const GAS_FEE = {
  BASE_FEE: 0.0025,
  VARIATION_RANGE: 0.1,
  LABEL: 'ASI',
  TRANSFER: '0.0025',
  DEPLOY: '0.0025',
} as const;

export const generateRandomGasFee = (): string => {
  const variation = (Math.random() - 0.5) * 2 * GAS_FEE.VARIATION_RANGE;
  const randomFee = GAS_FEE.BASE_FEE * (1 + variation);
  return randomFee.toFixed(4);
};

export const getGasFeeAsNumber = (): number => {
  return GAS_FEE.BASE_FEE;
};

export const formatGasFee = (fee?: string): string => {
  const feeValue = fee || generateRandomGasFee();
  return `${feeValue} ${GAS_FEE.LABEL}`;
};
