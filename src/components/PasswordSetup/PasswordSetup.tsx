import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { validatePassword, PasswordValidation } from "utils/encryption";
import { PasswordInput, Button } from "components";

const Container = styled.div`
    max-width: 400px;
    margin: 0 auto;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: 600;
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 24px;
`;

const Description = styled.p`
    font-size: 14px;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 24px;
`;

const ValidationList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 16px 0;
`;

const ValidationItem = styled.li<{ $valid: boolean }>`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: ${({ $valid, theme }) =>
        $valid ? theme.success : theme.text.secondary};
    font-size: 14px;

    &:before {
        content: ${({ $valid }) => ($valid ? '"✓"' : '"○"')};
        margin-right: 8px;
        font-weight: bold;
    }
`;

const ErrorMessage = styled.div`
    color: ${({ theme }) => theme.danger};
    font-size: 14px;
    margin-top: 8px;
`;

const ButtonContainer = styled.div`
    margin-top: 24px;
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

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validation, setValidation] = useState<PasswordValidation | null>(
        null,
    );
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (isUnlockMode || !password) {
            setValidation(null);
            return;
        }

        setValidation(validatePassword(password));
    }, [password, isUnlockMode]);

    const canSubmit = isUnlockMode
        ? password.length > 0
        : !!validation?.isValid && password === confirmPassword;

    const handleSubmit = () => {
        setLocalError("");

        if (isUnlockMode) {
            if (!password) {
                setLocalError("Password is required");
                return;
            }

            onPasswordSet(password);
            return;
        }

        if (!validation?.isValid) {
            setLocalError("Please meet all password requirements");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        onPasswordSet(password);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && canSubmit && !loading) {
            handleSubmit();
        }
    };

    return (
        <Container>
            <Title>{title}</Title>

            {description && <Description>{description}</Description>}

            <PasswordInput
                id="password-setup-password-input"
                data-testid="password-setup-password-input"
                data-cy="password-setup-password-input"
                label={isUnlockMode ? "Wallet Password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => {
                    const target = e.currentTarget;
                    if (target.value !== password) {
                        setPassword(target.value);
                    }
                }}
                placeholder="Enter password"
                onKeyPress={handleKeyPress}
                autoComplete={
                    isUnlockMode ? "current-password" : "new-password"
                }
                disabled={loading}
            />

            {validation && (
                <ValidationList>
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onInput={(e) => {
                        const target = e.currentTarget;
                        if (target.value !== confirmPassword) {
                            setConfirmPassword(target.value);
                        }
                    }}
                    placeholder="Confirm password"
                    onKeyPress={handleKeyPress}
                    autoComplete="new-password"
                />
            )}

            {(error || localError) && (
                <ErrorMessage>{error || localError}</ErrorMessage>
            )}

            <ButtonContainer>
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
                        style={{ marginTop: "8px" }}
                    >
                        Cancel
                    </Button>
                )}
            </ButtonContainer>
        </Container>
    );
};
