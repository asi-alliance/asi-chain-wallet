import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { fetchBalance } from "store/walletSlice";
import { Card, CardHeader, CardTitle, Button, CardContent } from "components";
import { useNavigate } from "react-router-dom";
import TransactionHistoryService from "../../services/transactionHistory";
import { AccountCard } from "components/AccountCard";
import { buildUrlWithParams } from "utils/navigationUtils";
import { HistoryIcon, VectorIcon } from "components/Icons";
import { useScreen } from "hooks/";

import { AccountSelector } from "components/AccountSelector";

const DashboardContainer = styled.div`
    display: block;

    @media (min-width: 1023px) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
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

    @media (max-width: 1023px) {
        margin-bottom: 24px;
    }
`;

const ActionsToolbar = styled.div`
    display: flex;
    padding: 0 20px;
    justify-content: center;
    align-items: center;
    gap: 16px;
`;

const CustomAccountCard = styled(AccountCard)`
    @media (max-width: 1023px) {
        margin-bottom: 25px;
    }
`;

export const Dashboard: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedAccount, selectedNetwork, accounts } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);

    const { isLaptop } = useScreen();

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

    const accountIdForActions = useMemo(
        () => selectedAccount?.id ?? accounts[0].id,
        [selectedAccount, accounts],
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
                <CustomAccountCard account={selectedAccount} fullMode={false} />
                <Card>
                    <CardContent>
                        <ContentHeader>
                            <AccountSelector fullWidth />
                            {!isLaptop && (
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
                            )}
                        </ContentHeader>
                        <ActionsToolbar>
                            <Button
                                id="send-action-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/send")
                                }
                                fullWidth={false}
                                style={isLaptop ? {} : { minWidth: "150px" }}
                            >
                                <h3>Send</h3>
                                <VectorIcon />
                            </Button>
                            <Button
                                id="receive-action-button"
                                onClick={() =>
                                    handleRedirectToAccountAction("/receive")
                                }
                                fullWidth={false}
                                style={isLaptop ? {} : { minWidth: "150px" }}
                            >
                                <h3>Receive</h3>
                                <div style={{ transform: "rotate(180deg)" }}>
                                    <VectorIcon />
                                </div>
                            </Button>
                            <Button
                                id="history-button"
                                onClick={() => {
                                    navigate("/history");
                                }}
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
