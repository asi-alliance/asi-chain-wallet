import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    selectAccountById,
    selectAccounts,
    selectIsAccountUnlocked,
    selectSelectedAccountId,
} from "store/WalletsStore/walletsStoreSlice";
import {
    fetchBalance,
    //TODO: Restore fetchTransactionHistory usage once the single active wallet session lands and every account in the slice comes from an SDK Account entity carrying its publicKey.
    // fetchTransactionHistory,
} from "store/WalletsStore/thunks";
import { Card, CardHeader, CardTitle, Button, CardContent } from "components";
import { useNavigate } from "react-router-dom";
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
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedAccountId = useSelector(selectSelectedAccountId);
    const selectedAccount = useSelector((state: RootState) =>
        selectedAccountId ? selectAccountById(state, selectedAccountId) : null,
    );
    const accounts = useSelector(selectAccounts);
    const isAccountUnlocked = useSelector((state: RootState) =>
        selectedAccountId
            ? selectIsAccountUnlocked(state, selectedAccountId)
            : false,
    );

    const { isLaptop } = useScreen();

    useEffect(() => {
        if (selectedAccount && isAccountUnlocked) {
            dispatch(fetchBalance({ accountId: selectedAccount.id }));
            //TODO: Restore fetchTransactionHistory usage once the single active wallet session lands and every account in the slice comes from an SDK Account entity carrying its publicKey.
            // dispatch(
            //     fetchTransactionHistory({ address: selectedAccount.address }),
            // );
        }
    }, [dispatch, selectedAccount, isAccountUnlocked]);

    useEffect(() => {
        if (selectedAccount && isAccountUnlocked) {
            const interval = setInterval(() => {
                dispatch(fetchBalance({ accountId: selectedAccount.id }));
                //TODO: Restore fetchTransactionHistory usage once the single active wallet session lands and every account in the slice comes from an SDK Account entity carrying its publicKey.
                // dispatch(
                //     fetchTransactionHistory({
                //         address: selectedAccount.address,
                //     }),
                // );
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [dispatch, selectedAccount, isAccountUnlocked]);

    const accountIdForActions = useMemo(
        () => selectedAccount?.id ?? accounts[0]?.id,
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
                                title="View transaction history"
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
