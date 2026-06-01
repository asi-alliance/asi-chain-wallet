import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import {
    selectAccount,
    removeAccount,
    syncAccounts,
    fetchBalance,
} from "store/walletSlice";
import {
    createAccountWithPassword,
    importAccountWithPassword,
    exportAccountKeyfile,
} from "store/authSlice";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    PrivateKeyDisplay,
} from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { SecureStorage } from "services/secureStorage";
import { validateAccountName } from "utils/textUtils";
import { getAddressLabel } from "../../constants/token";
import {
    importPrivateKey,
    importEthAddress,
    importRevAddress,
} from "utils/crypto";
import { ReloadIcon } from "components/Icons";
import { AccountCard } from "components/AccountCard";
import { Account } from "types/wallet";

const AccountsContainer = styled.div``;

const AccountsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(462px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
`;

const CreateAccountSection = styled.div`
    width: 100%;
    max-width: 705px;
    margin: 16px auto 32px;
`;

const FormContainer = styled.div`
    gap: 24px;
    margin-top: 24px;
`;

const ActionButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
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

const SuccessMessage = styled.div`
    background: ${({ theme }) => `${theme.success || "#7ED321"}20`};
    border: 1px solid ${({ theme }) => `${theme.success || "#7ED321"}40`};
    color: ${({ theme }) => theme.success || "#7ED321"};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .icon {
        font-size: 20px;
    }
`;

export const Accounts: React.FC = () => {
    const dispatch = useDispatch();
    const { accounts, selectedAccount, selectedNetwork, isLoading } =
        useSelector((state: RootState) => state.wallet);
    const { unlockedAccounts, isAuthenticated, hasAccounts } = useSelector(
        (state: RootState) => state.auth,
    );

    const selectedNetworkId = selectedNetwork?.id;
    const filteredAccounts = useMemo(
        () =>
            selectedNetworkId
                ? accounts.filter(
                      (account) => account.networkId === selectedNetworkId,
                  )
                : accounts,
        [accounts, selectedNetworkId],
    );

    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [showImportPassword, setShowImportPassword] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [pendingAccountName, setPendingAccountName] = useState("");
    const [pendingPrivateKey, setPendingPrivateKey] = useState("");
    const [pendingImport, setPendingImport] = useState<{
        name: string;
        value: string;
        type: "private" | "public" | "eth" | "rev";
    } | null>(null);

    const [newAccountName, setNewAccountName] = useState("");
    const [importName, setImportName] = useState("");
    const [importValue, setImportValue] = useState("");
    const [importType, setImportType] = useState<
        "private" | "public" | "eth" | "rev"
    >("private");
    const [newAccountNameError, setNewAccountNameError] = useState("");
    const [importNameError, setImportNameError] = useState("");
    const [importValueError, setImportValueError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const filteredAccountIds = useMemo(
        () => filteredAccounts.map((account) => account.id).join(","),
        [filteredAccounts],
    );

    useEffect(() => {
        if (unlockedAccounts.length > 0) {
            dispatch(syncAccounts(unlockedAccounts));
        }
    }, [unlockedAccounts, dispatch]);

    useEffect(() => {
        if (filteredAccounts.length > 0 && selectedNetwork) {
            const timeoutId = setTimeout(() => {
                filteredAccounts.forEach((account) => {
                    dispatch(
                        fetchBalance({
                            account,
                            network: selectedNetwork,
                        }) as any,
                    );
                });
            }, 100);

            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNetwork?.id, filteredAccountIds]);

    useEffect(() => {
        if (filteredAccounts.length > 0 && selectedNetwork) {
            const interval = setInterval(() => {
                filteredAccounts.forEach((account) => {
                    dispatch(
                        fetchBalance({
                            account,
                            network: selectedNetwork,
                        }) as any,
                    );
                });
            }, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNetwork?.id, filteredAccountIds]);

    const handleRefreshBalances = () => {
        if (filteredAccounts.length > 0 && selectedNetwork) {
            filteredAccounts.forEach((account) => {
                dispatch(
                    fetchBalance({
                        account,
                        network: selectedNetwork,
                        forceRefresh: true,
                    }) as any,
                );
            });
        }
    };

    const handleCreateAccount = () => {
        const trimmedName = newAccountName.trim();
        const validation = validateAccountName(trimmedName);

        if (!validation.isValid) {
            setNewAccountNameError(validation.error || "Invalid account name");
            return;
        }

        setNewAccountNameError("");
        setPendingAccountName(trimmedName);
        setShowPasswordSetup(true);
    };

    const handlePasswordSet = async (password: string) => {
        if (pendingAccountName) {
            const resultAction = await dispatch(
                createAccountWithPassword({
                    name: pendingAccountName,
                    password,
                    networkId: selectedNetworkId,
                }) as any,
            );

            if (createAccountWithPassword.fulfilled.match(resultAction)) {
                setPendingPrivateKey(
                    resultAction.payload.account.privateKey || "",
                );
                setShowPasswordSetup(false);
                setShowPrivateKey(true);
            }
        } else if (pendingImport) {
            const resultAction = await dispatch(
                importAccountWithPassword({
                    ...pendingImport,
                    password,
                    networkId: selectedNetworkId,
                }) as any,
            );

            if (importAccountWithPassword.fulfilled.match(resultAction)) {
                dispatch(syncAccounts([resultAction.payload.account]));

                setSuccessMessage(
                    `Account "${pendingImport.name}" imported successfully! 🎉`,
                );
                setTimeout(() => setSuccessMessage(""), 5000);
                setImportName("");
                setImportValue("");
                setPendingImport(null);
                setShowImportPassword(false);
            } else if (importAccountWithPassword.rejected.match(resultAction)) {
                const errorMessage =
                    resultAction.error?.message || "Failed to import account";
                if (errorMessage.includes("already exists")) {
                    setImportValueError(errorMessage);
                    setImportNameError("");
                } else {
                    setImportValueError(errorMessage);
                    setImportNameError("");
                }
                setShowImportPassword(false);
            }
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

        // Show success message
        setSuccessMessage(
            `Account "${pendingAccountName}" created successfully! 🎉`,
        );
        setTimeout(() => setSuccessMessage(""), 5000);

        setNewAccountName("");
        setPendingAccountName("");
        setPendingPrivateKey("");
        setShowPrivateKey(false);
    };

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

    const handleImportAccount = () => {
        const trimmedName = newAccountName.trim();
        const trimmedValue = importValue.trim();

        if (!trimmedName || !trimmedValue) {
            return;
        }

        const validation = validateAccountName(trimmedName);
        if (!validation.isValid) {
            setImportNameError(validation.error || "Invalid account name");
            setImportValueError("");
            return;
        }

        const normalizedType =
            importType === getAddressLabel() || importType === "rev"
                ? "rev"
                : (importType as "private" | "eth" | "rev");

        if (checkAccountExistsByValue(trimmedValue, normalizedType)) {
            setImportValueError("Account with this address already exists");
            setImportNameError("");
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
            setShowImportPassword(true);
        } else {
            dispatch(
                importAccountWithPassword({
                    name: trimmedName,
                    value: trimmedValue,
                    type: normalizedType,
                    password: "",
                }) as any,
            ).then((resultAction: any) => {
                if (importAccountWithPassword.fulfilled.match(resultAction)) {
                    dispatch(syncAccounts([resultAction.payload.account]));
                    setSuccessMessage(
                        `Account "${trimmedName}" imported successfully!`,
                    );
                    setTimeout(() => setSuccessMessage(""), 5000);
                    setImportName("");
                    setImportValue("");
                } else if (
                    importAccountWithPassword.rejected.match(resultAction)
                ) {
                    const errorMessage =
                        resultAction.error?.message ||
                        "Failed to import account";
                    if (errorMessage.includes("already exists")) {
                        setImportValueError(errorMessage);
                        setImportNameError("");
                    } else if (errorMessage.includes("Invalid import type")) {
                        setImportValueError(errorMessage);
                        setImportNameError("");
                    } else {
                        setImportValueError(errorMessage);
                        setImportNameError("");
                    }
                }
            });
        }
    };

    const getImportPlaceholder = () => {
        switch (importType) {
            case "private":
                return "Enter private key (64 hex characters)";
            case "public":
                return "Enter public key (130 hex characters)";
            case "eth":
                return "Enter Ethereum address (0x...)";
            case "rev":
                return `Enter ${getAddressLabel()}`;
            default:
                return "Enter value";
        }
    };

    if (showPasswordSetup) {
        return (
            <AccountsContainer>
                <Card>
                    <CardContent>
                        <PasswordSetup
                            title="Set Password for New Account"
                            onPasswordSet={handlePasswordSet}
                            onCancel={() => {
                                setShowPasswordSetup(false);
                                setPendingAccountName("");
                            }}
                        />
                    </CardContent>
                </Card>
            </AccountsContainer>
        );
    }

    if (showPrivateKey) {
        return (
            <AccountsContainer>
                <PrivateKeyDisplay
                    privateKey={pendingPrivateKey}
                    accountName={pendingAccountName}
                    onContinue={handlePrivateKeyAcknowledged}
                    onBack={() => {
                        setShowPrivateKey(false);
                        setShowPasswordSetup(true);
                    }}
                    showBackButton={true}
                />
            </AccountsContainer>
        );
    }

    if (showImportPassword) {
        return (
            <AccountsContainer>
                <Card>
                    <CardContent>
                        <PasswordSetup
                            title="Set Password for Imported Account"
                            onPasswordSet={handlePasswordSet}
                            onCancel={() => {
                                setShowImportPassword(false);
                                setPendingImport(null);
                            }}
                        />
                    </CardContent>
                </Card>
            </AccountsContainer>
        );
    }

    return (
        <AccountsContainer>
            {successMessage && (
                <SuccessMessage>
                    <span className="icon">✅</span>
                    <span>{successMessage}</span>
                </SuccessMessage>
            )}

            {/* Show existing accounts first when they exist */}
            {filteredAccounts.length > 0 && (
                <Card style={{ marginBottom: "32px" }}>
                    <CardHeader>
                        <CardTitle>
                            <h1>Your Accounts ({filteredAccounts.length})</h1>
                        </CardTitle>
                        <Button
                            variant="icon-button-ghost"
                            onClick={handleRefreshBalances}
                            loading={isLoading}
                        >
                            <ReloadIcon />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <AccountsGrid className="accounts-grid">
                            {filteredAccounts.map((account: Account) => (
                                <AccountCard key={account.id} account={account} />
                            ))}
                        </AccountsGrid>
                    </CardContent>
                </Card>
            )}

            {/* Create/Import section below existing accounts */}
            <FormContainer>
                <CreateAccountSection>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <h1>Welcome!</h1>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hasAccounts && !isAuthenticated && (
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
                                className="create-account-name-input text-3"
                                label="Account Name"
                                value={newAccountName}
                                onChange={(e) => {
                                    setNewAccountName(e.target.value);
                                    if (newAccountNameError) {
                                        setNewAccountNameError("");
                                    }
                                }}
                                placeholder="Enter account name (max 30 characters)"
                                error={newAccountNameError}
                                maxLength={30}
                            />
                            <ActionButtons>
                                <Button
                                    id="create-account-button"
                                    onClick={handleCreateAccount}
                                    disabled={!newAccountName.trim()}
                                    fullWidth={false}
                                >
                                    <h3>Create Account </h3>
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
                                    id="import-account-button"
                                    variant="secondary"
                                    onClick={handleImportAccount}
                                    disabled={!newAccountName.trim()}
                                    fullWidth={false}
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
                                                d="M12 16L16 12H13V3H11V12H8L12 16ZM21 3H15V4.99H21V19.02H3V4.99H9V3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM12 16L16 12H13V3H11V12H8L12 16ZM21 3H15V4.99H21V19.02H3V4.99H9V3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3Z"
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
                            </ActionButtons>
                        </CardContent>
                    </Card>
                </CreateAccountSection>
            </FormContainer>
        </AccountsContainer>
    );
};
