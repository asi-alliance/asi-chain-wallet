import React, { useEffect, useState } from "react";
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

const ErrorMessage = styled.div`
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
    loading?: boolean;
    error?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Enter Password",
    description = "Please enter your password to continue.",
    loading = false,
    error,
}) => {
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (isOpen) {
            return;
        }

        setPassword("");
        setLocalError("");
    }, [isOpen]);

    const handleConfirm = () => {
        if (!password.trim()) {
            setLocalError("Password is required");
            return;
        }
        setLocalError("");
        onConfirm(password);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (loading) {
            return;
        }

        if (e.key === "Enter" && password.trim()) {
            handleConfirm();
        }
    };

    const handleClose = () => {
        if (loading) {
            return;
        }

        onClose();
    };

    return (
        <ModalWindow isOpen={isOpen} onClose={handleClose} maxWidth="400px">
            <Title>{title}</Title>
            <Description>{description}</Description>

            <PasswordInput
                id="password-modal-input"
                data-testid="password-modal-input"
                data-cy="password-modal-input"
                value={password}
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
            />

            {(error || localError) && (
                <ErrorMessage>{error || localError}</ErrorMessage>
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
                    Confirm
                </Button>
            </Actions>
        </ModalWindow>
    );
};
