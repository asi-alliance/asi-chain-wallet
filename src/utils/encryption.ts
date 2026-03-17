import CryptoJS from 'crypto-js';

export interface PasswordValidation {
  isValid: boolean;
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const validation: PasswordValidation = {
    isValid: false,
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[&@^$#%*!?=_\-'<>~,.;:+()[\]{}/]/.test(password),
    errors: [],
  };

  if (!validation.minLength) validation.errors.push('Password must be at least 8 characters long');
  if (!validation.hasUpperCase) validation.errors.push('Password must contain at least one uppercase letter');
  if (!validation.hasLowerCase) validation.errors.push('Password must contain at least one lowercase letter');
  if (!validation.hasDigit) validation.errors.push('Password must contain at least one digit');
  if (!validation.hasSpecialChar) validation.errors.push('Password must contain at least one special character');

  validation.isValid = validation.errors.length === 0;
  return validation;
};

// SHA-256 hash — used only for storage key derivation, not for encryption
export const hashValue = (value: string): string => CryptoJS.SHA256(value).toString();