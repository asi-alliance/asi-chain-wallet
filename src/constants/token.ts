export const TOKEN_CONFIG = {
  SYMBOL: 'ASI',
  ADDRESS_PREFIX: 'ASI',
  TECHNICAL_NAME: 'ASI',
  DECIMALS: 8,
  ATOMIC_MULTIPLIER: 100000000
} as const;

export const getTokenDisplayName = (): string => TOKEN_CONFIG.SYMBOL;
export const getAddressLabel = (): string => `${TOKEN_CONFIG.ADDRESS_PREFIX} Address`;
export const getTokenTechnicalName = (): string => TOKEN_CONFIG.TECHNICAL_NAME;
