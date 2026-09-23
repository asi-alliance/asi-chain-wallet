import React from "react";
import styled, { css } from "styled-components";
import { ignorePropsForDOMElement } from "utils/styledComponentsUtils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "primary"
        | "secondary"
        | "danger"
        | "ghost"
        | "full-ghost"
        | "icon-button"
        | "icon-button-ghost"
        | "icon-button-secondary"
        | "icon-button-black";
    size?: "small" | "medium" | "large";
    fullWidth?: boolean;
    loading?: boolean;
    dangerHover?: boolean;
    secondaryHover?: boolean;
    withFadeHover?: boolean;
    withBorderColorHover?: boolean;
}

const isIconVariant = (variant?: ButtonProps["variant"]): boolean =>
    variant?.startsWith("icon-button") ?? false;

const ButtonBase = styled.button.withConfig(
    ignorePropsForDOMElement<ButtonProps>([
        "variant",
        "size",
        "fullWidth",
        "loading",
        "dangerHover",
        "secondaryHover",
        "withFadeHover",
        "withBorderColorHover",
    ]),
)<ButtonProps>`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    gap: ${({ theme }) => theme.spacing.md};
    min-width: 100px;
    margin: 0;
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.primary};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.text.inverse};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    letter-spacing: 0;
    text-transform: none;
    cursor: pointer;
    transition:
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        transform ${({ theme }) => theme.motion.fast}
            ${({ theme }) => theme.motion.easing};

    > h1,
    > h2,
    > h3,
    > h4,
    > h5 {
        margin: 0;
        color: inherit;
        font: inherit;
    }

    > svg {
        flex-shrink: 0;
    }

    ${({ size, variant, theme }) => {
        const iconButton = isIconVariant(variant);

        if (iconButton) {
            const dimension = theme.sizes.iconButton[size ?? "large"];
            return css`
                width: ${dimension};
                height: ${dimension};
                min-width: ${dimension};
                min-height: ${dimension};
                padding: 0;
                font-size: ${size === "small"
                    ? "14px"
                    : size === "medium"
                      ? "16px"
                      : "18px"};
                line-height: 1;
            `;
        }

        if (!size) {
            return css`
                height: 44px;
                min-height: 44px;
                padding: 10px 7px;
                font-size: 18px;
                line-height: 24px;
            `;
        }

        if (size === "small") {
            return css`
                height: ${theme.sizes.control.small};
                min-height: ${theme.sizes.control.small};
                padding: ${theme.control.buttonPadding.small};
                font-size: ${theme.typography.size.sm};
                line-height: ${theme.control.buttonLineHeight};
            `;
        }

        if (size === "medium") {
            return css`
                height: ${theme.sizes.control.medium};
                min-height: ${theme.sizes.control.medium};
                padding: ${theme.control.buttonPadding.medium};
                font-size: ${theme.typography.size.md};
                line-height: ${theme.control.buttonLineHeight};
            `;
        }

        return css`
            height: ${theme.sizes.control.large};
            min-height: ${theme.sizes.control.large};
            padding: ${theme.control.buttonPadding.large};
            font-size: ${theme.typography.size.lg};
            line-height: ${theme.control.buttonLineHeight};
        `;
    }}

    ${({ fullWidth }) =>
        fullWidth &&
        css`
            width: 100%;
        `}

    ${({ variant, theme }) => {
        switch (variant) {
            case "secondary":
                return css`
                    background: ${theme.surface};
                    color: ${theme.control.neutralText};
                    border-color: ${theme.control.neutralBorder};

                    &:hover:not(:disabled) {
                        color: ${theme.actionText};
                        border-color: ${theme.primary};
                    }
                `;
            case "danger":
                return css`
                    background: ${theme.surface};
                    color: ${theme.dangerText};
                    border-color: ${theme.danger};

                    &:hover:not(:disabled) {
                        background: ${theme.danger};
                        color: ${theme.text.inverse};
                    }
                `;
            case "ghost":
                return css`
                    min-width: auto;
                    background: transparent;
                    color: ${theme.actionText};
                    border-color: ${theme.border};

                    &:hover:not(:disabled) {
                        background: ${theme.hoverSurface};
                    }
                `;
            case "full-ghost":
                return css`
                    min-width: auto;
                    background: transparent;
                    color: ${theme.actionText};
                    border-color: transparent;

                    &:hover:not(:disabled) {
                        background: ${theme.primarySubtle};
                    }
                `;
            case "icon-button-black":
                return css`
                    background: transparent;
                    color: ${theme.text.primary};
                    border-color: ${theme.border};
                `;
            case "icon-button-secondary":
                return css`
                    background: transparent;
                    color: ${theme.text.primary};
                    border-color: ${theme.primary};
                `;
            case "icon-button-ghost":
                return css`
                    background: transparent;
                    color: ${theme.actionText};
                    border-color: transparent;
                `;
            case "icon-button":
                return css`
                    background: transparent;
                    color: ${theme.actionText};
                    border-color: ${theme.border};
                `;
            default:
                return css`
                    &:hover:not(:disabled) {
                        background: ${theme.primaryDark};
                        border-color: ${theme.primaryDark};
                    }
                `;
        }
    }}

    ${({ variant, dangerHover, theme }) =>
        isIconVariant(variant) &&
        !dangerHover &&
        css`
            &:hover:not(:disabled) {
                background: ${theme.primarySubtle};
            }
        `}

    ${({ withFadeHover }) =>
        withFadeHover &&
        css`
            &:hover:not(:disabled) {
                transform: translateY(-1px);
            }
        `}

    ${({
        withBorderColorHover,
        dangerHover,
        secondaryHover,
        theme,
    }) =>
        withBorderColorHover &&
        css`
            &:hover:not(:disabled) {
                ${dangerHover && `border-color: ${theme.danger};`}
                ${secondaryHover && `border-color: ${theme.primary};`}
            }
        `}

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 4px
            ${({ variant, dangerHover, theme }) =>
                variant === "danger" || dangerHover
                    ? theme.dangerFocusRing
                    : theme.focusRing};
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    @media (prefers-reduced-motion: reduce) {
        &:active:not(:disabled) {
            transform: none;
        }
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
        transform: none;
    }

    ${({ loading, variant, theme }) =>
        loading &&
        css`
            /* Keep loading visually distinct from disabled (docs: distinguishable states). */
            color: transparent;
            pointer-events: none;

            &:disabled {
                opacity: 1;
            }

            &::after {
                content: "";
                position: absolute;
                top: 50%;
                left: 50%;
                width: 18px;
                height: 18px;
                margin-top: -9px;
                margin-left: -9px;
                border: 2px solid transparent;
                border-top-color: ${variant === "primary"
                    ? theme.background
                    : variant === "danger"
                      ? theme.dangerText
                      : theme.text.primary};
                border-right-color: ${variant === "primary"
                    ? theme.background
                    : variant === "danger"
                      ? theme.dangerText
                      : theme.text.primary};
                border-radius: 50%;
                animation: button-spin 600ms linear infinite;
            }

            @keyframes button-spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `}
`;

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size,
    fullWidth = false,
    loading = false,
    disabled,
    withFadeHover = false,
    withBorderColorHover = true,
    ...props
}) => (
    <ButtonBase
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={loading}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        withFadeHover={withFadeHover}
        withBorderColorHover={withBorderColorHover}
        {...props}
    >
        {children}
    </ButtonBase>
);
