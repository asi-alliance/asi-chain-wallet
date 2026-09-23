import CopyButton, { IIconProps } from "components/CopyButton";
import React, {
    CSSProperties,
    FC,
    RefObject,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import styled, { css } from "styled-components";
import { DefaultTheme } from "styled-components/dist/types";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: React.ReactNode;
    status?: "default" | "success";
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
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
}

export const InputWrapper = styled.div<{ $fullWidth?: boolean }>`
    display: ${({ $fullWidth }) => ($fullWidth ? "block" : "inline-block")};
    width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const Label = styled.label<{
    $themeColorSelector?: (theme: DefaultTheme) => string;
}>`
    display: block;
    margin-bottom: ${({ theme }) => theme.control.labelGap};
    color: ${({ theme, $themeColorSelector }) =>
        $themeColorSelector?.(theme) ?? theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    letter-spacing: 0;
    transition: color ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};

    ${InputWrapper}:focus-within & {
        color: ${({ theme }) => theme.text.primary};
    }
`;

export const RequiredMark = styled.span`
    color: ${({ theme }) => theme.dangerText};
`;

const fieldStateStyles = css<{
    $hasError?: boolean;
    $status?: "default" | "success";
    $withoutHoverUI?: boolean;
}>`
    ${({ $withoutHoverUI, $hasError, $status, theme }) => css`
        --control-field-hover-border: ${$hasError
            ? theme.danger
            : $status === "success"
              ? theme.success
              : $withoutHoverUI
                ? theme.control.fieldBorder
                : theme.control.fieldHoverBorder};

        &:hover:not(:disabled):not(:focus) {
            border-color: var(--control-field-hover-border);
        }

        /* Focus must stay on even when hover UI is disabled (e.g. EditableLabel). */
        &:focus {
            border-color: ${$hasError
                ? theme.danger
                : $status === "success"
                  ? theme.success
                  : theme.primary};
        }

        &:focus-visible {
            outline: none;
            box-shadow: 0 0 0 4px
                ${$hasError ? theme.dangerFocusRing : theme.focusRing};
        }
    `}
`;

export const StyledInput = styled.input<{
    $hasError?: boolean;
    $status?: "default" | "success";
    $copyable?: boolean;
    $hasStartAdornment?: boolean;
    $withoutHoverUI?: boolean;
}>`
    width: 100%;
    height: ${({ theme }) => theme.sizes.control.field};
    min-height: ${({ theme }) => theme.sizes.control.field};
    padding: ${({ $copyable, $hasStartAdornment, theme }) =>
        `${theme.control.fieldPadding} ${$copyable ? "var(--input-action-padding, 44px)" : theme.control.fieldPadding} ${theme.control.fieldPadding} ${$hasStartAdornment ? "44px" : theme.control.fieldPadding}`};
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme, $hasError, $status }) =>
            $hasError
                ? theme.danger
                : $status === "success"
                  ? theme.success
                  : theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    outline: none;
    transition:
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    color-scheme: ${({ theme }) => theme.mode};

    ${fieldStateStyles}

    &::placeholder {
        color: ${({ theme }) => theme.text.tertiary};
        opacity: 1;
    }

    &:disabled {
        cursor: not-allowed;
        border-color: ${({ theme }) => theme.control.disabledBorder};
        background: ${({ theme }) => theme.control.disabledBackground};
    }
`;

export const ErrorMessage = styled.span`
    display: block;
    margin-top: ${({ theme }) => theme.control.labelGap};
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

export const HelperMessage = styled.span`
    display: block;
    margin-top: ${({ theme }) => theme.control.labelGap};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

export const InputContainer = styled.div`
    position: relative;
    width: 100%;
`;

export const ActionButtonWrapper = styled.div<{ $disabled?: boolean }>`
    position: absolute;
    top: 50%;
    right: ${({ theme }) => theme.spacing.lg};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.md};
    transform: translateY(-50%);
    opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

    ${({ $disabled }) =>
        $disabled &&
        css`
            button:disabled {
                opacity: 1;
            }
        `}
`;

export const StartAdornmentWrapper = styled.div<{ $disabled?: boolean }>`
    position: absolute;
    top: 50%;
    left: ${({ theme }) => theme.spacing.lg};
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(-50%);
    opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
`;

const StyledTextArea = styled.textarea<{
    $hasError?: boolean;
    $status?: "default" | "success";
    $withoutHoverUI?: boolean;
}>`
    width: 100%;
    min-height: 120px;
    padding: ${({ theme }) => theme.spacing.lg};
    resize: vertical;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme, $hasError, $status }) =>
            $hasError
                ? theme.danger
                : $status === "success"
                  ? theme.success
                  : theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    outline: none;
    transition:
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};

    ${fieldStateStyles}

    &::placeholder {
        color: ${({ theme }) => theme.text.tertiary};
        opacity: 1;
    }

    &:disabled {
        cursor: not-allowed;
        border-color: ${({ theme }) => theme.control.disabledBorder};
        background: ${({ theme }) => theme.control.disabledBackground};
    }
