import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { validatePassword, PasswordValidation } from "utils/encryption";
import { Alert, PasswordInput, Button, FormActions } from "components";

const Container = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

const Title = styled.h2`
    margin: 0 0 ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.xl};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.xl};
`;

const Description = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const ValidationList = styled.ul`
    list-style: none;
    padding: 0;
    margin: ${({ theme }) => theme.spacing.lg} 0
        ${({ theme }) => theme.spacing.xl};
`;

const ValidationItem = styled.li<{ $valid: boolean }>`
    display: flex;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ $valid, theme }) =>
        $valid ? theme.success : theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};

    &:before {
        content: ${({ $valid }) => ($valid ? '"✓"' : '"○"')};
        margin-right: ${({ theme }) => theme.spacing.md};
        font-weight: ${({ theme }) => theme.typography.weight.bold};
    }
`;

type PasswordSetupMode = "create" | "unlock";

interface PasswordSetupProps {
    onPasswordSet: (password: string) => void;
    onCancel?: () => void;
    title?: string;
    description?: string;
    submitLabel?: string;
    mode?: PasswordSetupMode;
    error?: string;
    loading?: boolean;
}

export const PasswordSetup: React.FC<PasswordSetupProps> = ({
    onPasswordSet,
    onCancel,
    title = "Set Password",
    description,
    submitLabel = "Continue",
    mode = "create",
    error,
    loading = false,
}) => {
    const isUnlockMode = mode === "unlock";
    const submissionRef = useRef(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validation, setValidation] = useState<PasswordValidation | null>(
        null,
    );
    const [passwordFieldError, setPasswordFieldError] = useState("");
    const [confirmFieldError, setConfirmFieldError] = useState("");

    useEffect(() => {
        if (isUnlockMode || !password) {
            setValidation(null);
            return;
        }

        setValidation(validatePassword(password));
    }, [password, isUnlockMode]);

    useEffect(() => {
        return () => {
            setPassword("");
            setConfirmPassword("");
        };
    }, []);

    const canSubmit = isUnlockMode
        ? password.length > 0
        : !!validation?.isValid && confirmPassword.length > 0;

    const clearFieldErrors = (): void => {
        setPasswordFieldError("");
        setConfirmFieldError("");
    };

    const handleSubmit = () => {
        if (loading || submissionRef.current) {
            return;
        }

        clearFieldErrors();

        if (isUnlockMode) {
            if (!password) {
                setPasswordFieldError("Password is required");
                return;
            }

            submissionRef.current = true;
            onPasswordSet(password);
            return;
        }

        if (!validation?.isValid) {
            setPasswordFieldError("Please meet all password requirements");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmFieldError("Passwords do not match");
            return;
        }

        submissionRef.current = true;
        onPasswordSet(password);
    };

    useEffect(() => {
        if (!loading) {
            submissionRef.current = false;
        }
    }, [loading]);

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && canSubmit && !loading) {
            handleSubmit();
        }
    };

    return (
        <Container>
            <Title>{title}</Title>

            {description && <Description>{description}</Description>}

            {error && (
                <Alert
                    tone="danger"
                    icon="⚠️"
                    style={{ marginBottom: "16px" }}
                >
                    {error}
                </Alert>
            )}

            <PasswordInput
                id="password-setup-password-input"
                data-testid="password-setup-password-input"
                data-cy="password-setup-password-input"
                label={isUnlockMode ? "Wallet Password" : "Password"}
                value={password}
                onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldErrors();
                }}
                placeholder="Enter password"
                onKeyPress={handleKeyPress}
                autoComplete={
                    isUnlockMode ? "current-password" : "new-password"
                }
                disabled={loading}
                error={passwordFieldError || undefined}
            />

            {validation && (
                <ValidationList aria-live="polite">
                    <ValidationItem $valid={validation.minLength}>
                        At least 8 characters
                    </ValidationItem>
                    <ValidationItem $valid={validation.hasUpperCase}>
                        One uppercase letter
                    </ValidationItem>
                    <ValidationItem $valid={validation.hasLowerCase}>
                        One lowercase letter
                    </ValidationItem>
                    <ValidationItem $valid={validation.hasDigit}>
                        One number
                    </ValidationItem>
                    <ValidationItem $valid={validation.hasSpecialChar}>
                        One special character
                    </ValidationItem>
                </ValidationList>
            )}

            {!isUnlockMode && (
                <PasswordInput
                    id="password-setup-confirm-input"
                    data-testid="password-setup-confirm-input"
                    data-cy="password-setup-confirm-input"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        clearFieldErrors();
                    }}
                    placeholder="Confirm password"
                    onKeyPress={handleKeyPress}
                    autoComplete="new-password"
                    disabled={loading}
                    error={confirmFieldError || undefined}
                />
            )}

            <FormActions>
                <Button
                    id="password-setup-submit-button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    loading={loading}
                    fullWidth
                >
                    {submitLabel}
                </Button>
                {onCancel && (
                    <Button
                        id="password-setup-cancel-button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                        fullWidth
                    >
                        Cancel
                    </Button>
                )}
            </FormActions>
        </Container>
    );
};
