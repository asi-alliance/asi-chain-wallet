import CopyButton, { IIconProps } from "components/CopyButton";
import React, { useRef, useEffect, CSSProperties, RefObject, FC } from "react";
import styled from "styled-components";
import { DefaultTheme } from "styled-components/dist/types";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    wrapperStyle?: CSSProperties;
    labelStyle?: CSSProperties;
    labelColorSelector?: (theme: DefaultTheme) => string;
    "data-testid"?: string;
    "data-cy"?: string;
    inputRef?: RefObject<HTMLInputElement>;
    copyable?: boolean;
    CustomCopyIcon?: FC<IIconProps>;
    withoutHoverUI?: boolean;
}

const InputWrapper = styled.div<{ $fullWidth?: boolean }>`
    display: ${({ $fullWidth }) => ($fullWidth ? "block" : "inline-block")};
    width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
    margin-bottom: 16px;
`;

const Label = styled.label<{
    $themeColorSelector?: (theme: DefaultTheme) => string;
}>`
    display: block;
    font-size: 1rem;
    line-height: 22px;
    font-weight: 600;
    color: ${({ theme, $themeColorSelector }) =>
        !$themeColorSelector
            ? theme.text.secondary
            : $themeColorSelector(theme)};
    margin-bottom: 8px;
    letter-spacing: -0.01em;
    transition: color 0.2s ease;

    ${InputWrapper}:focus-within & {
        color: ${({ theme }) => theme.text.primary};
    }
`;

const StyledInput = styled.input<{
    $hasError?: boolean;
    $copyable?: boolean;
    $withoutHoverUI?: boolean;
}>`
    width: 100%;
    padding: ${({ $copyable }) =>
        $copyable ? "12px 40px 12px 20px" : "12px 20px"};
    font-size: 1rem;
    font-weight: 400;
    // line-height: 24px;
    min-height: 44px; /* Touch-friendly minimum */
    height: 44px;
    background: "transparent";
    border: 2px solid
        ${({ theme, $hasError }) =>
            $hasError ? theme.danger : theme.colors.border};
    border-radius: 8px;
    color: ${({ theme }) => theme.text.primary};
    transition: all 0.2s ease;
    outline: none;

    /* ASI Wallet elevation */
    // box-shadow: ${({ theme }) => theme.shadow};

    ${({ $withoutHoverUI, theme, $hasError }) =>
        !$withoutHoverUI &&
        `
            &:hover:not(:disabled) {
                border-color: ${$hasError ? theme.danger : `${theme.primary}`};
            }

            &:focus {
                border-color: ${$hasError ? theme.danger : theme.primary};
                outline: 2px solid
                    ${$hasError ? theme.danger : theme.primary};
                outline-offset: 2px;
            }
        `}

    &::placeholder {
        color: ${({ theme }) => theme.text.primary};
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

const InputContainer = styled.div`
    position: relative;
    width: 100%;
`;

const CopyButtonWrapper = styled.div`
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const StyledTextArea = styled.textarea<{ $hasError?: boolean }>`
    width: 100%;
    padding: 11.5px 22px;
    font-size: 16px;
    font-weight: 400;
    background: ${({ theme }) => theme.inputBg};
    border: 2px solid
        ${({ theme, $hasError }) => ($hasError ? theme.danger : "transparent")};
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
            ({ theme, $hasError }) =>
                $hasError
                    ? theme.danger
                    : `${theme.primary}33` /* 20% opacity */
        };
    }

    &:focus {
        border-color: ${({ theme, $hasError }) =>
            $hasError ? theme.danger : theme.secondary};
        outline: 2px solid
            ${({ theme, $hasError }) =>
                $hasError ? theme.danger : theme.secondary};
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
    "data-testid": dataTestId,
    "data-cy": dataCy,
    onChange,
    onInput,
    autoFocus,
    wrapperStyle,
    labelStyle,
    labelColorSelector,
    inputRef,
    copyable = false,
    value,
    CustomCopyIcon,
    withoutHoverUI = false,
    ...props
}) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const currentRef = inputRef || defaultRef;

    useEffect(() => {
        if (autoFocus && currentRef.current) {
            const timer = setTimeout(() => {
                currentRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus, currentRef]);

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

    const getValueToCopy = () => {
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }

        if (currentRef.current) {
            return currentRef.current.value;
        }
        return "";
    };

    return (
        <InputWrapper $fullWidth={fullWidth} style={wrapperStyle}>
            <h4>
                {label && (
                    <Label
                        $themeColorSelector={labelColorSelector}
                        style={labelStyle}
                    >
                        {label}
                    </Label>
                )}
            </h4>
            <InputContainer>
                <StyledInput
                    ref={currentRef}
                    $hasError={!!error}
                    data-testid={dataTestId}
                    data-cy={dataCy}
                    onChange={handleChange}
                    onInput={handleInput}
                    value={value}
                    $copyable={copyable}
                    $withoutHoverUI={withoutHoverUI}
                    {...props}
                />
                {copyable && (
                    <CopyButtonWrapper>
                        <CopyButton
                            dataToCopy={getValueToCopy()}
                            size={16}
                            CustomCopyIcon={CustomCopyIcon}
                            buttonStyle={{
                                position: "static",
                                top: "auto",
                                right: "auto",
                                transform: "none",
                                display: "block",
                                height: 16,
                            }}
                            disabled={!value}
                        />
                    </CopyButtonWrapper>
                )}
            </InputContainer>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputWrapper>
    );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    wrapperStyle?: CSSProperties;
    labelStyle?: CSSProperties;
    labelColorSelector?: (theme: DefaultTheme) => string;
    "data-testid"?: string;
    "data-cy"?: string;
    textareaRef?: RefObject<HTMLTextAreaElement>;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    fullWidth = true,
    wrapperStyle,
    labelStyle,
    labelColorSelector,
    "data-testid": dataTestId,
    "data-cy": dataCy,
    textareaRef,
    onChange,
    onInput,
    autoFocus,
    ...props
}) => {
    const defaultRef = useRef<HTMLTextAreaElement>(null);
    const currentRef = textareaRef || defaultRef;

    useEffect(() => {
        if (autoFocus && currentRef.current) {
            const timer = setTimeout(() => {
                currentRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus, currentRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (onInput) {
            onInput(e);
        }
        if (onChange) {
            const changeEvent = {
                ...e,
                target: e.currentTarget,
                currentTarget: e.currentTarget,
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(changeEvent);
        }
    };

    return (
        <InputWrapper $fullWidth={fullWidth} style={wrapperStyle}>
            {label && (
                <Label
                    $themeColorSelector={labelColorSelector}
                    style={labelStyle}
                >
                    {label}
                </Label>
            )}
            <StyledTextArea
                ref={currentRef}
                $hasError={!!error}
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
