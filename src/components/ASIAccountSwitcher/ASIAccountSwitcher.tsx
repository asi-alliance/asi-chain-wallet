import React, { CSSProperties, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "store/hooks";
import { selectAccounts, selectSelectedAccountId } from "store/WalletsStore";
import { selectAccount } from "store/WalletsStore/thunks";
import { walletsApi, WalletsApiTags } from "store/WalletsStore/api";
import { AccountSwitcher, AccountView } from "components/AccountSwitcher";
import {
    OperationInProgressModal,
    SWITCH_ACCOUNT_OPERATION_PROMPT,
} from "components/OperationInProgressModal";
import { useOperationGuard } from "hooks";

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

    const switchAccount = (accountId: string): void => {
        dispatch(selectAccount(accountId));
        refreshBalances();
    };

    const switchAccountGuard = useOperationGuard(switchAccount);

    const handleSelect = (accountId: string) => {
        if (accountId === selectedAccountId) {
            switchAccount(accountId);

            return;
        }

        switchAccountGuard.run(accountId);
    };

    return (
        <>
            <AccountSwitcher
                accounts={accountViews}
                selectedId={selectedAccountId ?? undefined}
                onSelect={handleSelect}
                onOpen={refreshBalances}
                {...props}
            />
            <OperationInProgressModal
                {...switchAccountGuard.prompt}
                {...SWITCH_ACCOUNT_OPERATION_PROMPT}
            />
        </>
    );
};
