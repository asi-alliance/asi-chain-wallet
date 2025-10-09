import { utils } from 'ethers';

const RCHAIN_ADDRESS_START_STRING: string = "1111";
const ETH_ADDRESS_START_STRING: string = "0x";
const ADDRESS_MINIMUM_LENGTH: number = 54;
const ADDRESS_MAXIMUM_LENGTH: number = 56;

export interface IInputWithValidation {
    isValid: boolean;
    validationMessages: string[];
}

const validateRChainAddress = (
    value: string
): IInputWithValidation => {
    const currentValue = value.trim();
    const validationMessages: string[] = [];

    if (!currentValue?.length) {
        return { validationMessages, isValid: false };
    }

    if (!currentValue.startsWith(RCHAIN_ADDRESS_START_STRING)) {
        validationMessages.push(
            `Your input must start with ${RCHAIN_ADDRESS_START_STRING}`
        );
    }

    if (currentValue.length < ADDRESS_MINIMUM_LENGTH) {
        validationMessages.push(
            `Length must be at least ${ADDRESS_MINIMUM_LENGTH} chars`
        );
    }

    if (currentValue.length > ADDRESS_MAXIMUM_LENGTH) {
        validationMessages.push(
            `Length must be less than ${ADDRESS_MAXIMUM_LENGTH + 1} chars`
        );
    }

    try {
        utils.base58.decode(currentValue);
    } catch(err) {
        validationMessages.push(`Only Base58 symbols allowed`);
    }

    return { validationMessages, isValid: !!value.length && !validationMessages?.length };
};

const validateEthAddress = (value: string): IInputWithValidation => {
    const validationMessages: string[] = [];
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return { isValid: false, validationMessages: ['Address is required'] };
    }
    // Use ethers.js built-in validation
    if (!utils.isAddress(trimmedValue)) {
        validationMessages.push('Invalid Ethereum address format');
    }

    return {
        isValid: validationMessages.length === 0,
        validationMessages
    };
}

const addressValidation = (value: string): IInputWithValidation => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return { isValid: false, validationMessages: ['Address is required'] };
    }

    if (trimmedValue.startsWith(RCHAIN_ADDRESS_START_STRING)) {
        return validateRChainAddress(trimmedValue);
    } else if (trimmedValue.startsWith(ETH_ADDRESS_START_STRING)) {
        return validateEthAddress(trimmedValue);
    } else {
        const rchainResult = validateRChainAddress(trimmedValue);
        const ethResult = validateEthAddress(trimmedValue);
        
        if (rchainResult.isValid) {
        return rchainResult;
        } else if (ethResult.isValid) {
        return ethResult;
        } else {
        return {
            isValid: false,
            validationMessages: [
                `Address format not recognized: 
                    RChain addresses start with "1111"
                    and Ethereum addresses start with "0x"
            `]
        };
        }
    }
}

export default addressValidation;
