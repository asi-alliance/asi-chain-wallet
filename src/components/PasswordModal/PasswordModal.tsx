import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PasswordInput, Button } from "components";
import { ModalWindow } from "components/ModalWindow";

const Title = styled.h3`
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 16px;
`;

const Description = styled.p`
    font-size: 14px;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 24px;
`;

const Actions = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 24px;
`;

const FormError = styled.div`
    color: ${({ theme }) => theme.danger};
    font-size: 14px;
    margin-top: 8px;
`;

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    loading?: boolean;
    /** Field-linked credential error (marks the password input invalid). */
    error?: string;
    /** Operation error unrelated to the password value itself. */
    formError?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Enter Password",
    description = "Please enter your password to continue.",
    confirmLabel = "Confirm",
    loading = false,
    error,
    formError,
}) => {
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");
    // Sync guard for double-click before parent re-renders with loading=true.
    const submissionRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            return;
        }

        setPassword("");
        setLocalError("");
        submissionRef.current = false;
    }, [isOpen]);

    useEffect(() => {
        if (!loading) {
            submissionRef.current = false;
        }
    }, [loading]);

    const handleConfirm = () => {
        if (loading || submissionRef.current) {
            return;
        }

        if (!password.trim()) {
            setLocalError("Password is required");
            return;
        }

        setLocalError("");
        submissionRef.current = true;
        onConfirm(password);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (loading || submissionRef.current) {
            return;
        }

        if (e.key === "Enter" && password.trim()) {
            handleConfirm();
        }
    };

    const handleClose = () => {
        if (loading || submissionRef.current) {
            return;
        }

        onClose();
    };

    return (
        <ModalWindow
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="400px"
            dismissible={!loading}
            aria-label={title}
        >
            <Title>{title}</Title>
            <Description>{description}</Description>

            <PasswordInput
                id="password-modal-input"
                label="Wallet password"
                data-testid="password-modal-input"
                data-cy="password-modal-input"
                value={password}
                error={error || localError}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => {
                    const target = e.currentTarget;
                    if (target.value !== password) {
                        setPassword(target.value);
                    }
                }}
                onKeyDown={handleKeyPress}
                placeholder="Enter password"
                autoFocus
                autoComplete="current-password"
                disabled={loading}
            />

            {formError && (
                <FormError role="alert">{formError}</FormError>
            )}

            <Actions>
                <Button
                    variant="ghost"
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button onClick={handleConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </Actions>
        </ModalWindow>
    );
};
