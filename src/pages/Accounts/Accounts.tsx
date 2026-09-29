import React, { useState, Fragment, useEffect } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useAppDispatch } from "store/hooks";
import {
    selectAccounts,
    selectActiveWallet,
    selectIsAnyAccountBalanceFetching,
} from "store/WalletsStore";
import { walletsApi, WalletsApiTags } from "store/WalletsStore/api";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";
import { ReloadIcon } from "components/Icons";
import { AccountCard, ACCOUNT_CARD_WIDTH_PX } from "components/AccountCard";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";
import { useSearchParams } from "react-router-dom";
import { DeriveAccountModal } from "components/DeriveAccountModal";
import { ExportWalletKeyfileModal } from "components/ExportWalletKeyfileModal";
import { ImportHdWalletModal } from "components/ImportHdWalletModal";
import { ImportPkWalletModal } from "components/ImportPkWalletModal";
import { ImportKeyfileWalletModal } from "components/ImportKeyfileWalletModal";
import { DeleteAccountModal } from "components/DeleteAccountModal";
import { DeleteWalletModal } from "components/DeleteWalletModal";
import {
    IDeleteAccountRequest,
} from "components/RemoveAccountButton";
import {
    useDeleteAccount,
    useDeleteActiveWallet,
    useIsAnyWalletDeleteInProgress,
    useScreen,
} from "hooks/";
import { FirstHdWalletCreatingWidget } from "components/FirstHdWalletCreatingWidget";
import { WalletTypes } from "@asichain/asi-wallet-sdk";

type ImportMode = "wallet" | "private-key" | "keyfile";

const AccountsContainer = styled.div``;

const AccountSection = styled.section`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xl};
`;

const AccountSectionHeading = styled.h2`
    margin: 0;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.lg};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.lg};
    color: ${({ theme }) => theme.text.primary};
`;

const AccountsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(
        auto-fill,
        minmax(min(100%, ${ACCOUNT_CARD_WIDTH_PX}px), 1fr)
    );
    gap: ${({ theme }) => theme.spacing["2xl"]};
    margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
    max-height: 65vh;
    overflow-y: auto;
    padding: ${({ theme }) => theme.spacing.sm} 0;
    justify-items: start;
    align-items: start;

    & > * {
        height: auto;
        flex-shrink: 0;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: flex;
        flex-direction: column;
        justify-items: stretch;

        & > * {
            width: 100%;
            max-width: none;
        }
    }
`;

const AccountsActionsFooter = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.xl};
    max-width: 860px;
    margin: 0 auto;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const InlineButton = styled(Button)`
    height: ${({ theme }) => theme.sizes.control.field};
    min-width: 0;
    width: 100%;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const BackupAction = styled.div`
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.xl};
    padding-top: ${({ theme }) => theme.spacing.md};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const BackupLabel = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
`;

/** Page-level host so DeleteAccountModal survives the removed account card. */
const AccountDeleteHost: React.FC<{
    request: IDeleteAccountRequest;
    onClosed: () => void;
}> = ({ request, onClosed }) => {
    const deleteAccount = useDeleteAccount(request.walletId, request.accountId);

    useEffect(() => {
        deleteAccount.open();
        // Open once when this host mounts for a concrete account.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only open
    }, []);

    return (
        <DeleteAccountModal
            isOpen={deleteAccount.isOpen}
            accountName={request.accountName}
            isDeleting={deleteAccount.isDeleting}
            error={deleteAccount.error}
            onConfirm={async () => {
                const removed = await deleteAccount.confirm();

                if (removed) {
                    onClosed();
                }
            }}
            onCancel={() => {
                if (!deleteAccount.close()) {
                    return;
                }

                onClosed();
            }}
        />
    );
};

