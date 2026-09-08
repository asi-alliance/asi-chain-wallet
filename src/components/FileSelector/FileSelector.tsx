import React, { ChangeEvent, CSSProperties, ReactNode } from "react";
import styled from "styled-components";
import { ErrorMessage, InputWrapper, Label } from "components/Input/Input";

export interface FileSelectorProps {
    id: string;
    label?: string;
    accept?: string;
    hint?: ReactNode;
    error?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    wrapperStyle?: CSSProperties;
    onSelect: (file: File | null) => void;
}

const StyledFileInput = styled.input<{ $hasError?: boolean }>`
    width: 100%;
    padding: 12px 20px;
    font-size: 1rem;
    background: transparent;
    border: 2px dashed
        ${({ theme, $hasError }) =>
            $hasError ? theme.danger : theme.colors.border};
    border-radius: 8px;
    color: ${({ theme }) => theme.text.primary};
    transition: all 0.2s ease;
    outline: none;
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: ${({ theme, $hasError }) =>
            $hasError ? theme.danger : theme.primary};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &::file-selector-button {
        margin-right: 12px;
        padding: 6px 14px;
        border: none;
        border-radius: 6px;
        background: ${({ theme }) => theme.primary};
        color: ${({ theme }) => theme.text.inverse};
        font-size: 0.875rem;
        cursor: inherit;
    }
`;

const Hint = styled.span`
    display: block;
    margin-top: 8px;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.text.secondary};
`;

export const FileSelector: React.FC<FileSelectorProps> = ({
    id,
    label,
    accept,
    hint,
    error,
    disabled,
    fullWidth = true,
    wrapperStyle,
    onSelect,
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onSelect(event.target.files?.[0] ?? null);
    };

    return (
        <InputWrapper $fullWidth={fullWidth} style={wrapperStyle}>
            {label && <Label htmlFor={id}>{label}</Label>}
            <StyledFileInput
                id={id}
                type="file"
                accept={accept}
                disabled={disabled}
                $hasError={!!error}
                onChange={handleChange}
            />
            {hint && <Hint>{hint}</Hint>}
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputWrapper>
    );
};
