import React, { useState } from "react";
import styled from "styled-components";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Alert,
    PageContent,
    FormActions,
} from "components";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import { CreateHdWalletForm } from "components/CreateHdWalletForm";
import { CreatePkWalletForm } from "components/CreatePkWalletForm";
import { ImportHdWalletForm } from "components/ImportHdWalletForm";
import { ImportPkWalletForm } from "components/ImportPkWalletForm";
import { ImportKeyfileWalletForm } from "components/ImportKeyfileWalletForm";

const WidgetContainer = styled(PageContent)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing["3xl"]};
`;

const FormContainer = styled.div`
    padding: 0;
`;

const WelcomeSubtitle = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const FieldLabel = styled.label`
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const TypeSection = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
`;

const DifferenceTitle = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
`;

const DifferenceList = styled.ul`
    margin: 0;
    padding-left: ${({ theme }) => theme.spacing["2xl"]};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const DifferenceItem = styled.li`
    margin-bottom: ${({ theme }) => theme.spacing.md};

    &:last-child {
        margin-bottom: 0;
    }
`;

interface FirstHdWalletCreatingWidgetProps {
    onSuccess?: () => void;
}

type WalletKind = "hd" | "private_key";

type FormMode =
    | "create"
    | "create_private_key"
    | "import"
    | "import_private_key"
    | "import_keyfile";

const WALLET_KIND_OPTIONS: ISelectOption[] = [
    { id: "hd", value: "hd", label: "HD wallet" },
    { id: "private_key", value: "private_key", label: "Private key wallet" },
];

export const FirstHdWalletCreatingWidget: React.FC<
    FirstHdWalletCreatingWidgetProps
> = ({ onSuccess }) => {
    const [activeMode, setActiveMode] = useState<FormMode | null>(null);
    const [walletKind, setWalletKind] = useState<WalletKind>("hd");

    const handleCreateSuccess = () => {
        onSuccess?.();
    };

    const handleImportSuccess = () => {
        onSuccess?.();
    };

    if (!activeMode) {
        return (
            <WidgetContainer>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormContainer>
                            <WelcomeSubtitle>
                                Create your first wallet
                            </WelcomeSubtitle>

                            <TypeSection>
                                <FieldLabel htmlFor="welcome-account-type-button">
                                    Account Type
                                </FieldLabel>
                                <Select
                                    id="welcome-account-type"
                                    aria-label="Account Type"
                                    value={walletKind}
                                    onChange={(value) =>
                                        setWalletKind(value as WalletKind)
                                    }
                                    options={WALLET_KIND_OPTIONS}
                                    style={{
                                        width: "100%",
                                        marginBottom: "16px",
                                    }}
                                />
                                <Alert
                                    tone="info"
                                    icon="ℹ️"
                                    style={{ alignItems: "flex-start" }}
                                >
                                    <DifferenceTitle>
                                        What is the difference between wallets?
                                    </DifferenceTitle>
                                    <DifferenceList>
                                        <DifferenceItem>
                                            HD wallet. The secret is a 12- or
                                            24-word mnemonic phrase. From this
                                            phrase, you can derive any number of
                                            accounts from the derived key tree,
                                            each with its own sequential index,
                                            starting with zero.
                                        </DifferenceItem>
                                        <DifferenceItem>
                                            Private key wallet. The secret is a
                                            single private key. Each key
                                            produces exactly one address, so
                                            such a wallet always consists of a
                                            single account and can never contain
                                            a second one.
                                        </DifferenceItem>
                                    </DifferenceList>
                                </Alert>
                            </TypeSection>

                            <FormActions>
                                {walletKind === "hd" ? (
                                    <>
                                        <Button
                                            id="create-account-button"
                                            onClick={() =>
                                                setActiveMode("create")
                                            }
                                            fullWidth
                                        >
                                            Create Wallet
                                        </Button>
                                        <Button
                                            id="import-account-button"
                                            variant="secondary"
                                            onClick={() =>
                                                setActiveMode("import")
                                            }
                                            fullWidth
                                        >
                                            Import Wallet
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            id="create-private-key-account-button"
                                            onClick={() =>
                                                setActiveMode(
                                                    "create_private_key",
                                                )
                                            }
                                            fullWidth
                                        >
                                            Create Private Key Wallet
                                        </Button>
                                        <Button
                                            id="import-private-key-account-button"
                                            variant="secondary"
                                            onClick={() =>
                                                setActiveMode(
                                                    "import_private_key",
                                                )
                                            }
                                            fullWidth
                                        >
                                            Import Private Key
                                        </Button>
                                    </>
                                )}
                                <Button
                                    id="import-keyfile-wallet-button"
                                    variant="full-ghost"
                                    onClick={() =>
                                        setActiveMode("import_keyfile")
                                    }
                                    fullWidth
                                >
                                    Import Wallet from keyfile
                                </Button>
                            </FormActions>
                        </FormContainer>
                    </CardContent>
                </Card>
            </WidgetContainer>
        );
    }

    return (
        <WidgetContainer>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeMode === "create" && "Create Wallet"}
                        {activeMode === "create_private_key" &&
                            "Create Private Key Wallet"}
                        {activeMode === "import" && "Import Wallet"}
                        {activeMode === "import_private_key" &&
                            "Import Private Key"}
                        {activeMode === "import_keyfile" &&
                            "Import Wallet from keyfile"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FormContainer>
                        {activeMode === "create" && (
                            <CreateHdWalletForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setActiveMode(null)}
                            />
                        )}
                        {activeMode === "create_private_key" && (
                            <CreatePkWalletForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setActiveMode(null)}
                            />
                        )}
                        {activeMode === "import" && (
                            <ImportHdWalletForm
                                onSuccess={handleImportSuccess}
                                onCancel={() => setActiveMode(null)}
                            />
                        )}
                        {activeMode === "import_private_key" && (
                            <ImportPkWalletForm
                                onSuccess={handleImportSuccess}
                                onCancel={() => setActiveMode(null)}
                            />
                        )}
                        {activeMode === "import_keyfile" && (
                            <ImportKeyfileWalletForm
                                onWalletImported={handleImportSuccess}
                                onAccountsImported={handleImportSuccess}
                                onCancel={() => setActiveMode(null)}
                            />
                        )}
                    </FormContainer>
                </CardContent>
            </Card>
        </WidgetContainer>
    );
};
