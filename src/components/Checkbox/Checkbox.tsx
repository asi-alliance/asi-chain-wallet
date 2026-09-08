import React, { ChangeEvent, ReactNode } from "react";
import styled from "styled-components";

export interface CheckboxProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: ReactNode;
    className?: string;
    "data-testid"?: string;
}

const CheckboxWrapper = styled.span<{ $disabled?: boolean }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const CheckboxBox = styled.span`
    position: relative;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    background: transparent;
    transition: all 0.2s ease;

    &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: 4px;
        width: 4px;
        height: 9px;
        border: solid ${({ theme }) => theme.text.inverse};
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transition: transform 0.15s ease;
    }
`;

const CheckboxInput = styled.input`
    position: absolute;
    top: 0;
    left: 0;
    width: 18px;
    height: 18px;
    margin: 0;
    opacity: 0;
    cursor: inherit;

    &:checked + ${CheckboxBox} {
        background: ${({ theme }) => theme.primary};
        border-color: ${({ theme }) => theme.primary};
    }

    &:checked + ${CheckboxBox}::after {
        transform: rotate(45deg) scale(1);
    }

    &:focus-visible + ${CheckboxBox} {
        outline: 2px solid ${({ theme }) => theme.primary};
        outline-offset: 2px;
    }

    &:hover:not(:disabled) + ${CheckboxBox} {
        border-color: ${({ theme }) => theme.primary};
    }

    &:disabled {
        cursor: not-allowed;
    }
`;

const CheckboxLabel = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-size: 0.875rem;
`;

export const Checkbox: React.FC<CheckboxProps> = ({
    id,
    checked,
    onChange,
    disabled = false,
    label,
    className,
    "data-testid": dataTestId,
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.target.checked);
    };

    return (
        <CheckboxWrapper className={className} $disabled={disabled}>
            <CheckboxInput
                id={id}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
                data-testid={dataTestId}
            />
            <CheckboxBox />
            {label && <CheckboxLabel>{label}</CheckboxLabel>}
        </CheckboxWrapper>
    );
};