`;

const useAutofocus = <T extends HTMLElement>(
    autoFocus: boolean | undefined,
    reference: RefObject<T>,
): void => {
    useEffect(() => {
        if (!autoFocus) return;

        const timer = window.setTimeout(() => reference.current?.focus(), 100);
        return () => window.clearTimeout(timer);
    }, [autoFocus, reference]);
};

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    status = "default",
    fullWidth = true,
    "data-testid": dataTestId,
    "data-cy": dataCy,
    autoFocus,
    wrapperStyle,
    labelStyle,
    labelColorSelector,
    inputRef,
    copyable = false,
    value,
    CustomCopyIcon,
    withoutHoverUI = false,
    startAdornment,
    endAdornment,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
}) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const currentRef = inputRef || defaultRef;
    const actionRef = useRef<HTMLDivElement>(null);
    const [actionPadding, setActionPadding] = useState(44);

    useLayoutEffect(() => {
        const action = actionRef.current;
        if (!action) return;
        action.inert = Boolean(props.disabled);
        const updatePadding = () =>
            setActionPadding(Math.max(44, Math.ceil(action.getBoundingClientRect().width) + 24));
        updatePadding();
        const observer = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updatePadding)
            : undefined;
        observer?.observe(action);
        window.addEventListener("resize", updatePadding);
        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", updatePadding);
        };
    }, [copyable, endAdornment, props.disabled]);
    const generatedId = useId();
    const controlId = id ?? `input-${generatedId}`;
    const errorId = `${controlId}-error`;
    const helperId = `${controlId}-helper`;
    const describedBy = [
        ariaDescribedBy,
        error ? errorId : undefined,
        !error && helperText ? helperId : undefined,
    ]
        .filter(Boolean)
        .join(" ");

    useAutofocus(autoFocus, currentRef);

    const getValueToCopy = (): string => {
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
        return currentRef.current?.value ?? "";
    };

    return (
        <InputWrapper $fullWidth={fullWidth} style={wrapperStyle}>
            {label && (
                <Label
                    htmlFor={controlId}
                    $themeColorSelector={labelColorSelector}
                    style={labelStyle}
                >
                    {label}
                    {props.required && (
                        <RequiredMark aria-hidden="true"> *</RequiredMark>
                    )}
                </Label>
            )}
            <InputContainer style={{ "--input-action-padding": `${actionPadding}px` } as CSSProperties}>
                {startAdornment && (
                    <StartAdornmentWrapper $disabled={props.disabled}>
                        {startAdornment}
                    </StartAdornmentWrapper>
                )}
                <StyledInput
                    {...props}
                    id={controlId}
                    ref={currentRef}
                    value={value}
                    data-testid={dataTestId}
                    data-cy={dataCy}
                    aria-invalid={error ? true : props["aria-invalid"]}
                    aria-describedby={describedBy || undefined}
                    $hasError={!!error}
                    $status={status}
                    $copyable={copyable || !!endAdornment}
                    $hasStartAdornment={!!startAdornment}
                    $withoutHoverUI={withoutHoverUI}
                />
                {(copyable || endAdornment) && (
                    <ActionButtonWrapper
                        ref={actionRef}
                        $disabled={props.disabled}
                    >
                        {endAdornment}
                        {copyable && (
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
                                disabled={props.disabled || !value}
                            />
                        )}
                    </ActionButtonWrapper>
                )}
            </InputContainer>
            {error && (
                <ErrorMessage id={errorId} role="alert">
                    {error}
                </ErrorMessage>
            )}
            {!error && helperText && (
                <HelperMessage id={helperId}>{helperText}</HelperMessage>
            )}
        </InputWrapper>
    );
};

export interface TextAreaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: React.ReactNode;
    status?: "default" | "success";
    fullWidth?: boolean;
    wrapperStyle?: CSSProperties;
    labelStyle?: CSSProperties;
    labelColorSelector?: (theme: DefaultTheme) => string;
    "data-testid"?: string;
    "data-cy"?: string;
    textareaRef?: RefObject<HTMLTextAreaElement>;
    withoutHoverUI?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    helperText,
    status = "default",
    fullWidth = true,
    wrapperStyle,
    labelStyle,
    labelColorSelector,
    "data-testid": dataTestId,
    "data-cy": dataCy,
    textareaRef,
    autoFocus,
    withoutHoverUI = false,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
}) => {
    const defaultRef = useRef<HTMLTextAreaElement>(null);
    const currentRef = textareaRef || defaultRef;
    const generatedId = useId();
    const controlId = id ?? `textarea-${generatedId}`;
    const errorId = `${controlId}-error`;
    const helperId = `${controlId}-helper`;
    const describedBy = [
        ariaDescribedBy,
        error ? errorId : undefined,
        !error && helperText ? helperId : undefined,
    ]
        .filter(Boolean)
        .join(" ");

    useAutofocus(autoFocus, currentRef);

    return (
        <InputWrapper $fullWidth={fullWidth} style={wrapperStyle}>
            {label && (
                <Label
                    htmlFor={controlId}
                    $themeColorSelector={labelColorSelector}
                    style={labelStyle}
                >
                    {label}
                    {props.required && (
                        <RequiredMark aria-hidden="true"> *</RequiredMark>
                    )}
                </Label>
            )}
            <StyledTextArea
                {...props}
                id={controlId}
                ref={currentRef}
                data-testid={dataTestId}
                data-cy={dataCy}
                aria-invalid={error ? true : props["aria-invalid"]}
                aria-describedby={describedBy || undefined}
                $hasError={!!error}
                $status={status}
                $withoutHoverUI={withoutHoverUI}
            />
            {error && (
                <ErrorMessage id={errorId} role="alert">
                    {error}
                </ErrorMessage>
            )}
            {!error && helperText && (
                <HelperMessage id={helperId}>{helperText}</HelperMessage>
            )}
        </InputWrapper>
    );
};
