import React, { CSSProperties, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    selectAccount,
    selectAccounts,
    selectSelectedAccountId,
} from "store/WalletsStore";
import { fetchBalance } from "store/WalletsStore/thunks";
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
    const dispatch = useAppDispatch();
    const accounts = useSelector(selectAccounts);
    const selectedAccountId = useSelector(selectSelectedAccountId);
    const balances = useSelector(
        (state: RootState) => state.walletsStore.balances,
    );
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    const accountViews: AccountView[] = useMemo(
        () =>
            accounts.map((account) => ({
                id: account.id,
                name: account.name,
                address: account.address,
                balance: balances[account.id] ?? "0",
            })),
        [accounts, balances],
    );

    const fetchAllBalances = async () => {
        if (accounts.length === 0) {
            return;
        }

        setIsLoadingBalances(true);

        const balancePromises = accounts.map((account) =>
            dispatch(fetchBalance({ accountId: account.id })),
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
        fetchAllBalances();
    };

    return (
        <AccountSwitcher
            accounts={accountViews}
            selectedId={selectedAccountId ?? undefined}
            onSelect={handleSelect}
            isLoading={isLoadingBalances}
            onOpen={() => fetchAllBalances()}
            {...props}
        />
    );
};
