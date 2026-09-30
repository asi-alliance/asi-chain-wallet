import { VisibilityIcon, VisibilityOffIcon } from "components/Icons";
import {
    ActionButtonWrapper,
    ErrorMessage,
    HelperMessage,
    InputContainer,
    InputWrapper,
    Label,
    RequiredMark,
    StyledInput,
} from "components/Input/Input";
import React, {
    CSSProperties,
    RefObject,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import styled from "styled-components";
import { DefaultTheme } from "styled-components/dist/types";

export interface PasswordInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
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
    withoutHoverUI?: boolean;
}

const ToggleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radii.xs};
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.hoverSurface};
    }

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }
`;

export const PasswordInput: React.FC<PasswordInputProps> = ({
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
    withoutHoverUI = false,
    value,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
}) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const currentRef = inputRef || defaultRef;
    const [isVisible, setIsVisible] = useState(false);
    const generatedId = useId();
    const controlId = id ?? `password-${generatedId}`;
    const errorId = `${controlId}-error`;
    const helperId = `${controlId}-helper`;
    const describedBy = [
        ariaDescribedBy,
        error ? errorId : undefined,
        !error && helperText ? helperId : undefined,
    ]
        .filter(Boolean)
        .join(" ");

    useEffect(() => {
        if (!autoFocus) return;

        const timer = window.setTimeout(() => currentRef.current?.focus(), 100);
        return () => window.clearTimeout(timer);
    }, [autoFocus, currentRef]);

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
            <InputContainer>
                <StyledInput
                    {...props}
                    id={controlId}
                    ref={currentRef}
                    type={isVisible ? "text" : "password"}
                    value={value}
                    data-testid={dataTestId}
                    data-cy={dataCy}
                    aria-invalid={error ? true : props["aria-invalid"]}
                    aria-describedby={describedBy || undefined}
                    $hasError={!!error}
                    $status={status}
                    $copyable
                    $withoutHoverUI={withoutHoverUI}
                />
                <ActionButtonWrapper $disabled={props.disabled}>
                    <ToggleButton
                        type="button"
                        disabled={props.disabled}
                        onClick={() => setIsVisible((visible) => !visible)}
                        title={isVisible ? "Hide password" : "Show password"}
                        aria-label={
                            isVisible ? "Hide password" : "Show password"
                        }
                    >
                        {isVisible ? (
                            <VisibilityOffIcon size={16} />
                        ) : (
                            <VisibilityIcon size={16} />
                        )}
                    </ToggleButton>
                </ActionButtonWrapper>
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

export default PasswordInput;
