import React, { useRef, useEffect } from "react";
import styled from "styled-components";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    'data-testid'?: string;
    'data-cy'?: string;
}

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
    display: ${({ fullWidth }) => (fullWidth ? "block" : "inline-block")};
    width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    // font-size: 14px;
    line-height: 22px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
    letter-spacing: -0.01em;
    transition: color 0.2s ease;

    ${InputWrapper}:focus-within & {
        color: ${({ theme }) => theme.text.primary};
    }
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
    width: 100%;
    padding: 12px 16px;
    // font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    min-height: 44px; /* Touch-friendly minimum */
    background: ${({ theme }) => theme.inputBg};
    border: 2px solid
        ${({ theme, hasError }) => (hasError ? theme.danger : "transparent")};
    border-radius: 8px;
    color: ${({ theme }) => theme.text.primary};
    transition: all 0.2s ease;
    outline: none;

    /* ASI Wallet elevation */
    box-shadow: ${({ theme }) => theme.shadow};

    &:hover:not(:disabled) {
        border-color: ${
            ({ theme, hasError }) =>
                hasError ? theme.danger : `${theme.primary}33` /* 20% opacity */
        };
    }

    &:focus {
        border-color: ${({ theme, hasError }) =>
            hasError ? theme.danger : theme.secondary};
        outline: 2px solid
            ${({ theme, hasError }) =>
                hasError ? theme.danger : theme.secondary};
        outline-offset: 2px;
    }

    &::placeholder {
        color: ${({ theme }) => theme.text.secondary};
        opacity: 0.7;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: ${({ theme }) => theme.inputBg};
    }
`;

const ErrorMessage = styled.span`
    display: block;
    font-size: 13px;
    line-height: 20px;
    font-weight: 500;
    color: ${({ theme }) => theme.danger};
    margin-top: 6px;
    animation: slideIn 0.2s ease;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-2px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const StyledTextArea = styled.textarea<{ hasError?: boolean }>`
    width: 100%;
    padding: 12px 16px;
    // font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    background: ${({ theme }) => theme.inputBg};
    border: 2px solid
        ${({ theme, hasError }) => (hasError ? theme.danger : "transparent")};
    border-radius: 8px;
    color: ${({ theme }) => theme.text.primary};
    transition: all 0.2s ease;
    outline: none;
    resize: vertical;
    min-height: 120px;

    /* ASI Wallet elevation */
    box-shadow: ${({ theme }) => theme.shadow};

    &:hover:not(:disabled) {
        border-color: ${
            ({ theme, hasError }) =>
                hasError ? theme.danger : `${theme.primary}33` /* 20% opacity */
        };
    }

    &:focus {
        border-color: ${({ theme, hasError }) =>
            hasError ? theme.danger : theme.secondary};
        outline: 2px solid
            ${({ theme, hasError }) =>
                hasError ? theme.danger : theme.secondary};
        outline-offset: 2px;
    }

    &::placeholder {
        color: ${({ theme }) => theme.text.secondary};
        opacity: 0.7;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: ${({ theme }) => theme.inputBg};
    }
`;

export const Input: React.FC<InputProps> = ({
    label,
    error,
    fullWidth = true,
    'data-testid': dataTestId,
    'data-cy': dataCy,
    onChange,
    onInput,
    autoFocus,
    ...props
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        if (onInput) {
            onInput(e);
        }
        if (onChange) {
            const changeEvent = {
                ...e,
                target: e.currentTarget,
                currentTarget: e.currentTarget,
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(changeEvent);
        }
    };

    return (
        <InputWrapper fullWidth={fullWidth}>
            <h4>{label && <Label>{label}</Label>}</h4>
            <StyledInput
                ref={inputRef}
                hasError={!!error}
                data-testid={dataTestId}
                data-cy={dataCy}
                onChange={handleChange}
                onInput={handleInput}
                {...props}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputWrapper>
    );
};

interface TextAreaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    fullWidth = true,
    ...props
}) => {
    return (
        <InputWrapper fullWidth={fullWidth}>
            {label && <Label>{label}</Label>}
            <StyledTextArea hasError={!!error} {...props} />
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputWrapper>
    );
};
