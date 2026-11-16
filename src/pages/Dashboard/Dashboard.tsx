import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import {
    selectAccounts,
    selectIsAccountUnlocked,
    selectSelectedAccount,
    selectSelectedNetworkId,
} from "store/WalletsStore";
import {
    IAccountQueryArgs,
    IHistoryQueryArgs,
    useGetBalanceQuery,
    useGetTransactionHistoryQuery,
} from "store/WalletsStore/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    VisuallyHidden,
} from "components";
import { useNavigate } from "react-router-dom";
import { AccountCard } from "components/AccountCard";
import { buildUrlWithParams } from "utils/navigationUtils";
import { HistoryIcon, ReceiveIcon, SendIcon } from "components/Icons";
import { ACCOUNT_DATA_POLLING_INTERVAL_MS } from "constants/polling";
import { useScreen } from "hooks";
import { AccountSelector } from "components/AccountSelector";

const DashboardContainer = styled.div`
    display: block;
    max-width: ${({ theme }) => theme.layout.contentWide};
    margin: 0 auto;

    @media (min-width: ${({ theme }) => theme.breakpoints.laptop}) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${({ theme }) => theme.spacing["3xl"]};
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing.xl};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};
`;

const ContentHeader = styled.div`
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.xl};
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};

    > :first-child {
        flex: 1;
        min-width: 0;
    }
`;

const ActionsToolbar = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xl};
`;

const ActionButton = styled(Button)`
    min-width: 150px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        min-width: 0;
        flex: 1;
    }
`;

const CustomAccountCard = styled(AccountCard)`
    max-width: none;

    /* Stack margin only below the two-column grid (min-width: laptop). */
    @media (max-width: ${({ theme }) =>
            `${Number.parseInt(theme.breakpoints.laptop, 10) - 1}px`}) {
        margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
    }
`;

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const selectedAccount = useSelector(selectSelectedAccount);
    const accounts = useSelector(selectAccounts);
    const networkId = useSelector(selectSelectedNetworkId);
    const isAccountUnlocked = useSelector((state: RootState) =>
        selectedAccount
            ? selectIsAccountUnlocked(state, selectedAccount.id)
            : false,
    );

    // isLaptop is true at mobile widths (≤768px); View All is desktop-only (Current p26/p27).
    const { isLaptop } = useScreen();

    const balanceArgs: IAccountQueryArgs | typeof skipToken =
        selectedAccount && isAccountUnlocked
            ? { accountId: selectedAccount.id, networkId }
            : skipToken;

    const historyArgs: IHistoryQueryArgs | typeof skipToken =
        selectedAccount && isAccountUnlocked
            ? {
                  accountId: selectedAccount.id,
                  networkId,
                  source: "all",
              }
            : skipToken;

    // Keep balance/history caches warm for Wallet and Transactions.
    useGetBalanceQuery(balanceArgs, {
        pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS,
    });
    useGetTransactionHistoryQuery(historyArgs, {
        pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS,
    });

    const accountIdForActions = useMemo(
        () => selectedAccount?.id ?? accounts[0]?.id,
        [selectedAccount, accounts],
    );

    if (!selectedAccount) {
        return (
            <div>
                <VisuallyHidden as="h1">Wallet</VisuallyHidden>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to ASI Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            No accounts found. Create or import an account to
                            get started.
                        </p>
                        <ActionButtons>
                            <Button onClick={() => navigate("/accounts")}>
                                Accounts
                            </Button>
                        </ActionButtons>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleRedirectToAccountAction = (prefix: string): void => {
        navigate(
            buildUrlWithParams(prefix, {
                queryParams: [
                    {
                        key: "id",
                        value: accountIdForActions,
                    },
                ],
            }),
        );
    };

    return (
        <div>
            <VisuallyHidden as="h1">Wallet</VisuallyHidden>
            <DashboardContainer>
                <CustomAccountCard account={selectedAccount} fullMode={false} />
                <Card>
                    <CardContent>
                        <ContentHeader>
                            <AccountSelector fullWidth />
                            {!isLaptop && (
                                <Button
                                    id="view-all-accounts-button"
                                    variant="secondary"
                                    onClick={() => navigate("/accounts")}
                                >
                                    View All
                                </Button>
                            )}
                        </ContentHeader>
                        <ActionsToolbar aria-label="Wallet actions">
                            <ActionButton
                                id="send-action-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/send")
                                }
                                fullWidth={false}
                            >
                                Send
                                <SendIcon />
                            </ActionButton>
                            <ActionButton
                                id="receive-action-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/receive")
                                }
                                fullWidth={false}
                            >
                                Receive
                                <ReceiveIcon />
                            </ActionButton>
                            <Button
                                id="history-button"
                                title="View transaction history"
                                aria-label="History"
                                onClick={() => navigate("/history")}
                                variant="icon-button-black"
                                fullWidth={false}
                                secondaryHover
                            >
                                <HistoryIcon />
                            </Button>
                        </ActionsToolbar>
                    </CardContent>
                </Card>
            </DashboardContainer>
        </div>
    );
};
