import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Input, Button } from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { PrivateKeyDisplay } from "components/PrivateKeyDisplay";
import { createAccountWithPassword } from "store/authSlice";
import { syncAccounts } from "store/walletSlice";
import { SecureStorage } from "services/secureStorage";
import { RootState } from "store";

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

const FormContainer = styled.div`
    width: 100%;
`;

interface CreateAccountFormProps {
    onSuccess?: (accountName: string) => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
}

type Step = "form" | "password" | "privateKey";

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
}) => {
    const dispatch = useDispatch();

    const { selectedNetwork } = useSelector((state: RootState) => state.wallet);
    const { isAuthenticated, hasAccounts } = useSelector(
        (state: RootState) => state.auth,
    );

    const selectedNetworkId = selectedNetwork?.id;

    const [step, setStep] = useState<Step>("form");
    const [accountName, setAccountName] = useState(customAccountName ?? "");
    const [accountNameError, setAccountNameError] = useState("");
    const [pendingAccountName, setPendingAccountName] = useState("");
    const [pendingPrivateKey, setPendingPrivateKey] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!customAccountName) {
            return;
        }

        if (step !== "form") {
            return;
        }

        setStep("password");
    }, [customAccountName, step]);

    useEffect(() => {
        if (!customAccountName) {
            return;
        }

        setAccountName(customAccountName);
        setPendingAccountName(customAccountName);
    }, [customAccountName]);

    const handleFormSubmit = () => {
        const currentName: string = customAccountName ?? accountName;

        const trimmedName = currentName.trim();

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
        onSuccess?.(pendingAccountName);
    };

    const handleCancel = () => {
        setStep("form");
        setAccountName("");
        setAccountNameError("");
        setPendingAccountName("");
        setPendingPrivateKey("");
        onCancel?.();
    };

    const handleBackToPassword = () => {
        setStep("password");
        setPendingPrivateKey("");
    };

    // Step: Password Setup
    if (step === "password" || (!!customAccountName && step === "form")) {
        return (
            <PasswordSetup
                title="Set Password for New Account"
                onPasswordSet={handlePasswordSet}
                onCancel={handleCancel}
            />
        );
    }

    // Step: Private Key Display
    if (step === "privateKey") {
        return (
            <PrivateKeyDisplay
                privateKey={pendingPrivateKey}
                accountName={pendingAccountName}
                onContinue={handlePrivateKeyAcknowledged}
                onBack={handleBackToPassword}
                showBackButton={true}
            />
        );
    }

    // Step: Form
    return (
        <FormContainer>
            {hasAccounts && !isAuthenticated && (
                <WarningMessage>
                    <span className="icon">⚠️</span>
                    <span>
                        You have existing accounts. Creating a new account will
                        not automatically log you in. You'll need to unlock your
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
                    id="create-account-button"
                    onClick={handleFormSubmit}
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
                {!hideCancelButton && (
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth={false}
                    >
                        Cancel
                    </Button>
                )}
            </ActionButtons>
        </FormContainer>
    );
};
