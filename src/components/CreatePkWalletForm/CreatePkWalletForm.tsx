import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { Alert, Input } from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { PrivateKeyDisplay } from "components/PrivateKeyDisplay";
import { importPrivateKeyWallet } from "store/Auth/thunks";
import { useAppDispatch } from "store/hooks";
import { useValidAccountUpdating } from "hooks";
import { SdkWalletService } from "sdk";

const FormContainer = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

interface CreatePkWalletFormProps {
    onSuccess?: (accountName: string) => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
    firstAccount?: boolean;
}

type Step = "form" | "password";

const clearSecretString = (value: string): string => " ".repeat(value.length);

export const CreatePkWalletForm: React.FC<CreatePkWalletFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();
    const submissionRef = useRef(false);

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating(undefined, { firstAccount });

    const [step, setStep] = useState<Step>("form");
    const [accountName, setAccountName] = useState(customAccountName ?? "");
    const [accountNameError, setAccountNameError] = useState("");
    const [pendingAccountName, setPendingAccountName] = useState(
        customAccountName ?? "",
    );
    const [privateKeyHex, setPrivateKeyHex] = useState("");
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            setPrivateKeyHex(SdkWalletService.generatePrivateKeyHex());
            setFormError("");
        } catch {
            setPrivateKeyHex("");
            setFormError("Failed to generate private key");
        }
    }, []);

    const updateAccountName = (newName: string): void => {
        setAccountName(newName);
        updateAccountField("name", newName);
    };

    const clearVisibleSecrets = (): void => {
        setPrivateKeyHex((current) => clearSecretString(current));
        setPrivateKeyHex("");
        setPendingAccountName("");
    };

    const handleProceedFromDisplay = () => {
        const trimmedName = (customAccountName ?? accountName).trim();

        if (!trimmedName) {
            setAccountNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setAccountNameError("Account name must be 30 characters or less");
            return;
        }

        if (!privateKeyHex) {
            setFormError("Failed to generate private key");
            return;
        }

        if (!customAccountName && !isNameUpdateValid) {
            return;
        }

        setAccountNameError("");
        setFormError("");
        setPendingAccountName(trimmedName);
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (loading || submissionRef.current || !privateKeyHex) {
            return;
        }

        submissionRef.current = true;
        setLoading(true);
        setFormError("");

        try {
            await dispatch(
                importPrivateKeyWallet({
                    name: pendingAccountName,
                    privateKeyHex,
                    password,
                }),
            ).unwrap();

            clearVisibleSecrets();
            onSuccess?.(pendingAccountName);
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Failed to create wallet"),
            );
            // Keep the same key for retry — do not force regenerate.
            setStep("password");
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    const handleCancel = () => {
        clearVisibleSecrets();
        setStep("form");
        updateAccountName("");
        setAccountNameError("");
        setFormError("");
        onCancel?.();
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for New Wallet"
                loading={loading}
                error={formError}
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setFormError("");
                    setStep("form");
                }}
            />
        );
    }

    return (
        <FormContainer>
            {formError && (
                <Alert
                    tone="danger"
                    icon="⚠️"
                    style={{ marginBottom: "16px" }}
                >
                    {formError}
                </Alert>
            )}

            {!customAccountName && (
                <Input
                    id="create-pk-account-name-input"
                    label="Account Name"
                    value={accountName}
                    onChange={(event) => {
                        updateAccountName(event.target.value);
                        if (accountNameError) {
                            setAccountNameError("");
                        }
                    }}
                    placeholder="Enter account name (max 30 characters)"
                    error={accountNameError || nameErrorMessage}
                    maxLength={30}
                    disabled={loading}
                    autoComplete="off"
                    wrapperStyle={{ marginBottom: "24px" }}
                />
            )}

            <PrivateKeyDisplay
                privateKey={privateKeyHex}
                accountName={customAccountName ?? accountName}
                onContinue={handleProceedFromDisplay}
                onBack={handleCancel}
                showBackButton={!hideCancelButton}
            />
        </FormContainer>
    );
};
