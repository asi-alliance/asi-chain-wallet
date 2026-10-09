import React, { ChangeEvent, ReactNode, useId } from "react";
import styled from "styled-components";

export interface CheckboxProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "checked" | "onChange" | "type"
    > {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
}

const CheckboxWrapper = styled.label<{ $disabled: boolean }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const CheckboxBox = styled.span`
    position: relative;
    width: ${({ theme }) => theme.sizes.checkbox};
    height: ${({ theme }) => theme.sizes.checkbox};
    flex-shrink: 0;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.xs};
    background: ${({ theme }) => theme.control.fieldBackground};
    transition:
        border-color ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing},
        background-color ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing};

    &::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 5px;
        width: 4px;
        height: 8px;
        border: solid ${({ theme }) => theme.text.inverse};
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transition: transform ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing};
    }
`;

const CheckboxInput = styled.input`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;

    &:checked + ${CheckboxBox} {
        border-color: ${({ theme }) => theme.primary};
        background: ${({ theme }) => theme.primary};
    }

    &:checked + ${CheckboxBox}::after {
        transform: rotate(45deg) scale(1);
    }

    &:focus-visible + ${CheckboxBox} {
        border-color: ${({ theme }) => theme.primary};
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    ${CheckboxWrapper}:hover &:not(:disabled) + ${CheckboxBox} {
        border-color: ${({ theme }) => theme.primary};
    }
`;

const CheckboxLabel = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

export const Checkbox: React.FC<CheckboxProps> = ({
    id,
    checked,
    onChange,
    disabled = false,
    label,
    className,
    ...props
}) => {
    const generatedId = useId();
    const controlId = id ?? `checkbox-${generatedId}`;

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.target.checked);
    };

    return (
        <CheckboxWrapper className={className} $disabled={disabled}>
            <CheckboxInput
                {...props}
                id={controlId}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
            />
            <CheckboxBox aria-hidden="true" />
            {label && <CheckboxLabel>{label}</CheckboxLabel>}
        </CheckboxWrapper>
    );
};
