// Gas fee constants - Single source of truth for transaction fees
export const GAS_FEE = {
  // Estimated gas fee for transactions (in ASI)
  ESTIMATED_FEE: '0.0025',
  
  // Gas fee display label
  LABEL: 'ASI',
  
  // Gas fee for different transaction types (if needed in future)
  TRANSFER: '0.0025',
  DEPLOY: '0.0025',
} as const;

// Helper function to get gas fee as number
export const getGasFeeAsNumber = (): number => {
  return parseFloat(GAS_FEE.ESTIMATED_FEE);
};

// Helper function to format gas fee display
export const formatGasFee = (): string => {
  return `${GAS_FEE.ESTIMATED_FEE} ${GAS_FEE.LABEL}`;
};
