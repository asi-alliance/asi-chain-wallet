import React, { useState, Fragment } from "react";
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
import { AccountCard } from "components/AccountCard";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";
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
    const activeWallet: IUnlockedWalletMeta | null =
        useSelector(selectActiveWallet);
    const isLoading = useSelector(selectIsAnyAccountBalanceFetching);

    const { isLaptop } = useScreen();

    const [searchParams] = useSearchParams();
    const actionParam: string | null = searchParams.get("action");

    const [showCreateModal, setShowCreateModal] = useState(
        actionParam === "create-account",
    );

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
                                {accounts.map((account: IUnlockedAccountMeta) => (
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
