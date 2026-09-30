import React, { ChangeEvent, ReactNode, useId } from "react";
import styled from "styled-components";

export interface RadioProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "checked" | "onChange" | "type"
    > {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
}

const RadioWrapper = styled.label<{ $disabled: boolean }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const RadioInput = styled.input`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
`;

const RadioControl = styled.span`
    position: relative;
    width: ${({ theme }) => theme.sizes.checkbox};
    height: ${({ theme }) => theme.sizes.checkbox};
    flex-shrink: 0;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.radioBorder};
    border-radius: 50%;
    background: ${({ theme }) => theme.control.fieldBackground};
    transition:
        border-color ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing};

    &::after {
        content: "";
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background: ${({ theme }) => theme.primary};
        transform: scale(0);
        transition: transform ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing};
    }

    ${RadioInput}:checked + & {
        border-color: ${({ theme }) => theme.primary};
    }

    ${RadioInput}:checked + &::after {
        transform: scale(1);
    }

    ${RadioWrapper}:hover ${RadioInput}:not(:disabled) + & {
        border-color: ${({ theme }) => theme.primary};
    }

    ${RadioInput}:focus-visible + & {
        border-color: ${({ theme }) => theme.primary};
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }
`;

const RadioLabel = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

export const Radio: React.FC<RadioProps> = ({
    checked,
    onChange,
    disabled = false,
    label,
    id,
    className,
    ...props
}) => {
    const generatedId = useId();
    const controlId = id ?? `radio-${generatedId}`;

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.target.checked);
    };

    return (
        <RadioWrapper className={className} $disabled={disabled}>
            <RadioInput
                {...props}
                id={controlId}
                type="radio"
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
            />
            <RadioControl aria-hidden="true" />
            {label && <RadioLabel>{label}</RadioLabel>}
        </RadioWrapper>
    );
};
