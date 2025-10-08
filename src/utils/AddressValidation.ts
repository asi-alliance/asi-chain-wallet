export interface IInputWithValidationConfig {
    shouldStartWith?: string;
    minimumLength?: number;
    maximumLength?: number;
    alphabetRegex?: RegExp;
    regexHint?: string;
}

const ADDRESS_START_STRING: string = "1111";
const ADDRESS_MINIMUM_LENGTH: number = 54;
const ADDRESS_MAXIMUM_LENGTH: number = 56;

const ADDRESS_ALPHABET_REGEX: RegExp = /^[1-9A-HJ-NP-Za-km-z]+$/;

const ADDRESS_VALIDATION_CONFIG: IInputWithValidationConfig = {
    shouldStartWith: ADDRESS_START_STRING,
    minimumLength: ADDRESS_MINIMUM_LENGTH,
    maximumLength: ADDRESS_MAXIMUM_LENGTH,
    alphabetRegex: ADDRESS_ALPHABET_REGEX,
    regexHint: "[1-9], [a-km-z], [A-HJ-NP-Z]",
};

export interface IInputWithValidationConfig {
    shouldStartWith?: string;
    minimumLength?: number;
    maximumLength?: number;
    alphabetRegex?: RegExp;
    regexHint?: string;
}

export interface IInputWithValidation {
    isValueValid: boolean;
    validationMessages: string[];
}

const addressValidation = (
    value: string
): IInputWithValidation => {
    const config = ADDRESS_VALIDATION_CONFIG;
        const currentValue = value.trim();
        const validationMessages: string[] = [];

        if (!currentValue?.length) {
            return { validationMessages, isValueValid: false };
        }

        if (
            config.shouldStartWith &&
            !currentValue.startsWith(config.shouldStartWith)
        ) {
            validationMessages.push(
                `Your input must start with ${config.shouldStartWith}`
            );
        }

        if (
            config.minimumLength &&
            currentValue.length < config.minimumLength
        ) {
            validationMessages.push(
                `Length must be at least ${config.minimumLength} chars`
            );
        }

        if (
            config.maximumLength &&
            currentValue.length > config.maximumLength
        ) {
            validationMessages.push(
                `Length must be less than ${config.maximumLength + 1} chars`
            );
        }

        if (config.alphabetRegex && !config.alphabetRegex.test(currentValue)) {
            validationMessages.push(
                config.regexHint?.length
                    ? `Only ${config.regexHint} symbols allowed`
                    : `Must not contain unsupported characters`
            );
        }

        const isValueValid: boolean =
            !!value.length && !validationMessages?.length;

        return { validationMessages, isValueValid };
};


export default addressValidation;