export const Accounts: React.FC = () => {
    const dispatch = useAppDispatch();
    const accounts = useSelector(selectAccounts);
    const activeWallet: IUnlockedWalletMeta | null =
        useSelector(selectActiveWallet);
    const isLoading = useSelector(selectIsAnyAccountBalanceFetching);
    const deleteWallet = useDeleteActiveWallet();
    // Covers this page, HeaderBar, and MobileNav Delete Wallet instances.
    const isWalletDeleteInProgress = useIsAnyWalletDeleteInProgress();

    const { isLaptop } = useScreen();

    const [searchParams] = useSearchParams();
    const actionParam: string | null = searchParams.get("action");

    const [showCreateModal, setShowCreateModal] = useState(
        actionParam === "create-account",
    );
    const [showExportModal, setShowExportModal] = useState(false);
    const [importMode, setImportMode] = useState<ImportMode | null>(null);
    const [exportWalletId, setExportWalletId] = useState<string | null>(null);
    const [deleteWalletMessage, setDeleteWalletMessage] = useState<
        string | undefined
    >();
    const [accountDeleteRequest, setAccountDeleteRequest] =
        useState<IDeleteAccountRequest | null>(null);

    const canDeriveAccount =
        !!activeWallet && activeWallet.type !== WalletTypes.PRIVATE_KEY;
    const primaryAccount = canDeriveAccount
        ? (accounts.find((account) => account.index === 0) ?? accounts[0])
        : accounts[0];
    const subAccounts = canDeriveAccount
        ? accounts.filter((account) => account.id !== primaryAccount?.id)
        : [];

    useEffect(() => {
        if (canDeriveAccount || !showCreateModal) {
            return;
        }

        setShowCreateModal(false);
    }, [canDeriveAccount, showCreateModal]);

    const handleRefreshBalances = () => {
        dispatch(
            walletsApi.util.invalidateTags(
                accounts.map((account: IUnlockedAccountMeta) => ({
                    type: WalletsApiTags.BALANCE,
                    id: account.id,
                })),
            ),
        );
    };

    const handleRequestDeleteWallet = (message: string): void => {
        setDeleteWalletMessage(message);
        deleteWallet.open();
    };

    const handleCloseDeleteWallet = (): void => {
        if (!deleteWallet.close()) {
            return;
        }

        setDeleteWalletMessage(undefined);
    };

    const handleRequestDeleteAccount = (
        request: IDeleteAccountRequest,
    ): void => {
        setAccountDeleteRequest(request);
    };

    const handleOpenExport = (): void => {
        if (!activeWallet) {
            return;
        }

        setExportWalletId(activeWallet.id);
        setShowExportModal(true);
    };

    const handleCloseExport = (): void => {
        setShowExportModal(false);
        setExportWalletId(null);
    };

    return (
        <Fragment>
            <AccountsContainer>
                {accounts.length === 0 && !isWalletDeleteInProgress && (
                    <FirstHdWalletCreatingWidget />
                )}
                {accounts.length > 0 && (
                    <Card
                        style={{ marginBottom: "32px" }}
                        role="region"
                        aria-label="Your Wallet"
                    >
                        <CardHeader>
                            <CardTitle>Your Wallet</CardTitle>
                            <Button
                                title="Refresh Balances"
                                aria-label="Refresh Balances"
                                variant="icon-button-ghost"
                                onClick={handleRefreshBalances}
                                loading={isLoading}
                                spinIconOnLoading
                                withFadeHover
                            >
                                <ReloadIcon />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {primaryAccount && (
                                <AccountsGrid className="accounts-grid">
                                    <AccountCard
                                        key={primaryAccount.id}
                                        account={primaryAccount}
                                        onRequestDeleteWallet={
                                            handleRequestDeleteWallet
                                        }
                                        onRequestDeleteAccount={
                                            handleRequestDeleteAccount
                                        }
                                        onRequestExportWallet={handleOpenExport}
                                    />
                                </AccountsGrid>
                            )}
                            {canDeriveAccount && (
                                <AccountSection aria-label="Your sub-accounts">
                                    <AccountSectionHeading>
                                        Your sub-accounts ({subAccounts.length})
                                    </AccountSectionHeading>
                                    {subAccounts.length > 0 && (
                                        <AccountsGrid className="accounts-grid">
                                            {subAccounts.map((account) => (
                                                <AccountCard
                                                    key={account.id}
                                                    account={account}
                                                    onRequestDeleteWallet={
                                                        handleRequestDeleteWallet
                                                    }
                                                    onRequestDeleteAccount={
                                                        handleRequestDeleteAccount
                                                    }
                                                    onRequestExportWallet={
                                                        handleOpenExport
                                                    }
                                                />
                                            ))}
                                        </AccountsGrid>
                                    )}
                                </AccountSection>
                            )}
                            {!!activeWallet && (
                                <AccountsActionsFooter>
                                    {canDeriveAccount && (
                                        <InlineButton
                                            id="accounts-create-account-button"
                                            onClick={() =>
                                                setShowCreateModal(true)
                                            }
                                            fullWidth={isLaptop}
                                            style={{
                                                flexWrap: "nowrap",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <h3>Create Account </h3>
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M14 8H8V14H6V8H0L0 6H6V0L8 0V6H14V8Z"
                                                    fill="currentcolor"
                                                />
                                            </svg>
                                        </InlineButton>
                                    )}
                                    <InlineButton
                                        id="accounts-import-wallet-button"
                                        variant="secondary"
                                        onClick={() => setImportMode("wallet")}
                                    >
                                        Import Wallet
                                    </InlineButton>
                                    <InlineButton
                                        id="accounts-import-private-key-button"
                                        variant="secondary"
                                        onClick={() => setImportMode("private-key")}
                                    >
                                        Import Private Key
                                    </InlineButton>
                                    <InlineButton
                                        id="accounts-import-keyfile-button"
                                        variant="secondary"
                                        onClick={() => setImportMode("keyfile")}
                                    >
                                        Import Wallet from keyfile
                                    </InlineButton>
                                    <BackupAction>
                                        <BackupLabel>Wallet backup</BackupLabel>
                                        <InlineButton
                                            id="export-wallet-keyfile-button"
                                            variant="secondary"
                                            onClick={handleOpenExport}
                                            fullWidth={isLaptop}
                                            style={{
                                                flexWrap: "nowrap",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <h3>Export Keyfile</h3>
                                        </InlineButton>
                                    </BackupAction>
                                </AccountsActionsFooter>
                            )}
                        </CardContent>
                    </Card>
                )}
            </AccountsContainer>
            <DeriveAccountModal
                isOpen={showCreateModal && canDeriveAccount}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                }}
            />
            {importMode === "wallet" && (
                <ImportHdWalletModal
                    isOpen
                    onClose={() => setImportMode(null)}
                    onCancel={() => setImportMode(null)}
                />
            )}
            {importMode === "private-key" && (
                <ImportPkWalletModal
                    isOpen
                    onClose={() => setImportMode(null)}
                    onCancel={() => setImportMode(null)}
                />
            )}
            {importMode === "keyfile" && (
                <ImportKeyfileWalletModal
                    isOpen
                    onClose={() => setImportMode(null)}
                    onCancel={() => setImportMode(null)}
                />
            )}
            {!!exportWalletId && (
                <ExportWalletKeyfileModal
                    isOpen={showExportModal}
                    walletId={exportWalletId}
                    onClose={handleCloseExport}
                />
            )}
            {accountDeleteRequest && (
                <AccountDeleteHost
                    request={accountDeleteRequest}
                    onClosed={() => setAccountDeleteRequest(null)}
                />
            )}
            <DeleteWalletModal
                isOpen={deleteWallet.isOpen}
                isDeleting={deleteWallet.isDeleting}
                error={deleteWallet.error}
                onConfirm={deleteWallet.confirm}
                onCancel={handleCloseDeleteWallet}
                title="Delete Wallet"
                confirmLabel="Delete Wallet"
                message={deleteWalletMessage}
                idPrefix="accounts-"
            />
        </Fragment>
    );
};
