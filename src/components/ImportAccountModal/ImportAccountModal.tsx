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
import { importAccountWithPassword } from "store/authSlice";
import { syncAccounts } from "store/walletSlice";
import { SecureStorage } from "services/secureStorage";
import { getAddressLabel } from "../../constants/token";
import {
    importPrivateKey,
    importEthAddress,
    importRevAddress,
} from "utils/crypto";

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

const ImportTypeSelector = styled.select`
    padding: 12px 16px;
    border: 2px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 16px;
    margin-bottom: 16px;
    width: 100%;
`;

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

interface ImportAccountModalProps {
    isOpen: boolean;
    selectedNetworkId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalStep = "form" | "password";

interface PendingImport {
    name: string;
    value: string;
    type: "private" | "public" | "eth" | "rev";
}

export const ImportAccountModal: React.FC<ImportAccountModalProps> = ({
    isOpen,
    selectedNetworkId,
    onClose,
    onSuccess,
}) => {
    const dispatch = useDispatch();

    const [step, setStep] = useState<ModalStep>("form");
    const [importName, setImportName] = useState("");
    const [importValue, setImportValue] = useState("");
    const [importType, setImportType] = useState<
        "private" | "public" | "eth" | "rev"
    >("private");
    const [importNameError, setImportNameError] = useState("");
    const [importValueError, setImportValueError] = useState("");
    const [pendingImport, setPendingImport] = useState<PendingImport | null>(
        null,
    );
    const [loading, setLoading] = useState(false);

    const checkAccountExistsByValue = (
        value: string,
        type: string | "private" | "public" | "eth" | "rev",
    ): boolean => {
        try {
            let accountData: { revAddress?: string; ethAddress?: string };
            const normalizedType =
                type === getAddressLabel() || type === "rev"
                    ? "rev"
                    : (type as "private" | "eth" | "rev");

            switch (normalizedType) {
                case "private":
                    accountData = importPrivateKey(value);
                    break;
                case "eth":
                    accountData = importEthAddress(value);
                    break;
                case "rev":
                    accountData = importRevAddress(value);
                    break;
                default:
                    return false;
            }

            const userId = SecureStorage.getCurrentUserId();
            return SecureStorage.accountExists(
                accountData.revAddress,
                accountData.ethAddress,
                userId || undefined,
            );
        } catch (error) {
            return false;
        }
    };

    const handleClose = () => {
        setStep("form");
        setImportName("");
        setImportValue("");
        setImportNameError("");
        setImportValueError("");
        setPendingImport(null);
        onClose();
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

        const normalizedType =
            importType === getAddressLabel() || importType === "rev"
                ? "rev"
                : (importType as "private" | "eth" | "rev");

        if (checkAccountExistsByValue(trimmedValue, normalizedType)) {
            setImportValueError("Account with this address already exists");
            return;
        }

        setImportNameError("");
        setImportValueError("");

        if (normalizedType === "private") {
            setPendingImport({
                name: trimmedName,
                value: trimmedValue,
                type: normalizedType,
            });
            setStep("password");
        } else {
            setLoading(true);
            dispatch(
                importAccountWithPassword({
                    name: trimmedName,
                    value: trimmedValue,
                    type: normalizedType,
                    password: "",
                    networkId: selectedNetworkId,
                }) as any,
            ).then((resultAction: any) => {
                setLoading(false);
                if (importAccountWithPassword.fulfilled.match(resultAction)) {
                    dispatch(syncAccounts([resultAction.payload.account]));
                    onSuccess?.();
                    handleClose();
                } else if (
                    importAccountWithPassword.rejected.match(resultAction)
                ) {
                    const errorMessage =
                        resultAction.error?.message ||
                        "Failed to import account";
                    setImportValueError(errorMessage);
                }
            });
        }
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport) return;

        setLoading(true);

        const resultAction = await dispatch(
            importAccountWithPassword({
                ...pendingImport,
                password,
                networkId: selectedNetworkId,
            }) as any,
        );

        setLoading(false);

        if (importAccountWithPassword.fulfilled.match(resultAction)) {
            dispatch(syncAccounts([resultAction.payload.account]));
            onSuccess?.();
            handleClose();
        } else if (importAccountWithPassword.rejected.match(resultAction)) {
            const errorMessage =
                resultAction.error?.message || "Failed to import account";
            setImportValueError(errorMessage);
            setStep("form");
        }
    };

    const getImportPlaceholder = () => {
        switch (importType) {
            case "private":
                return "Enter private key (64 hex characters)";
            case "eth":
                return "Enter Ethereum address (0x...)";
            case "rev":
                return `Enter ${getAddressLabel()}`;
            default:
                return "Enter value";
        }
    };

    if (!isOpen) return null;

    // Password setup step
    if (step === "password") {
        return (
            <Overlay onClick={handleClose}>
                <ModalContainer onClick={(e) => e.stopPropagation()}>
                    <ModalContent>
                        <PasswordSetup
                            title="Set Password for Imported Account"
                            onPasswordSet={handlePasswordSet}
                            onCancel={() => {
                                setStep("form");
                                setPendingImport(null);
                            }}
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
                                <h1>Import Account</h1>
                            </CardTitle>
                        </StyledCardHeader>
                        <StyledCardContent>
                            <FormGroup>
                                <ImportTypeSelector
                                    value={importType}
                                    onChange={(e) =>
                                        setImportType(e.target.value as any)
                                    }
                                >
                                    <option value="private">Private Key</option>
                                    <option value="eth">
                                        Ethereum Address
                                    </option>
                                    <option value="rev">
                                        {getAddressLabel()}
                                    </option>
                                </ImportTypeSelector>
                            </FormGroup>

                            <FormGroup>
                                <Input
                                    id="import-account-name-input"
                                    label="Account Name"
                                    value={importName}
                                    onChange={(e) => {
                                        setImportName(e.target.value);
                                        if (importNameError) {
                                            setImportNameError("");
                                        }
                                    }}
                                    placeholder="Enter account name (max 30 characters)"
                                    error={importNameError}
                                    maxLength={30}
                                    disabled={loading}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Input
                                    id="import-account-value-input"
                                    label="Value"
                                    value={importValue}
                                    onChange={(e) => {
                                        setImportValue(e.target.value);
                                        if (importValueError) {
                                            setImportValueError("");
                                        }
                                    }}
                                    placeholder={getImportPlaceholder()}
                                    error={importValueError}
                                    disabled={loading}
                                />
                            </FormGroup>

                            <ActionButtons>
                                <Button
                                    id="import-account-modal-button"
                                    variant="primary"
                                    onClick={handleImportAccount}
                                    disabled={
                                        !importName.trim() ||
                                        !importValue.trim() ||
                                        loading
                                    }
                                    fullWidth={false}
                                    loading={loading}
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
