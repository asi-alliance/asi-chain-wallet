import React, { CSSProperties, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "store/hooks";
import { selectAccounts, selectSelectedAccountId } from "store/WalletsStore";
import { selectAccount } from "store/WalletsStore/thunks";
import { walletsApi, WalletsApiTags } from "store/WalletsStore/api";
import { selectHasOperationInProgress } from "store/NetworkActivity";
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
    const hasOperationInProgress = useSelector(selectHasOperationInProgress);

    const accountViews: AccountView[] = useMemo(
        () =>
            accounts.map((account) => ({
                id: account.id,
                name: account.name,
                address: account.address,
            })),
        [accounts],
    );

    const refreshBalances = () => {
        dispatch(
            walletsApi.util.invalidateTags(
                accounts.map((account) => ({
                    type: WalletsApiTags.BALANCE,
                    id: account.id,
                })),
            ),
        );
    };

    const handleSelect = (accountId: string) => {
        if (hasOperationInProgress) return;

        dispatch(selectAccount(accountId));
        refreshBalances();
    };

    return (
        <AccountSwitcher
            accounts={accountViews}
            selectedId={selectedAccountId ?? undefined}
            onSelect={handleSelect}
            onOpen={refreshBalances}
            disabled={hasOperationInProgress}
            {...props}
        />
    );
};
