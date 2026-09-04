import { CSSProperties, ReactElement } from "react";
import { useGetBalanceQuery } from "store/WalletsStore/api";
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
    const {
        data: balance = "0",
        isFetching,
        refetch,
    } = useGetBalanceQuery({ accountId: account.id });

    const handleRefresh = () => {
        refetch();
        onBalanceUpdate?.();
    };

    return (
        <AccountBalance
            balance={balance}
            loading={isFetching}
            onRefresh={handleRefresh}
            isSelected={isSelected}
            style={style}
            refreshButtonId={`refresh-balance-account-${account.id}`}
        />
    );
};
