import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useScreen, useValidAccountUpdating } from "hooks/";
import { importPrivateKeyWallet } from "store/Auth/thunks";
import { PasswordSetup } from "components/PasswordSetup";
import { Input, Button } from "components";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

const ActionButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;

    @media (max-width: 768px) {
        display: block;
        padding: 0 2rem;
    }
`;

const AdaptiveButton = styled(Button)`
    min-width: 242px;

    @media (max-width: 768px) {
        min-width: auto;
    }
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

export const ImportPkWalletForm: React.FC<ImportPkWalletFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();
    const { isLaptop } = useScreen();

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating(undefined, { firstAccount });

    const [step, setStep] = useState<Step>("form");
    const [importName, setImportName] = useState(customAccountName ?? "");
    const [privateKey, setPrivateKey] = useState("");
    const [importNameError, setImportNameError] = useState("");
    const [privateKeyError, setPrivateKeyError] = useState("");
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
    }, [customAccountName]);

    const handleCancel = () => {
        setStep("form");
        updateImportName("");
        setPrivateKey("");
        setImportNameError("");
        setPrivateKeyError("");
        setPendingImport(null);
        onCancel?.();
    };

    const handleImportAccount = () => {
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

        setPendingImport({
            name: trimmedName,
            privateKeyHex: trimmedPrivateKey,
        });
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport) return;

        setLoading(true);

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
            setPrivateKeyError(
                (error as Error)?.message || "Failed to import wallet",
            );
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for Imported Wallet"
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setStep("form");
                    setPendingImport(null);
                }}
            />
        );
    }

    return (
        <>
            <FormGroup>
                <Input
                    id="import-pk-account-name-input"
                    label="Account Name"
                    value={importName}
                    onChange={(e) => {
                        updateImportName(e.target.value);
                        if (importNameError) {
                            setImportNameError("");
                        }
                    }}
                    placeholder="Enter account name (max 30 characters)"
                    error={importNameError || nameErrorMessage}
                    maxLength={30}
                    readOnly={!!customAccountName}
                    disabled={loading}
                />
            </FormGroup>

            <FormGroup>
                <Input
                    id="import-pk-private-key-input"
                    label="Private Key"
                    value={privateKey}
                    onChange={(e) => {
                        setPrivateKey(e.target.value);
                        if (privateKeyError) {
                            setPrivateKeyError("");
                        }
                    }}
                    placeholder="Enter private key (64 hexadecimal characters)"
                    error={privateKeyError}
                    disabled={loading}
                />
            </FormGroup>

            <ActionButtons>
                <AdaptiveButton
                    id="import-pk-account-button"
                    variant="primary"
                    onClick={handleImportAccount}
                    disabled={
                        !importName.trim() ||
                        !privateKey.trim() ||
                        loading ||
                        !isNameUpdateValid
                    }
                    fullWidth={isLaptop}
                    loading={loading}
                    style={{
                        flexWrap: "nowrap",
                        whiteSpace: "nowrap",
                        ...(isLaptop && {
                            marginBottom: "16px",
                        }),
                    }}
                >
                    <h3>Import Private Key</h3>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g clipPath="url(#clip0_3_1930)">
                            <path
                                d="M12 16L16 12H13V3H11V12H8L12 16ZM21 3H15V4.99H21V19.02H3V4.99H9V3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3Z"
                                fill="currentcolor"
                            />
                        </g>
                        <defs>
                            <clipPath id="clip0_3_1930">
                                <rect
                                    width="24"
                                    height="24"
                                    fill="currentcolor"
                                />
                            </clipPath>
                        </defs>
                    </svg>
                </AdaptiveButton>
                {!hideCancelButton && (
                    <AdaptiveButton
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth={isLaptop}
                        style={{
                            flexWrap: "nowrap",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Cancel
                    </AdaptiveButton>
                )}
            </ActionButtons>
        </>
    );
};