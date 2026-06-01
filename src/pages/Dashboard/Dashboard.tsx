import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { fetchBalance, selectAccount } from "store/walletSlice";
import { Card, CardHeader, CardTitle, Button, CardContent } from "components";
import { useNavigate } from "react-router-dom";
import TransactionHistoryService from "../../services/transactionHistory";
import { AccountCard } from "components/AccountCard";
import { Select } from "components/Select";
import { Account } from "types/wallet";
import { buildUrlWithParams } from "utils/navigationUtils";
import { VectorIcon } from "components/Icons";

const DashboardContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 24px;
    align-items: start;

    @media (min-width: 769px) {
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 16px;
    margin-top: 24px;
`;

const ContentHeader = styled.div`
    width: 100%;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 71px;
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

const FilterLabel = styled.label`
    // font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;

const ActionsToolbar = styled.div`
    display: flex;
    padding: 0 100px;
    justify-content: center;
    align-items: center;
    gap: 16px;
`;

export const Dashboard: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedAccount, selectedNetwork, accounts } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);
    const isAccountUnlocked = useMemo(() => {
        if (!selectedAccount) return false;
        return unlockedAccounts.some(
            (account) => account.id === selectedAccount.id,
        );
    }, [unlockedAccounts, selectedAccount]);

    useEffect(() => {
        if (
            selectedAccount &&
            selectedAccount.revAddress &&
            selectedNetwork &&
            isAccountUnlocked
        ) {
            const oldBalance = selectedAccount.balance || "0";

            if (selectedNetwork.graphqlUrl) {
                TransactionHistoryService.syncFromBlockchain(
                    selectedAccount.revAddress,
                    selectedAccount.publicKey,
                    selectedNetwork.name,
                    selectedNetwork.graphqlUrl,
                )
                    .then((result) => {
                        if (result.added > 0 || result.updated > 0) {
                            console.log(
                                `[Dashboard] Synced ${result.added} new, ${result.updated} updated transactions from blockchain`,
                            );
                        }
                    })
                    .catch((error) => {
                        console.error(
                            "[Dashboard] Error syncing from blockchain:",
                            error,
                        );
                    });
            }

            if (selectedNetwork.readOnlyUrl) {
                dispatch(
                    fetchBalance({
                        account: selectedAccount,
                        network: selectedNetwork,
                    }) as any,
                ).then((result: any) => {
                    if (result.payload) {
                        const newBalance = result.payload.balance;

                        if (parseFloat(newBalance) > parseFloat(oldBalance)) {
                            console.log(
                                `[Dashboard] Balance increased for ${selectedAccount.name}, checking for received transactions...`,
                            );
                            try {
                                TransactionHistoryService.detectReceivedTransaction(
                                    selectedAccount.revAddress,
                                    oldBalance,
                                    newBalance,
                                    selectedNetwork.name,
                                );
                            } catch (error) {
                                console.error(
                                    `[Dashboard] Error detecting received transaction for ${selectedAccount.name}:`,
                                    error,
                                );
                            }
                        }
                    }
                });
            }
        }
    }, [dispatch, selectedAccount, selectedNetwork, isAccountUnlocked]);

    useEffect(() => {
        if (
            selectedAccount &&
            selectedAccount.revAddress &&
            selectedNetwork &&
            isAccountUnlocked &&
            selectedNetwork.readOnlyUrl
        ) {
            const interval = setInterval(() => {
                if (selectedAccount && selectedAccount.revAddress) {
                    const oldBalance = selectedAccount.balance || "0";

                    dispatch(
                        fetchBalance({
                            account: selectedAccount,
                            network: selectedNetwork,
                        }) as any,
                    ).then((result: any) => {
                        if (result.payload) {
                            const newBalance = result.payload.balance;

                            if (
                                parseFloat(newBalance) > parseFloat(oldBalance)
                            ) {
                                console.log(
                                    `[Dashboard Auto-refresh] Balance increased for ${selectedAccount.name}, checking for received transactions...`,
                                );
                                try {
                                    TransactionHistoryService.detectReceivedTransaction(
                                        selectedAccount.revAddress,
                                        oldBalance,
                                        newBalance,
                                        selectedNetwork.name,
                                    );
                                } catch (error) {
                                    console.error(
                                        `[Dashboard Auto-refresh] Error detecting received transaction for ${selectedAccount.name}:`,
                                        error,
                                    );
                                }
                            }
                        }
                    });
                }
            }, 30000); // 30 seconds

            return () => clearInterval(interval);
        }
    }, [dispatch, selectedAccount, selectedNetwork, isAccountUnlocked]);

    const accountOptions = useMemo(
        () =>
            accounts.map((account: Account) => ({
                id: account.id,
                value: account.id,
                label: account.name,
            })),
        [accounts],
    );

    const accountIdForActions = useMemo(
        () => selectedAccount?.id ?? accounts[0].id,
        [selectedAccount, accounts],
    );

    const accountForActions: Account = useMemo(
        () =>
            accounts.find(
                (account: Account) => account.id === accountIdForActions,
            ) ?? accounts[0],
        [accounts, accountIdForActions],
    );

    if (!selectedAccount) {
        return (
            <div>
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
            <DashboardContainer>
                <AccountCard account={selectedAccount} fullMode={false} />
                <Card>
                    <CardContent>
                        <ContentHeader>
                            <FilterGroup>
                                <FilterLabel>
                                    <h4 className="light">Account</h4>
                                </FilterLabel>
                                <Select
                                    id="history-filter-account-select"
                                    value={accountForActions.id}
                                    onChange={(accountId: string) => {
                                        dispatch(selectAccount(accountId));
                                    }}
                                    placeholder="Select account"
                                    options={accountOptions}
                                />
                            </FilterGroup>
                            <Button
                                id="import-account-button"
                                variant="secondary"
                                onClick={() => navigate("/accounts")}
                                style={{
                                    padding: "8px 0px",
                                    minWidth: "136px",
                                }}
                            >
                                <h3>View all</h3>
                            </Button>
                        </ContentHeader>
                        <ActionsToolbar>
                            <Button
                                id="create-account-modal-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/send")
                                }
                                fullWidth={false}
                                style={{ minWidth: "150px" }}
                            >
                                <h3>Send</h3>
                                <VectorIcon />
                            </Button>
                            <Button
                                id="create-account-modal-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/receive")
                                }
                                fullWidth={false}
                                style={{ minWidth: "150px" }}
                            >
                                <h3>Receive</h3>
                                <div style={{ transform: "rotate(180deg)" }}>
                                    <VectorIcon />
                                </div>
                            </Button>
                        </ActionsToolbar>
                    </CardContent>
                </Card>
            </DashboardContainer>
        </div>
    );
};
