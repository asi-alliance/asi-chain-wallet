import { CSSProperties, ReactElement } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import { selectBalanceByAccountId } from "store/WalletsStore/walletsStoreSlice";
import { fetchBalance } from "store/WalletsStore/thunks";
import { AccountBalance } from "components/AccountBalance";
import { IAccountMeta } from "types/wallet";

interface IASIAccountBalanceProps {
    account: IAccountMeta;
    isSelected?: boolean;
    style?: CSSProperties;
    onBalanceUpdate?: () => void;
}

export const ASIAccountBalance = ({
    account,
    isSelected = false,
    style,
    onBalanceUpdate,
}: IASIAccountBalanceProps): ReactElement => {
    const dispatch = useAppDispatch();
    const balance = useSelector((state: RootState) =>
        selectBalanceByAccountId(state, account.id),
    );
    const isLoading = useSelector(
        (state: RootState) => state.walletsStore.isLoading,
    );

    const handleRefresh = () => {
        dispatch(fetchBalance({ accountId: account.id }));
        onBalanceUpdate?.();
    };

    return (
        <AccountBalance
            balance={balance}
            loading={isLoading}
            onRefresh={handleRefresh}
            isSelected={isSelected}
            style={style}
            refreshButtonId={`refresh-balance-account-${account.id}`}
        />
    );
};