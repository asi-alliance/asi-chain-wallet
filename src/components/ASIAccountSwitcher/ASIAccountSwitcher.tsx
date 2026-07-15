import React, { CSSProperties, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { selectAccount, fetchBalance } from "store/walletSlice";
import { AccountSwitcher, AccountView } from "components/AccountSwitcher";

interface IASIAccountSwitcherProps {
    adaptive?: boolean;
    layout?: "horizontal" | "vertical";
    fullWidth?: boolean;
    listDirection?: "top" | "bottom";
    wrapperStyle?: CSSProperties;
}

export const ASIAccountSwitcher: React.FC<IASIAccountSwitcherProps> = (
    props,
) => {
    const dispatch = useDispatch();
    const { accounts, selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

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

    const accountViews: AccountView[] = useMemo(
        () =>
            filteredAccounts.map((account) => ({
                id: account.id,
                name: account.name,
                address: account.revAddress,
                balance: account.balance,
            })),
        [filteredAccounts],
    );

    const fetchAllBalances = async (forceRefresh = false) => {
        if (
            !selectedNetwork ||
            !selectedNetwork.readOnlyUrl ||
            filteredAccounts.length === 0
        )
            return;

        setIsLoadingBalances(true);

        const balancePromises = filteredAccounts.map((account) =>
            dispatch(
                fetchBalance({
                    accountId: account.id,
                    address: account.revAddress,
                    network: selectedNetwork,
                    forceRefresh,
                }) as any,
            ),
        );

        try {
            await Promise.all(balancePromises);
        } catch (error) {
            console.error("Error fetching balances:", error);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    const handleSelect = (accountId: string) => {
        dispatch(selectAccount(accountId));
        fetchAllBalances(true);
    };

    return (
        <AccountSwitcher
            accounts={accountViews}
            selectedId={selectedAccount?.id}
            onSelect={handleSelect}
            isLoading={isLoadingBalances}
            onOpen={() => fetchAllBalances(true)}
            {...props}
        />
    );
};
