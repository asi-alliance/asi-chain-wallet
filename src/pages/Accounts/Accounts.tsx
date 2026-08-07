import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import { selectAccounts, selectActiveWallet } from "store/WalletsStore";
import { fetchBalance } from "store/WalletsStore/thunks";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";
import { ReloadIcon } from "components/Icons";
import { AccountCard } from "components/AccountCard";
import { IAccountMeta, IWalletMeta } from "types/wallet";
import { useSearchParams } from "react-router-dom";
import { DeriveAccountModal } from "components/DeriveAccountModal";
import { useScreen } from "hooks/";
import { FirstHdWalletCreatingWidget } from "components/FirstHdWalletCreatingWidget";
import { WalletTypes } from "@asichain/asi-wallet-sdk";

const AccountsContainer = styled.div``;

const AccountsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(462px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
    max-height: 65vh;
    overflow-y: auto;
    padding: 6px 0;

    align-items: start;

    & > * {
        height: auto;
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;

        & > * {
            width: 100%;
        }
    }
`;

const AccountsActionsFooter = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 16px;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 0 3rem;
    }
`;

const InlineButton = styled(Button)`
    height: 44px;
    min-width: 242px;

    @media (max-width: 768px) {
        min-width: auto;
        width: 100%;
    }
`;

export const Accounts: React.FC = () => {
    const dispatch = useAppDispatch();
    const accounts = useSelector(selectAccounts);
    const selectedNetwork = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork,
    );
    const activeWallet: IWalletMeta | null = useSelector(selectActiveWallet);
    const isLoading = useSelector(
        (state: RootState) => state.walletsStore.isLoading,
    );

    const { isLaptop } = useScreen();

    const [searchParams] = useSearchParams();
    const actionParam: string | null = searchParams.get("action");

    const [showCreateModal, setShowCreateModal] = useState(
        actionParam === "create-account",
    );

    const accountIds = useMemo(
        () => accounts.map((account: IAccountMeta) => account.id).join(","),
        [accounts],
    );

    useEffect(() => {
        if (accounts.length > 0) {
            const timeoutId = setTimeout(() => {
                accounts.forEach((account: IAccountMeta) => {
                    dispatch(fetchBalance({ accountId: account.id }));
                });
            }, 100);

            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNetwork?.id, accountIds]);

    useEffect(() => {
        if (accounts.length > 0) {
            const interval = setInterval(() => {
                accounts.forEach((account: IAccountMeta) => {
                    dispatch(fetchBalance({ accountId: account.id }));
                });
            }, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNetwork?.id, accountIds]);

    const handleRefreshBalances = () => {
        accounts.forEach((account: IAccountMeta) => {
            dispatch(fetchBalance({ accountId: account.id }));
        });
    };

    return (
        <Fragment>
            <AccountsContainer>
                {accounts.length === 0 && <FirstHdWalletCreatingWidget />}
                {accounts.length > 0 && (
                    <Card style={{ marginBottom: "32px" }}>
                        <CardHeader>
                            <CardTitle>
                                Your Accounts ({accounts.length})
                            </CardTitle>
                            <Button
                                title="Refresh Balances"
                                variant="icon-button-ghost"
                                onClick={handleRefreshBalances}
                                loading={isLoading}
                                withFadeHover
                            >
                                <ReloadIcon />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <AccountsGrid className="accounts-grid">
                                {accounts.map((account: IAccountMeta) => (
                                    <AccountCard
                                        key={account.id}
                                        account={account}
                                    />
                                ))}
                            </AccountsGrid>
                            {!!activeWallet &&
                                activeWallet.type !==
                                    WalletTypes.PRIVATE_KEY && (
                                    <AccountsActionsFooter>
                                        <InlineButton
                                            id="create-account-button"
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
                                            >
                                                <path
                                                    d="M14 8H8V14H6V8H0L0 6H6V0L8 0V6H14V8Z"
                                                    fill="currentcolor"
                                                />
                                            </svg>
                                        </InlineButton>
                                    </AccountsActionsFooter>
                                )}
                        </CardContent>
                    </Card>
                )}
            </AccountsContainer>
            <DeriveAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    console.info("Account created successfully");
                }}
            />
        </Fragment>
    );
};
