import { getTokenDisplayName } from '../constants/token';

/**
 * Formats a balance value for display with appropriate precision
 * @param balance - The balance value as string or number
 * @param options - Formatting options
 * @returns Formatted balance string
 */
export const formatBalance = (
  balance: string | number, 
  options: {
    showCurrency?: boolean;
    maxDecimals?: number;
    minDecimals?: number;
  } = {}
): string => {
  const {
    showCurrency = true,
    maxDecimals = 8,
    minDecimals = 0,
  } = options;

  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num) || !isFinite(num)) {
    return showCurrency ? `0 ${getTokenDisplayName()}` : '0';
  }

  if (num === 0) {
    return showCurrency ? `0 ${getTokenDisplayName()}` : '0';
  }

  if (num < 0.000001) {
    return showCurrency ? `<0.000001 ${getTokenDisplayName()}` : '<0.000001';
  }

  let decimals = minDecimals;
  
  if (num >= 1) {
    decimals = Math.min(maxDecimals, 2);
  } else if (num >= 0.01) {
    decimals = Math.min(maxDecimals, 4);
  } else if (num >= 0.0001) {
    decimals = Math.min(maxDecimals, 6);
  } else {
    decimals = Math.min(maxDecimals, 8);
  }

  const formatted = num.toFixed(decimals);
  
  const trimmed = parseFloat(formatted).toString();
  
  return showCurrency ? `${trimmed} ${getTokenDisplayName()}` : trimmed;
};

/**
 * Formats balance for display in account switcher (compact format)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceCompact = (balance: string | number): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num) || !isFinite(num)) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num === 0) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num < 0.0001) {
    return `<0.0001 ${getTokenDisplayName()}`;
  }

  if (num >= 1) {
    const formatted = num.toFixed(4);
    const trimmed = parseFloat(formatted).toString();
    return `${trimmed} ${getTokenDisplayName()}`;
  } else if (num >= 0.01) {
    return `${num.toFixed(4)} ${getTokenDisplayName()}`;
  } else {
    return `${num.toFixed(6)} ${getTokenDisplayName()}`;
  }
};

/**
 * Formats balance for display in account cards (medium precision)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceCard = (balance: string | number): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num) || !isFinite(num)) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num === 0) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num < 0.000001) {
    return `<0.000001 ${getTokenDisplayName()}`;
  }


  if (num >= 1) {
    const truncated = Math.floor(num * 10000) / 10000;
    return `${truncated.toFixed(4)} ${getTokenDisplayName()}`;
  } else if (num >= 0.001) {
    const truncated = Math.floor(num * 1000000) / 1000000;
    return `${truncated.toFixed(6)} ${getTokenDisplayName()}`;
  } else {
    const truncated = Math.floor(num * 100000000) / 100000000;
    return `${truncated.toFixed(8)} ${getTokenDisplayName()}`;
  }
};

/**
 * Formats balance for display on dashboard (high precision)
 * @param balance - The balance value as string or number
 * @returns Formatted balance string
 */
export const formatBalanceDashboard = (balance: string | number): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num) || !isFinite(num)) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num === 0) {
    return `0 ${getTokenDisplayName()}`;
  }

  if (num < 0.00000001) {
    return `<0.00000001 ${getTokenDisplayName()}`;
  }

  // Always truncate (round down) to avoid displaying more than available
  if (num >= 1) {
    const truncated = Math.floor(num * 100) / 100;
    return `${truncated.toFixed(2)} ${getTokenDisplayName()}`;
  } else if (num >= 0.01) {
    const truncated = Math.floor(num * 1000000) / 1000000;
    return `${truncated.toFixed(6)} ${getTokenDisplayName()}`;
  } else {
    const truncated = Math.floor(num * 100000000) / 100000000;
    return `${truncated.toFixed(8)} ${getTokenDisplayName()}`;
  }
};
