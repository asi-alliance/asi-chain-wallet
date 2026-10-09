import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { useValidAccountUpdating } from "hooks/";
import { importPrivateKeyWallet } from "store/Auth/thunks";
import { PasswordSetup } from "components/PasswordSetup";
import { Alert, Input, Button, FormActions } from "components";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";

const FormContainer = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

const FormGroup = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

interface PendingImport {
    name: string;
    privateKeyHex: string;
}

interface ImportPkWalletFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
    firstAccount?: boolean;
}

type Step = "form" | "password";

const clearSecretString = (value: string): string => " ".repeat(value.length);

export const ImportPkWalletForm: React.FC<ImportPkWalletFormProps> = ({
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
    const [importName, setImportName] = useState(customAccountName ?? "");
    const [privateKey, setPrivateKey] = useState("");
    const [importNameError, setImportNameError] = useState("");
    const [privateKeyError, setPrivateKeyError] = useState("");
    const [formError, setFormError] = useState("");
    const [pendingImport, setPendingImport] = useState<PendingImport | null>(
        null,
    );
    const [loading, setLoading] = useState(false);

    const updateImportName = (newName: string): void => {
        setImportName(newName);
        updateAccountField("name", newName);
    };

    useEffect(() => {
        if (!customAccountName) {
            return;
        }

        updateImportName(customAccountName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customAccountName]);

    const clearVisibleSecrets = (): void => {
        setPrivateKey((current) => clearSecretString(current));
        setPrivateKey("");
        setPendingImport(null);
    };

    const handleCancel = () => {
        setStep("form");
        updateImportName("");
        clearVisibleSecrets();
        setImportNameError("");
        setPrivateKeyError("");
        setFormError("");
        onCancel?.();
    };

    const handleImportAccount = () => {
        if (loading || submissionRef.current) {
            return;
        }

        const trimmedName = importName.trim();

        if (!trimmedName) {
            setImportNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setImportNameError("Account name must be 30 characters or less");
            return;
        }

        const trimmedPrivateKey = privateKey.trim();

        if (!trimmedPrivateKey) {
            setPrivateKeyError("Private key is required");
            return;
        }

        if (!SdkWalletService.isPrivateKeyHexValid(trimmedPrivateKey)) {
            setPrivateKeyError(
                "Invalid private key: expected 64 hexadecimal characters",
            );
            return;
        }

        setImportNameError("");
        setPrivateKeyError("");
        setFormError("");
        setPendingImport({
            name: trimmedName,
            privateKeyHex: trimmedPrivateKey,
        });
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport || loading || submissionRef.current) {
            return;
        }

        submissionRef.current = true;
        setLoading(true);
        setFormError("");

        try {
            await dispatch(
                importPrivateKeyWallet({
                    name: pendingImport.name,
                    privateKeyHex: pendingImport.privateKeyHex,
                    password,
                }),
            ).unwrap();

            onSuccess?.();
            handleCancel();
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Failed to import wallet"),
            );
            setStep("password");
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for Imported Wallet"
                loading={loading}
                error={formError}
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setFormError("");
                    setPendingImport(null);
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

            <FormGroup>
                <Input
                    id="import-pk-account-name-input"
                    label="Account Name"
                    value={importName}
                    onChange={(event) => {
                        updateImportName(event.target.value);
                        if (importNameError) {
                            setImportNameError("");
                        }
                    }}
                    placeholder="Enter account name (max 30 characters)"
                    error={importNameError || nameErrorMessage}
                    maxLength={30}
                    readOnly={!!customAccountName}
                    disabled={loading}
                    autoComplete="off"
                />
            </FormGroup>

            <FormGroup>
                <Input
                    id="import-pk-private-key-input"
                    label="Private Key"
                    value={privateKey}
                    onChange={(event) => {
                        setPrivateKey(event.target.value);
                        if (privateKeyError) {
                            setPrivateKeyError("");
                        }
                    }}
                    placeholder="Enter private key (64 hexadecimal characters)"
                    error={privateKeyError}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                />
            </FormGroup>

            <FormActions>
                <Button
                    id="import-pk-account-button"
                    variant="primary"
                    onClick={handleImportAccount}
                    disabled={
                        !importName.trim() ||
                        !privateKey.trim() ||
                        loading ||
                        !isNameUpdateValid
                    }
                    loading={loading}
                    fullWidth
                >
                    Import Private Key
                </Button>
                {!hideCancelButton && (
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth
                    >
                        Cancel
                    </Button>
                )}
            </FormActions>
        </FormContainer>
    );
};
