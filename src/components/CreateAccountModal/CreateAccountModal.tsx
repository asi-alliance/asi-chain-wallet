import React, { useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import {
    Input,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { PrivateKeyDisplay } from "components/PrivateKeyDisplay";
import { createAccountWithPassword } from "store/authSlice";
import { syncAccounts } from "store/walletSlice";
import { SecureStorage } from "services/secureStorage";
import { validateAccountName } from "utils/textUtils";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background: ${({ theme }) => theme.card};
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: 4px;
    }
`;

const ModalContent = styled.div`
    padding: 24px;
`;

const WarningMessage = styled.div`
    background: ${({ theme }) => `${theme.warning}20`};
    border: 1px solid ${({ theme }) => `${theme.warning}40`};
    color: ${({ theme }) => theme.warning};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    .icon {
        font-size: 16px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
`;

const StyledCard = styled(Card)`
    box-shadow: none;
    padding: 0;
    border: none;
`;

const StyledCardHeader = styled(CardHeader)`
    padding: 0 0 16px 0;
    border: none;
`;

const StyledCardContent = styled(CardContent)`
    padding: 0;
    border: none;
`;

interface CreateAccountModalProps {
    isOpen: boolean;
    hasExistingAccounts: boolean;
    isAuthenticated: boolean;
    selectedNetworkId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalStep = "form" | "password" | "privateKey";

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
    isOpen,
    hasExistingAccounts,
    isAuthenticated,
    selectedNetworkId,
    onClose,
    onSuccess,
}) => {
    const dispatch = useDispatch();

    const [step, setStep] = useState<ModalStep>("form");
    const [accountName, setAccountName] = useState("");
    const [accountNameError, setAccountNameError] = useState("");
    const [pendingAccountName, setPendingAccountName] = useState("");
    const [pendingPrivateKey, setPendingPrivateKey] = useState("");
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setStep("form");
        setAccountName("");
        setAccountNameError("");
        setPendingAccountName("");
        setPendingPrivateKey("");
        onClose();
    };

    const handleCreateAccount = () => {
        const trimmedName = accountName.trim();

        if (!trimmedName) {
            setAccountNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setAccountNameError("Account name must be 30 characters or less");
            return;
        }

        setAccountNameError("");
        setPendingAccountName(trimmedName);
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        setLoading(true);

        const resultAction = await dispatch(
            createAccountWithPassword({
                name: pendingAccountName,
                password,
                networkId: selectedNetworkId,
            }) as any,
        );

        setLoading(false);

        if (createAccountWithPassword.fulfilled.match(resultAction)) {
            setPendingPrivateKey(resultAction.payload.account.privateKey || "");
            setStep("privateKey");
        }
    };

    const handlePrivateKeyAcknowledged = () => {
        const userId = SecureStorage.getCurrentUserId();
        dispatch(
            syncAccounts(
                SecureStorage.getEncryptedAccounts(userId || undefined).map(
                    (acc) => ({
                        ...acc,
                        privateKey: undefined,
                    }),
                ),
            ),
        );
        onSuccess?.();
        handleClose();
    };

    if (!isOpen) return null;

    // Password setup step
    if (step === "password") {
        return (
            <Overlay onClick={handleClose}>
                <ModalContainer onClick={(e) => e.stopPropagation()}>
                    <ModalContent>
                        <PasswordSetup
                            title="Set Password for New Account"
                            onPasswordSet={handlePasswordSet}
                            onCancel={() => {
                                setStep("form");
                                setPendingAccountName("");
                            }}
                        />
                    </ModalContent>
                </ModalContainer>
            </Overlay>
        );
    }

    // Private key display step
    if (step === "privateKey") {
        return (
            <Overlay onClick={handleClose}>
                <ModalContainer onClick={(e) => e.stopPropagation()}>
                    <ModalContent>
                        <PrivateKeyDisplay
                            privateKey={pendingPrivateKey}
                            accountName={pendingAccountName}
                            onContinue={handlePrivateKeyAcknowledged}
                            onBack={() => {
                                setStep("password");
                                setPendingPrivateKey("");
                            }}
                            showBackButton={true}
                        />
                    </ModalContent>
                </ModalContainer>
            </Overlay>
        );
    }

    // Main form step
    return (
        <Overlay onClick={handleClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalContent>
                    <StyledCard>
                        <StyledCardHeader>
                            <CardTitle>
                                <h1>Create Account</h1>
                            </CardTitle>
                        </StyledCardHeader>
                        <StyledCardContent>
                            {hasExistingAccounts && !isAuthenticated && (
                                <WarningMessage>
                                    <span className="icon">⚠️</span>
                                    <span>
                                        You have existing accounts. Creating a
                                        new account will not automatically log
                                        you in. You'll need to unlock your
                                        existing accounts with your password.
                                    </span>
                                </WarningMessage>
                            )}

                            <Input
                                id="create-account-name-input"
                                label="Account Name"
                                value={accountName}
                                onChange={(e) => {
                                    setAccountName(e.target.value);
                                    if (accountNameError) {
                                        setAccountNameError("");
                                    }
                                }}
                                placeholder="Enter account name (max 30 characters)"
                                error={accountNameError}
                                maxLength={30}
                                disabled={loading}
                            />

                            <ActionButtons>
                                <Button
                                    id="create-account-modal-button"
                                    onClick={handleCreateAccount}
                                    disabled={!accountName.trim() || loading}
                                    fullWidth={false}
                                    loading={loading}
                                >
                                    <h3>Create Account</h3>
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M14 8H8V14H6V8H0L0 6H6V0L8 0V6H14V8Z"
                                            fill="currentcolor"
                                        />
                                    </svg>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    disabled={loading}
                                    fullWidth={false}
                                >
                                    Cancel
                                </Button>
                            </ActionButtons>
                        </StyledCardContent>
                    </StyledCard>
                </ModalContent>
            </ModalContainer>
        </Overlay>
    );
};
