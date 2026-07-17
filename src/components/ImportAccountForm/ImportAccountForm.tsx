import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useScreen, useValidAccountUpdating } from "hooks/";
import { importAccountWithPassword } from "store/authSlice";
import { PasswordSetup } from "components/PasswordSetup";
import { useSelector } from "react-redux";
import { selectAccounts } from "store/WalletsStore/walletsStoreSlice";
import { Input, Button } from "components";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import { importPrivateKey } from "utils/crypto";

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
    value: string;
}

interface ImportAccountFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
    firstAccount?: boolean;
}

type Step = "form" | "password";

export const ImportAccountForm: React.FC<ImportAccountFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();

    const selectedNetwork = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork,
    );
    const accounts = useSelector(selectAccounts);
    const { isLaptop } = useScreen();

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating(undefined, { firstAccount });

    const selectedNetworkId = selectedNetwork?.id;

    const [step, setStep] = useState<Step>("form");
    const [importName, setImportName] = useState("");
    const [importValue, setImportValue] = useState("");
    const [importNameError, setImportNameError] = useState("");
    const [importValueError, setImportValueError] = useState("");
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

    const checkAccountExistsByValue = (value: string): boolean => {
        try {
            const { revAddress } = importPrivateKey(value);

            return accounts.some((account) => account.address === revAddress);
        } catch (error) {
            return false;
        }
    };

    const handleCancel = () => {
        setStep("form");
        updateImportName("");
        setImportValue("");
        setImportNameError("");
        setImportValueError("");
        setPendingImport(null);
        onCancel?.();
    };

    const handleImportAccount = () => {
        const trimmedName = importName.trim();
        const trimmedValue = importValue.trim();

        if (!trimmedName) {
            setImportNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setImportNameError("Account name must be 30 characters or less");
            return;
        }

        if (!trimmedValue) {
            setImportValueError("Import value is required");
            return;
        }

        if (checkAccountExistsByValue(trimmedValue)) {
            setImportValueError("Account with this address already exists");
            return;
        }

        setImportNameError("");
        setImportValueError("");

        setPendingImport({
            name: trimmedName,
            value: trimmedValue,
        });
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport) return;

        setLoading(true);

        const resultAction = await dispatch(
            importAccountWithPassword({
                ...pendingImport,
                type: "private",
                password,
                networkId: selectedNetworkId,
            }),
        );

        setLoading(false);

        if (importAccountWithPassword.fulfilled.match(resultAction)) {
            onSuccess?.();
            handleCancel();
        } else if (importAccountWithPassword.rejected.match(resultAction)) {
            const errorMessage =
                resultAction.error?.message || "Failed to import account";
            setImportValueError(errorMessage);
            setStep("form");
        }
    };

    // Step: Password Setup
    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for Imported Account"
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setStep("form");
                    setPendingImport(null);
                }}
            />
        );
    }

    // Step: Form
    return (
        <>
            <FormGroup>
                <Input
                    id="import-account-name-input"
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
                    id="import-account-value-input"
                    label="Private Key"
                    value={importValue}
                    onChange={(e) => {
                        setImportValue(e.target.value);
                        if (importValueError) {
                            setImportValueError("");
                        }
                    }}
                    placeholder="Enter private key (64 hex characters)"
                    error={importValueError}
                    disabled={loading}
                />
            </FormGroup>

            <ActionButtons>
                <AdaptiveButton
                    id="import-account-button"
                    variant="primary"
                    onClick={handleImportAccount}
                    disabled={
                        !importName.trim() ||
                        !importValue.trim() ||
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
                    <h3>Import Account</h3>
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
