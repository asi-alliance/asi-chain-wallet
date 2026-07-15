import { CSSProperties, ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { fetchBalance } from "store/walletSlice";
import { AccountBalance } from "components/AccountBalance";
import { Account } from "types/wallet";

interface IASIAccountBalanceProps {
    account: Account;
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
    const dispatch = useDispatch();
    const { selectedNetwork, isLoading } = useSelector(
        (state: RootState) => state.wallet,
    );

    const handleRefresh = () => {
        dispatch(
            fetchBalance({
                accountId: account.id,
                address: account.revAddress,
                network: selectedNetwork,
                forceRefresh: true,
            }) as any,
        );
        onBalanceUpdate?.();
    };

    return (
        <AccountBalance
            balance={account.balance}
            loading={isLoading}
            onRefresh={handleRefresh}
            isSelected={isSelected}
            style={style}
            refreshButtonId={`refresh-balance-account-${account.id}`}
        />
    );
};
