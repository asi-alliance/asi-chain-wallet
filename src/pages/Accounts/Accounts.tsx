import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { syncAccounts, fetchBalance } from "store/walletSlice";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";
import { ReloadIcon } from "components/Icons";
import { AccountCard } from "components/AccountCard";
import { Account } from "types/wallet";
import { CreateAccountModal } from "components/CreateAccountModal";
import { ImportAccountModal } from "components/ImportAccountModal";
import useScreen from "hooks/useScreen";
import { FirstAccountCreatingWidget } from "components/FirstAccountCreatingWidget";

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
        padding: 0 100px;
    }
`;

export const Accounts: React.FC = () => {
    const dispatch = useDispatch();
    const { accounts, selectedNetwork, isLoading } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);

    const { isLaptop } = useScreen();

    const selectedNetworkId = selectedNetwork?.id;
    const filteredAccounts = useMemo(
        () =>
            selectedNetworkId
                ? accounts.filter(
                      (account: Account) =>
                          account.networkId === selectedNetworkId,
                  )
                : accounts,
        [accounts, selectedNetworkId],
    );

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const filteredAccountIds = useMemo(
        () => filteredAccounts.map((account: Account) => account.id).join(","),
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
                filteredAccounts.forEach((account: Account) => {
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
                filteredAccounts.forEach((account: Account) => {
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
            filteredAccounts.forEach((account: Account) => {
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

    return (
        <Fragment>
            <AccountsContainer>
                {filteredAccounts.length === 0 && (
                    <FirstAccountCreatingWidget />
                )}
                {filteredAccounts.length > 0 && (
                    <Card style={{ marginBottom: "32px" }}>
                        <CardHeader>
                            <CardTitle>
                                <h1>
                                    Your Accounts ({filteredAccounts.length})
                                </h1>
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
                                    <AccountCard
                                        key={account.id}
                                        account={account}
                                    />
                                ))}
                            </AccountsGrid>
                            {/* Create/Import section below existing accounts */}
                            <AccountsActionsFooter>
                                <Button
                                    id="create-account-button"
                                    onClick={() => setShowCreateModal(true)}
                                    fullWidth={isLaptop}
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
                                    onClick={() => setShowImportModal(true)}
                                    fullWidth={isLaptop}
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
                            </AccountsActionsFooter>
                        </CardContent>
                    </Card>
                )}
            </AccountsContainer>
            <CreateAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    console.log("Account created successfully");
                }}
            />

            <ImportAccountModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    console.log("Account imported successfully");
                }}
            />
        </Fragment>
    );
};
