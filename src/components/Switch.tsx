import React, { ReactNode, useId } from "react";
import styled from "styled-components";

export interface SwitchProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "checked" | "onChange" | "type"
    > {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
}

const SwitchContainer = styled.label<{ $disabled: boolean }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const SwitchInput = styled.input`
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

const SwitchSlider = styled.span`
    position: relative;
    display: block;
    width: ${({ theme }) => theme.sizes.switch.width};
    height: ${({ theme }) => theme.sizes.switch.height};
    flex-shrink: 0;
    border-radius: ${({ theme }) => theme.radii.round};
    background: ${({ theme }) => theme.control.toggleOff};
    transition:
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};

    &::before {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 3px;
        width: ${({ theme }) => theme.sizes.switch.thumb};
        height: ${({ theme }) => theme.sizes.switch.thumb};
        box-sizing: border-box;
        border: 2px solid ${({ theme }) => theme.control.neutralBorder};
        border-radius: 50%;
        background: ${({ theme }) => theme.control.toggleThumb};
        box-shadow: ${({ theme }) => theme.shadow};
        transition: transform ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    }

    ${SwitchInput}:checked + & {
        background: ${({ theme }) => theme.primary};
    }

    ${SwitchInput}:checked + &::before {
        border-color: ${({ theme }) => theme.primary};
        /* track 48 - thumb 18 - left inset 3 - right inset 3 = 24 */
        transform: translateX(24px);
    }

    ${SwitchInput}:focus-visible + & {
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }
`;

const SwitchLabel = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    id,
    label,
    className,
    ...props
}) => {
    const generatedId = useId();
    const controlId = id ?? `switch-${generatedId}`;

    return (
        <SwitchContainer className={className} $disabled={disabled}>
            <SwitchInput
                {...props}
                id={controlId}
                type="checkbox"
                role="switch"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <SwitchSlider aria-hidden="true" />
            {label && <SwitchLabel>{label}</SwitchLabel>}
        </SwitchContainer>
    );
};
