import { ReactElement } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { formatBalanceCompact } from "utils/balanceUtils";
import { selectSelectedNetworkId } from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";

const LoadingSpinner = styled.div`
    width: 12px;
    height: 12px;
    border: 1px solid ${({ theme }) => theme.primary};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

interface IAccountBalanceValueProps {
    accountId: string;
}

export const AccountBalanceValue = ({
    accountId,
}: IAccountBalanceValueProps): ReactElement => {
    const networkId = useSelector(selectSelectedNetworkId);
    const { data: balance, isFetching } = useGetBalanceQuery({
        accountId,
        networkId,
    });

    if (isFetching) {
        return <LoadingSpinner />;
    }

    return <>{formatBalanceCompact(balance ?? "0")}</>;
};
